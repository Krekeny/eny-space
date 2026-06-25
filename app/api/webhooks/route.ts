import type { Stripe } from "stripe";

import { NextResponse } from "next/server";

import { randomBytes } from "crypto";

import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePdsSlug, pdsHostnameForSlug } from "@/lib/pds-slug";
import { getPlanCatalogEntry } from "@/lib/plan-catalog";
import {
  userIdForCustomer,
  startPdsGrace,
  reactivatePds,
} from "@/lib/pds-lifecycle-server";

const PDS_API_BASE_URL = process.env.PDS_API_BASE_URL;

function normalizeDeployHostname(raw: string) {
  let h = raw.trim();
  h = h.replace(/^https?:\/\//i, "");
  h = h.replace(/\/.*$/, "");
  return h.replace(/\/$/, "");
}

function isValidFqdn(host: string) {
  if (!host || host.length > 253) return false;
  if (host.endsWith(".")) return false;
  const parts = host.split(".");
  if (parts.length < 2) return false;
  return parts.every((label) => {
    if (!label || label.length > 63) return false;
    if (!/^[a-z0-9-]+$/i.test(label)) return false;
    if (label.startsWith("-") || label.endsWith("-")) return false;
    return true;
  });
}

function extractServiceId(body: unknown, depth = 0): number | null {
  if (body == null || depth > 4) return null;
  if (typeof body === "number") return Number.isFinite(body) ? body : null;
  if (typeof body === "string") {
    const n = Number(body.trim());
    return body.trim() !== "" && Number.isFinite(n) ? n : null;
  }
  if (typeof body !== "object") return null;
  const obj = body as Record<string, unknown>;
  for (const key of ["service_id", "serviceId", "pds_service_id", "pdsServiceId"]) {
    if (key in obj) {
      const v = extractServiceId(obj[key], depth + 1);
      if (v != null) return v;
    }
  }
  if ("id" in obj) {
    const v = extractServiceId(obj.id, depth + 1);
    if (v != null) return v;
  }
  for (const key of ["data", "result", "service", "pds", "payload"]) {
    if (key in obj) {
      const v = extractServiceId(obj[key], depth + 1);
      if (v != null) return v;
    }
  }
  return null;
}

async function provisionPdsForUser({
  userId,
  userEmail,
  pdsUsername,
  pdsHostnameBase,
  planKey,
}: {
  userId: string;
  userEmail: string;
  pdsUsername: string;
  pdsHostnameBase: string;
  planKey: string;
}) {
  if (!PDS_API_BASE_URL) {
    throw new Error("Missing PDS_API_BASE_URL env var");
  }

  const apiToken = process.env.PDS_API_TOKEN;
  if (!apiToken) {
    throw new Error("Missing PDS_API_TOKEN env var");
  }

  const password = randomBytes(16).toString("base64url");
  const hostname = normalizeDeployHostname(pdsHostnameBase);
  if (!isValidFqdn(hostname)) {
    throw new Error(
      `Invalid hostname for deploy after normalization: "${hostname}" (raw="${pdsHostnameBase}")`,
    );
  }

  const plan = getPlanCatalogEntry(planKey);
  const disksize = plan.pdsDiskSizeGb;

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("pds_services")
    .select("pds_service_id, lifecycle_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.pds_service_id && existing.lifecycle_status !== "deleted") {
    return { skipped: true, pds_service_id: existing.pds_service_id };
  }

  console.log(
    `[pds-backend] → POST /deploy  hostname=${hostname}  username=${pdsUsername}`,
  );
  const deployRes = await fetch(`${PDS_API_BASE_URL}/deploy`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      username: pdsUsername,
      password,
      email: userEmail,
      hostname,
      disksize,
    }),
  });
  console.log(
    `[pds-backend] ← /deploy ${deployRes.status}  hostname=${hostname}`,
  );

  // Read as text, then parse JSON regardless of content-type — some backends
  // return JSON without an `application/json` header, which would otherwise be
  // kept as a plain string and yield no service id.
  const deployRaw = await deployRes.text();
  let deployBody: unknown;
  try {
    deployBody = JSON.parse(deployRaw);
  } catch {
    deployBody = deployRaw;
  }

  if (!deployRes.ok) {
    await supabase.from("pds_services").upsert({ user_id: userId, hostname });
    // Don't include the response body — it can carry confidential infra data.
    throw new Error(
      `PDS deploy failed (${deployRes.status}) for hostname "${hostname}"`,
    );
  }

  const pds_service_id = extractServiceId(deployBody);
  console.log(
    `[pds-backend] deploy stored  hostname=${hostname}  service_id=${pds_service_id}`,
  );
  if (pds_service_id == null) {
    // Deploy succeeded but no id parsed — the row would be unusable (dashboard
    // 404). Surfaced without logging the raw (confidential) response.
    console.error(
      `[pds-backend] no service id parsed from deploy response for ${hostname}`,
    );
  }

  await supabase.from("pds_services").upsert({
    user_id: userId,
    pds_service_id,
    hostname,
    created_at: new Date().toISOString(),
  });

  return { skipped: false, pds_service_id };
}

export async function POST(req: Request) {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      await (await req.blob()).text(),
      req.headers.get("stripe-signature") as string,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.log(`❌ Webhook Error: ${errorMessage}`);
    return NextResponse.json(
      { message: `Webhook Error: ${errorMessage}` },
      { status: 400 },
    );
  }

  console.log("✅ Webhook received:", event.type);

  const supabase = createAdminClient();

  // Only handle checkout completion to store customer_id
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.mode === "subscription" && session.customer) {
      const userId = session.metadata?.user_id;
      const userEmail = session.metadata?.user_email;
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer.id;

      if (userId && customerId) {
        // Store user_id -> stripe_customer_id mapping (minimal)
        // Avoid creating duplicate rows if the webhook is delivered more than once.
        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();

        if (!existingSub) {
          const { error } = await supabase
            .from("subscriptions")
            .insert({ user_id: userId, stripe_customer_id: customerId });
          if (error) console.error("Error inserting customer ID:", error);
          else console.log(`✅ Customer ID stored for user ${userId}`);
        } else {
          const { error } = await supabase
            .from("subscriptions")
            .update({ stripe_customer_id: customerId })
            .eq("id", existingSub.id);
          if (error) console.error("Error updating customer ID:", error);
        }

        // Next step: provision the user's PDS
        if (userEmail) {
          const fallbackUsername = normalizePdsSlug(
            userEmail.split("@")[0] || "pds",
          );
          const pdsUsername = normalizePdsSlug(
            session.metadata?.pds_username || fallbackUsername,
          );
          const pdsHostnameBase =
            session.metadata?.pds_hostname_base ||
            pdsHostnameForSlug(pdsUsername);
          const planKey = session.metadata?.pds_plan || "personal";

          try {
            console.log(`✅ Provisioning PDS for user ${userId}...`);
            await provisionPdsForUser({
              userId,
              userEmail,
              pdsUsername,
              pdsHostnameBase,
              planKey,
            });
          } catch (e) {
            console.error(`❌ Provisioning PDS failed for ${userId}:`, e);
          }
        } else {
          console.warn(
            `⚠️ Missing user_email metadata in checkout session for user ${userId}.`,
          );
        }

        // Resubscribe: clear any in-progress lifecycle and reactivate the PDS.
        await reactivatePds(userId);
      }
    }
  }

  // Post-subscription lifecycle transitions.
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    // Deliberate cancellation reaching period end. (A past_due grace already in
    // progress is left untouched by startPdsGrace's guard.)
    const userId = await userIdForCustomer(customerId);
    console.log(
      `🚫 Subscription canceled — customer ${customerId}, user ${userId ?? "UNKNOWN (no PDS row)"}`,
    );
    if (userId) await startPdsGrace(userId, "canceled");
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId =
      typeof invoice.customer === "string"
        ? invoice.customer
        : invoice.customer?.id;
    const userId = customerId ? await userIdForCustomer(customerId) : null;
    console.log(
      `⚠️ Payment failed — customer ${customerId ?? "?"}, user ${userId ?? "UNKNOWN (no PDS row)"}`,
    );
    if (userId) await startPdsGrace(userId, "past_due");
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId =
      typeof invoice.customer === "string"
        ? invoice.customer
        : invoice.customer?.id;
    // Payment recovered — undo a past_due grace if one was running.
    const userId = customerId ? await userIdForCustomer(customerId) : null;
    if (userId) {
      console.log(
        `💳 Payment received — customer ${customerId}, user ${userId} (reactivating if in grace)`,
      );
      await reactivatePds(userId);
    }
  }

  return NextResponse.json({ message: "Received" }, { status: 200 });
}

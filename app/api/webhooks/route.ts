import type { Stripe } from "stripe";

import { NextResponse } from "next/server";

import { randomBytes } from "crypto";

import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const PDS_API_BASE_URL = "https://k8s-pds.frx.pub/api/v1";

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .slice(0, 63);
}

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

async function provisionPdsForUser({
  userId,
  userEmail,
  pdsUsername,
  pdsHostnameBase,
  disksizeGb,
}: {
  userId: string;
  userEmail: string;
  pdsUsername: string;
  pdsHostnameBase: string;
  disksizeGb: string;
}) {
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

  const disksizeParsed = Number(disksizeGb);
  if (!Number.isFinite(disksizeParsed) || disksizeParsed <= 0) {
    throw new Error(
      `Invalid pds_disksize_gb metadata value: "${disksizeGb}". Expected a positive number.`,
    );
  }
  const disksize = Math.floor(disksizeParsed);

  const supabase = createAdminClient();

  // Idempotency: if we already have a service_id stored, don't redeploy
  const { data: existing } = await supabase
    .from("pds_services")
    .select("pds_service_id,status")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    if (existing.pds_service_id) {
      return { skipped: true, pds_service_id: existing.pds_service_id };
    }
    // Retry deploy for known retryable states where id may be missing.
    // Keep skipping for everything else to avoid duplicate provisioning.
    const retryableStatuses = new Set([
      "deploy_failed",
      "deploy_succeeded_no_id",
    ]);
    if (existing.status && !retryableStatuses.has(existing.status)) {
      return { skipped: true, pds_service_id: null };
    }
  }

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

  const deployContentType = deployRes.headers.get("content-type") || "";
  const deployBody = deployContentType.includes("application/json")
    ? await deployRes.json()
    : await deployRes.text();

  if (!deployRes.ok) {
    // Persist failure status for easier debugging
    await supabase.from("pds_services").upsert({
      user_id: userId,
      hostname,
      status: "deploy_failed",
    });
    throw new Error(
      `PDS deploy failed (${deployRes.status}) for hostname "${hostname}": ${
        typeof deployBody === "string" ? deployBody : JSON.stringify(deployBody)
      }`,
    );
  }

  const maybeServiceId =
    (typeof deployBody === "object" && deployBody !== null
      ? ((deployBody as any).service_id ??
        (deployBody as any).serviceId ??
        (deployBody as any).id ??
        (deployBody as any).service?.id ??
        (deployBody as any).data?.id ??
        (deployBody as any).data?.serviceId)
      : undefined) ?? null;

  const pds_service_id =
    typeof maybeServiceId === "string" || typeof maybeServiceId === "number"
      ? Number(maybeServiceId)
      : null;

  await supabase.from("pds_services").upsert({
    user_id: userId,
    pds_service_id,
    hostname,
    status: pds_service_id ? "provisioning" : "deploy_succeeded_no_id",
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
        // Only store user_id -> stripe_customer_id mapping (minimal)
        const { error } = await supabase.from("subscriptions").upsert({
          user_id: userId,
          stripe_customer_id: customerId,
        });

        if (error) {
          console.error("Error storing customer ID:", error);
        } else {
          console.log(`✅ Customer ID stored for user ${userId}`);
        }

        // Next step: provision the user's PDS
        if (userEmail) {
          const fallbackUsername = normalizeSlug(
            userEmail.split("@")[0] || "pds",
          );
          const pdsUsername = normalizeSlug(
            session.metadata?.pds_username || fallbackUsername,
          );
          const pdsHostnameBase =
            session.metadata?.pds_hostname_base ||
            `${pdsUsername}.eny.k8s.frx.pub`;
          const disksizeGb = session.metadata?.pds_disksize_gb || "10";

          try {
            console.log(`✅ Provisioning PDS for user ${userId}...`);
            await provisionPdsForUser({
              userId,
              userEmail,
              pdsUsername,
              pdsHostnameBase,
              disksizeGb,
            });
          } catch (e) {
            console.error(`❌ Provisioning PDS failed for ${userId}:`, e);
          }
        } else {
          console.warn(
            `⚠️ Missing user_email metadata in checkout session for user ${userId}.`,
          );
        }
      }
    }
  }

  // All other subscription events are handled by querying Stripe directly
  // No need to sync subscription details to database

  return NextResponse.json({ message: "Received" }, { status: 200 });
}

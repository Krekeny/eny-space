"use client";

import { useState } from "react";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { MinusIcon, PlusIcon } from "lucide-react";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "what-is-pds",
    question: "What is a Personal Data Server (PDS)?",
    answer:
      "Your PDS is the home of your AT Protocol identity and data — your repository, blobs and account live there, signed under your DID. On the network, your PDS is what relays crawl and AppViews read from. eny.space runs that server for you, so you get the ownership without operating the box.",
  },
  {
    id: "standard-pds-federation",
    question: "Is it a standard PDS, and is it fully federated?",
    answer:
      "Yes. eny.space provisions a standard AT Protocol PDS that speaks the normal com.atproto XRPC API, so it federates like any other: relays crawl it, your records hit the firehose, and AppViews — including Bluesky — can read your account. It's a standard PDS, not a proprietary fork of the protocol.",
  },
  {
    id: "migration-portability",
    question: "Can I bring my existing account in, and leave with my data later?",
    answer:
      "Your repository is a standard ATProto repo, portable by design — your identity is a did:plc you can move to another PDS, and your data exports as a CAR file, all through the protocol's standard account-migration flow. So you are never locked in. One-click import and export from the dashboard is on our roadmap; today it runs through the standard XRPC flow.",
  },
  {
    id: "did-and-keys",
    question: "Who controls my DID and PLC rotation key?",
    answer:
      "Your identity is a did:plc. By default eny.space holds your PLC rotation key — the same model as running your own PDS or using bsky.social, where the key lives with the server operator. That keeps setup one-click and lets us help you recover access. You can still migrate to another PDS anytime via the standard email-confirmed account-migration flow: your PDS signs the operation for you, so you don't need to hold the key to leave. Letting you hold your own rotation key for full self-custody is on our roadmap.",
  },
  {
    id: "api-and-access",
    question: "Can I access my PDS programmatically?",
    answer:
      "Yes — it's a normal ATProto endpoint. You get a default handle at your-name.eny.space (custom domains coming soon) and can call com.atproto XRPC methods directly. Third-party Atmosphere apps sign in to your account the standard ways: app passwords, and OAuth — the 'sign in with your handle' flow where the app receives a scoped, revocable token and never sees your password. You can also create accounts and invite codes for the people you host.",
  },
  {
    id: "managed-infra",
    question: "Who runs the infrastructure, and what if my PDS goes down?",
    answer:
      "eny.space is managed hosting: you create a PDS in a click and we run the infrastructure, TLS, updates and uptime — no kubectl or cloud console. The underlying hardware is held by a dedicated hosting partner that monitors the pods and provides operational support, so failures are detected and recovered at the infrastructure layer without you having to do anything. Your PDS is backed up as part of the managed service. (We don't publish a formal uptime SLA yet.)",
  },
  {
    id: "why-no-atmosphere-login",
    question: 'Why can\'t I log in with my "@" handle or Atmosphere account?',
    answer:
      "Your eny.space account is separate from your AT Protocol identity on purpose. Allowing Atmosphere login before your PDS is fully set up could lock you out of your own server. We're working on Atmosphere login as an option, but an email address will always be required as a secure fallback.",
  },
];

export function FAQSection() {
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);

  return (
    <section id="faq" className="relative w-full px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-4xl text-center">
        <Heading
          as="h2"
          className="text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl"
        >
          Frequently Asked Questions
        </Heading>
        <Paragraph className="mt-4 text-sm text-white/70 sm:text-base">
          answers to the most common questions about managed PDS hosting and the
          eny.space PDS browser. If you can't find what you're looking for, feel
          free to{" "}
          <a
            href="mailto:hello+eny-space@krekeny.com"
            className="font-semibold text-white underline underline-offset-2 hover:text-white/80"
          >
            reach out to our friendly team
          </a>
          .
        </Paragraph>
      </div>

      <div className="mx-auto mt-10 max-w-3xl space-y-3 sm:mt-12">
        {FAQ_ITEMS.map((item) => {
          const isOpen = openId === item.id;

          return (
            <div
              key={item.id}
              className={[
                "overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/40 transition-colors",
                isOpen ? "bg-neutral-900/80" : "hover:bg-neutral-900/60",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="text-sm font-medium text-white sm:text-base">
                  {item.question}
                </span>
                <span className="flex size-7 items-center justify-center rounded-full bg-white/8 text-white">
                  {isOpen ? (
                    <MinusIcon className="size-4" aria-hidden />
                  ) : (
                    <PlusIcon className="size-4" aria-hidden />
                  )}
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-white/10 px-5 pb-5 pt-3 text-sm text-white/75">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

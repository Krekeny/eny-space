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
      "A PDS is the place where your data and identity for the AT Protocol live. Instead of being locked into one platform, your posts, media and profile are stored on a server you control - and eny.space makes running that server manageable through a simple dashboard.",
  },
  {
    id: "do-i-need-own-server",
    question: "Do I need to understand Kubernetes, Docker or cloud hosting?",
    answer:
      "No. The whole point of eny.space is managed PDS hosting: you click to create a PDS and we take care of the underlying infrastructure. You can still bring your own domain and adjust settings, but you never have to touch kubectl or obscure cloud dashboards.",
  },
  {
    id: "pds-browser-free",
    question: "Is the PDS browser UI free to use?",
    answer:
      "The PDS explorer UI is designed to be freely accessible for browsing public data on your PDS - similar to how you might explore content on Bluesky today. Managed hosting, dedicated resources and custom domains sit on top as paid features when you want your own isolated space.",
  },
  {
    id: "billing-and-payments",
    question: "How do billing and payments work for eny.space?",
    answer:
      "We integrate with modern payment providers so you can subscribe in a few clicks. Behind the scenes, we handle invoices, taxes and payouts for you, so you only see a clear monthly charge for your plan instead of having to reconcile every PDS user manually.",
  },
  {
    id: "who-is-it-for",
    question: "Who is eny.space built for?",
    answer:
      "eny.space is aimed at AT Protocol and Bluesky power users, indie developers and communities who want their own PDS without becoming infrastructure engineers. If you care about owning your data and having a clear UI to manage it, you are our target audience.",
  },
  {
    id: "why-no-atmosphere-login",
    question: 'Why can\'t I log in with my "@" handle or Atmosphere account?',
    answer:
      "eny.space provisions Personal Data Servers — your account here is separate from your AT Protocol identity on purpose. Allowing Atmosphere login before your PDS is fully set up could lock you out of your own server. We are working on Atmosphere login as an option, but an email address will always be required as a secure fallback.",
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
            href="mailto:hello@krekeny.com"
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

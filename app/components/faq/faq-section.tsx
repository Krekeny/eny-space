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
    id: "web3-vs-traditional",
    question: "Why is your Web3 hosting better than traditional hosting?",
    answer:
      "Unlike traditional hosting, eny.space offers decentralized infrastructure designed for uptime, security, and scalability. Your projects are backed by blockchain-based guarantees, reducing single points of failure and giving you the resilience you need to grow.",
  },
  {
    id: "choose-plan",
    question: "How do I know which pricing plan is right for me?",
    answer:
      "Start with the plan that matches your expected storage and traffic. You can upgrade at any time without downtime, and our team can help you right-size based on your current and projected usage.",
  },
  {
    id: "secure-platform",
    question: "What makes your platform secure for hosting my Web3 project?",
    answer:
      "We combine audited smart contract infrastructure with strong network isolation, encryption in transit and at rest, and continuous monitoring. This layered approach helps protect your data and on-chain assets from common attack vectors.",
  },
  {
    id: "switch-plans",
    question: "Can I switch plans later if my needs change?",
    answer:
      "Yes. You can move between plans at any time. Billing is prorated, and your deployments stay online during the switch so you can scale up or down without interruptions.",
  },
  {
    id: "time-to-deploy",
    question: "How soon can I deploy my Web3 project on eny.space?",
    answer:
      "Most teams deploy in minutes. Connect your wallet or Git repository, choose a plan, and follow the guided setup. Our onboarding flow is optimized so you can go from zero to live as quickly as possible.",
  },
];

export function FAQSection() {
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);

  return (
    <section
      id="faq"
      className="relative w-full bg-neutral-950 px-4 py-20 sm:px-6 sm:py-24"
    >
      <div className="mx-auto max-w-4xl text-center">
        <Heading
          as="h2"
          className="text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl"
        >
          Frequently Asked Questions
        </Heading>
        <Paragraph className="mt-4 text-sm text-white/70 sm:text-base">
          All the details you need about the product and billing. If you can't
          find what you're looking for, feel free to{" "}
          <span className="font-semibold text-white">
            reach out to our friendly team
          </span>
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
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
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

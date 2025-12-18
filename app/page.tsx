import type { Metadata } from "next";

import Link from "next/link";

export const metadata: Metadata = {
  title: "eny.space – your data, your space, use it enywhere",
};

export default function IndexPage(): JSX.Element {
  return (
    <main className="page-container">
      <h1>Your own custom PDS in seconds</h1>
      <h2>One-click ATProto hosting with eny.space</h2>
      <p>
        We&apos;re building a managed ATProto Personal Data Server (PDS)
        platform so you can focus on your product while we handle the
        infrastructure, scaling, and compliance.
      </p>

      <h3>What&apos;s coming soon</h3>
      <ul>
        <li>One-click provisioning of dedicated ATProto PDS instances</li>
        <li>Automatic backups and seamless upgrades</li>
        <li>Usage-based pricing with clear, predictable costs</li>
      </ul>

      <h3>Be the first to know</h3>
      <p>
        We&apos;re onboarding early adopters now. If you&apos;re building on
        ATProto and want reliable managed hosting, we&apos;d love to hear from
        you.
      </p>

      <div
        style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}
      >
        <Link
          href="mailto:hello@eny.space?subject=I%27d%20like%20early%20access%20to%20eny.space%20PDS"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            borderRadius: 6,
            backgroundColor: "#000000",
            color: "#ffffff",
            border: "1px solid #ffffff",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Request early access
        </Link>
        {/* <Link
          href="/checkout"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            borderRadius: 6,
            backgroundColor: "#ffffff",
            color: "#000000",
            border: "1px solid #ffffff",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Get yours
        </Link> */}
      </div>
    </main>
  );
}

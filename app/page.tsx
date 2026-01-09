import type { Metadata } from "next";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "eny.space – your data, your space, use it enywhere",
};

export default function IndexPage() {
  return (
    <main className="pb-[60px] max-w-[600px] space-y-8">
      {/* Hero Section */}
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold leading-tight">
          Your own custom PDS in seconds
        </h1>
        <h2 className="text-xl text-muted-foreground font-medium">
          One-click ATProto hosting with eny.space
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          We&apos;re building a managed ATProto Personal Data Server (PDS)
          platform so you can focus on your product while we handle the
          infrastructure, scaling, and compliance.
        </p>
      </div>

      {/* Features Section */}
      <Card>
        <CardHeader>
          <CardTitle>What&apos;s coming soon</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 list-none pl-0">
            <li className="flex items-start gap-3">
              <span className="text-muted-foreground mt-1">•</span>
              <span>
                One-click provisioning of dedicated ATProto PDS instances
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-muted-foreground mt-1">•</span>
              <span>Automatic backups and seamless upgrades</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-muted-foreground mt-1">•</span>
              <span>Usage-based pricing with clear, predictable costs</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <Card>
        <CardHeader>
          <CardTitle>Be the first to know</CardTitle>
          <CardDescription>
            We&apos;re onboarding early adopters now. If you&apos;re building on
            ATProto and want reliable managed hosting, we&apos;d love to hear
            from you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="mailto:hello@krekeny.com?subject=I%27d%20like%20early%20access%20to%20eny.space%20PDS"
            className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-black text-white border border-white hover:bg-white hover:text-black transition-colors font-semibold text-sm no-underline"
          >
            Request early access
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

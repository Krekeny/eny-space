import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { createClient } from "@/lib/supabase/server";
import { isRecoverySession } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { SiteBackground } from "@/components/site-background";
import { SupportDialog } from "@/components/support/support-dialog";
import { EnvBanner } from "@/components/env-banner";

import "./globals.css";
import { Doto, Fira_Mono } from "next/font/google";

const firaMono = Fira_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
});

const doto = Doto({
  subsets: ["latin"],
  variable: "--font-heading",
});

interface LayoutProps {
  children: React.ReactNode;
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://eny.space"),
  title: {
    default: "eny.space",
    template: "%s | eny.space",
  },
  description: "one-click PDS hosting for the atmosphere. your data, your space — use it enywhere.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    siteName: "eny.space",
    title: "eny.space",
    description: "one-click PDS hosting for the atmosphere. your data, your space — use it enywhere.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    description: "eny.space – your data, your space, use it enywhere.",
    images: ["/og.png"],
  },
};

export default async function RootLayout({ children }: LayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isRecovery = session ? isRecoverySession(session.access_token) : false;

  return (
    <html lang="en" className={`${firaMono.variable} ${doto.variable}`}>
      <body className="min-h-screen flex flex-col">
        <EnvBanner />
        <SiteBackground />
        <SiteHeader user={user} isRecovery={isRecovery} />
        <main className="flex-1">{children}</main>
        <Footer fabInset={!!user} />
        {user && (
          <SupportDialog
            variant="fab"
            context="floating"
            defaultCategory="feedback"
            userEmail={user.email}
          >
            Say hi
          </SupportDialog>
        )}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}

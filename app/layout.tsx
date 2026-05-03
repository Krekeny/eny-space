import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { SiteBackground } from "@/components/site-background";

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
  title: {
    default: "eny.space",
    template: "%s | eny.space",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  twitter: {
    card: "summary_large_image",
    description: "eny.space – your data, your space, use it enywhere.",
  },
};

export default async function RootLayout({ children }: LayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className={`${firaMono.variable} ${doto.variable}`}>
      <body className="min-h-screen flex flex-col">
        <SiteBackground />
        <SiteHeader user={user} />
        <main className="flex-1">{children}</main>
        <Footer />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}

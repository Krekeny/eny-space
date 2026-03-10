import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";

import "./globals.css";
import { Noto_Sans } from "next/font/google";

const notoSans = Noto_Sans({ variable: "--font-sans" });

interface LayoutProps {
  children: React.ReactNode;
}

export const metadata: Metadata = {
  title: {
    default: "eny.space",
    template: "%s | eny.space",
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
    <html lang="en" className={notoSans.variable}>
      <body>
        <SiteHeader user={user} />
        {children}
        <Footer />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}

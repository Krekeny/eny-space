import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { Space_Grotesk } from "next/font/google";

import "./globals.css";

const fontSans = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en" className="dark">
      <body className={fontSans.className}>
        <div className="max-w-[1280px] px-6 py-11 flex flex-row">
          <header className="relative flex-[0_0_250px] pr-12">
            <div className="sticky top-11">
              <h1 className="font-semibold text-foreground my-1.5 text-[27px] leading-8">eny.space</h1>
            </div>
          </header>
          {children}
        </div>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";

import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html lang="en" className={`dark ${jetbrainsMono.variable}`}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="max-w-[1280px] px-6 py-11 flex flex-row">
          <header className="relative flex-[0_0_250px] pr-12">
            <div className="sticky top-11">
              <h1 className="font-semibold text-foreground my-1.5 text-[27px] leading-8">
                eny.space
              </h1>
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

import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Space_Grotesk } from "next/font/google";

import "../styles.css";

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
    <html lang="en">
      <body className={fontSans.className}>
        <div className="container">
          <header>
            <div className="header-content">
              <h1>eny.space</h1>
            </div>
          </header>
          {children}
        </div>
        <SpeedInsights />
      </body>
    </html>
  );
}

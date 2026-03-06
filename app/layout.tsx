import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/actions/auth";

import "./globals.css";
import { Noto_Sans } from "next/font/google";

const notoSans = Noto_Sans({variable:'--font-sans'});


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
        <header>
          <Link href="/">eny.space</Link>
          {" | "}
          <nav style={{ display: "inline" }}>
            {user ? (
              <>
                <Link href="/dashboard">Dashboard</Link>
                {" | "}
                <form action={signOut} style={{ display: "inline" }}>
                  <button type="submit">Sign Out</button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login">Login</Link>
                {" | "}
                <Link href="/signup">Sign Up</Link>
              </>
            )}
          </nav>
        </header>
        <hr />
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}

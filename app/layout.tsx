import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { Space_Grotesk } from "next/font/google";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/actions/auth";

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

export default async function RootLayout({ children }: LayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body className={fontSans.className}>
        <div className="container">
          <header>
            <div className="header-content">
              <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
                <h1>eny.space</h1>
              </Link>
              <nav style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "24px" }}>
                {user ? (
                  <>
                    <Link href="/dashboard" style={{ color: "var(--h2-color)" }}>Dashboard</Link>
                    <form action={signOut} style={{ margin: 0 }}>
                      <button 
                        type="submit" 
                        style={{ 
                          background: "none", 
                          border: "none", 
                          cursor: "pointer", 
                          color: "var(--h2-color)",
                          padding: 0,
                          textAlign: "left",
                          font: "inherit"
                        }}
                      >
                        Sign Out
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/login" style={{ color: "var(--h2-color)" }}>Login</Link>
                    <Link href="/signup" style={{ color: "var(--h2-color)" }}>Sign Up</Link>
                  </>
                )}
              </nav>
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

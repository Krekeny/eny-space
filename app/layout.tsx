import type { Metadata } from "next";

import "../styles.css";

interface LayoutProps {
  children: React.ReactNode;
}

export const metadata: Metadata = {
  title: {
    default: "Easy PDS",
    template: "%s | Easy PDS",
  },
  twitter: {
    card: "summary_large_image",
    description: "Easy PDS - Hosting service platform.",
  },
};

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header>
            <div className="header-content">
              <h1>
                Easy PDS
              </h1>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}

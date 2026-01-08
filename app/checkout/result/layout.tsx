import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout Session Result",
};

export default function ResultLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="pb-[60px] max-w-[600px]">
      <h1>Checkout Session Result</h1>
      {children}
    </div>
  );
}

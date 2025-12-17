import type { Metadata } from "next";

import CheckoutForm from "@/components/CheckoutForm";

export const metadata: Metadata = {
  title: "Donate",
};

export default function DonatePage(): JSX.Element {
  return (
    <div className="page-container">
      <h1>Donate</h1>
      <p>Donate to our project 💖</p>
      <CheckoutForm uiMode="hosted" />
    </div>
  );
}

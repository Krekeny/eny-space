import type { Metadata } from "next";

import CheckoutForm from "@/components/CheckoutForm";

export const metadata: Metadata = {
  title: "Purchase Hosting",
};

export default function DonatePage(): JSX.Element {
  return (
    <div className="page-container">
      <h1>Purchase Hosting Service</h1>
      <p>Select your hosting plan and complete your purchase</p>
      <CheckoutForm uiMode="hosted" />
    </div>
  );
}

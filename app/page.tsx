import type { Metadata } from "next";

import Link from "next/link";

export const metadata: Metadata = {
  title: "Home",
};

export default function IndexPage(): JSX.Element {
  return (
    <ul className="card-list">
      <li>
        <Link
          href="/donate-with-checkout"
          className="card checkout-style-background"
        >
          <h2 className="bottom">Donate</h2>
          <img src="/checkout-one-time-payments.svg" />
        </Link>
      </li>
    </ul>
  );
}

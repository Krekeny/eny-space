# Privacy Policy — eny.space

_Effective 1 July 2026_

## 1. Who we are

eny.space is operated by **Krekeny GmbH**, Karlstr. 54, 63065 Offenbach am Main, Germany, registered at Amtsgericht Offenbach am Main, HRB 53756. Managing directors: Sam Sauer, Michael Ehrich. VAT ID: DE 3436 4277 9.

For any privacy question or data-subject request, contact us at **hello+eny-space@krekeny.com**.

## 2. Controller vs. processor — an important distinction

eny.space provides managed hosting for your own Personal Data Server (PDS) on the AT Protocol. Because of this, our role depends on which data we're talking about:

- **We are the _controller_** for the data we collect to run your eny.space account: your email address, your account identifier, and your billing link to Stripe. This policy governs that data.
- **We are a _processor_ (host)** for the content inside your PDS — your repository, records, blobs, and any accounts your end-users create on it. That data is yours. We store and serve it so your PDS runs, but we don't decide what's in it, and **we do not curate or moderate your users**. You are the controller for that content, and responsible for your own users under applicable law.

## 3. What we collect and why

| Data | Purpose | Legal basis (GDPR Art. 6) |
|---|---|---|
| Email address | Account creation, service and PDS notifications, support | Contract performance |
| Account ID ↔ Stripe customer ID | Linking your account to billing | Contract performance |
| Payment data | Processing subscriptions | Handled by Stripe (see §5) |
| PDS content (repo, records, blobs, your end-users' data) | Providing the hosting you signed up for | Contract performance / processor |
| Server & platform logs | Security, reliability, abuse prevention | Legitimate interest |

We do **not** sell your data or use it for advertising.

## 4. PDS content and account lifecycle

All data on your PDS belongs to you. You can migrate it in or out at any time using standard AT Protocol tooling — your DID and repository are portable by design.

When a subscription ends, we keep your PDS available for a grace period so nothing is lost by accident:

- **Cancellation:** your PDS stays fully active for **14 days** after your paid period ends. Resubscribe within that window to keep uninterrupted access.
- **Failed payment:** because payment failures are often unintentional, your PDS stays active for **30 days** to give you time to fix billing.
- **After the grace period:** the PDS server shuts down (inactive), and we retain the last state of your data for a further **30 days** during which it can be reactivated.
- **After the reactivation window:** your data is **permanently (hard) deleted** from our servers, including backups.
- **Total (cancellation):** with a voluntary cancellation this means your data is fully deleted roughly **44 days** after your subscription period ends (14 days active + 30 days backup retention).
- **Self-deletion:** a direct "delete my account" option is planned but not yet available. For now, cancelling your subscription starts the timeline above.

## 5. Third parties we share data with (processors)

We use a small number of providers to run the service. Each processes data on our behalf:

- **Stripe** (Stripe Payments Europe, Ltd.) — payment processing. We store only a customer-ID link; card data is handled by Stripe directly.
- **Resend** — sending transactional email (eny.space account mails and PDS mails).
- **Vercel** — hosts our website and dashboard and provides Vercel Analytics. Vercel processes standard request and runtime logs (which may include IP addresses) on our behalf, retained short-term per their plan — on our Pro plan, about **1 day**. Vercel Analytics is cookieless and aggregated.
- **Froxlor** — operates the server infrastructure in Frankfurt, Germany on which your PDS runs (sub-processor).
- **AWS** — user database, currently in Ireland (eu-west-1), migrating to Frankfurt (eu-central-1) soon.

## 6. Cookies

We use **strictly necessary cookies** only — an authentication session cookie set when you sign in to your eny.space account. It is required for the service to function and is not used for tracking. Vercel Analytics (see §5) is cookieless. We do not use advertising or third-party tracking cookies.

## 7. Where your data is stored

- **PDS servers:** Frankfurt, Germany (EU).
- **User database:** currently Ireland (EU), migrating to Frankfurt (EU). Both locations are within the EU/EEA, so no international transfer outside the EEA is involved for this data.
- **Stripe / Resend / Vercel:** may process limited data (billing, email delivery, analytics) partly outside the EEA under their own safeguards (EU Standard Contractual Clauses).

## 8. Retention

We keep account data (email, Stripe link) for as long as you have an account, and PDS content per the lifecycle in §4. Request and runtime logs are handled by Vercel and retained short-term (about 1 day on the Pro plan); we do not maintain separate long-term log storage. After hard deletion, data is not recoverable.

## 9. Security

We use appropriate technical and organisational measures to protect personal data, including encryption in transit (TLS), hashed passwords, access controls, and managed, monitored infrastructure. No method of transmission or storage is completely secure, but we work to protect your data and to address any incidents promptly.

## 10. Your rights

Under the GDPR you have the right to access, correct, delete, restrict, and port your data, and to object to processing. Because your PDS is portable, you can export or migrate its contents yourself at any time. To exercise any right regarding data we control, contact us at hello+eny-space@krekeny.com. You may also lodge a complaint with your local data protection authority — for us that is Der Hessische Beauftragte für Datenschutz und Informationsfreiheit (Hesse).

## 11. Children

eny.space is not directed at children, and we do not knowingly collect personal data from anyone under the age required to consent to online services in their country. [[CONFIRM: minimum age to state, e.g. 16 in Germany]]

## 12. Changes to this policy

We may update this policy. Material changes will be announced by email or via a notice in the eny.space dashboard, and the effective date above will change.

---

_See also our [Terms of Service](/terms)._

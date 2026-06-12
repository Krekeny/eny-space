// Shown instantly while the dashboard server component resolves its data
// (auth, Stripe subscription, PDS lifecycle + service fetch).
export default function DashboardLoading() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-7xl flex-col items-center justify-center gap-4 px-4 py-16 sm:px-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/pixel-planet.svg"
        alt=""
        aria-hidden
        width={56}
        height={56}
        className="animate-pulse"
      />
      <p className="text-sm text-white/50">Loading your PDS…</p>
    </main>
  );
}

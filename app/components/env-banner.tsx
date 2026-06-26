export function EnvBanner() {
  const explicit = process.env.NEXT_PUBLIC_ENV_LABEL?.trim();
  const vercelEnv = process.env.VERCEL_ENV; // production | preview | development | undefined (local)

  // `preview` is the Vercel mechanism behind our dev server (dev.eny.space), so we
  // label it "Development environment" to match how we actually think about it.
  const label =
    explicit ||
    (vercelEnv === "production" ? null : "Development environment");

  if (!label) return null;

  return (
    <div className="w-full bg-amber-400 px-4 py-1 text-center text-[11px] font-semibold uppercase tracking-widest text-black">
      {label}
    </div>
  );
}

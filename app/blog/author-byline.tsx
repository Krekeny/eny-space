import type { Author } from "@/lib/blog";

type Profile = { displayName?: string; handle?: string; avatar?: string };

// Pull the author's live profile (avatar + display name) from the Bluesky
// AppView. Cached, and best-effort — falls back to the frontmatter values.
async function fetchProfile(actor: string): Promise<Profile | null> {
  try {
    const res = await fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(actor)}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    return (await res.json()) as Profile;
  } catch {
    return null;
  }
}

export async function AuthorByline({ author }: { author: Author }) {
  const actor = author.handle || author.did;
  const profile = actor ? await fetchProfile(actor) : null;

  const handle = author.handle || profile?.handle;
  const name =
    author.name || profile?.displayName || handle || author.did || "Author";
  const avatar = profile?.avatar;
  const profileUrl = handle
    ? `https://bsky.app/profile/${handle}`
    : author.did
      ? `https://bsky.app/profile/${author.did}`
      : undefined;

  const inner = (
    <>
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt=""
          className="size-9 shrink-0 rounded-full border border-white/10 bg-white/5"
          width={36}
          height={36}
        />
      ) : (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-white/70">
          {name.slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-medium text-white">{name}</span>
        {handle && (
          <span className="text-xs text-white/40 group-hover:text-white/60">
            @{handle}
          </span>
        )}
      </span>
    </>
  );

  if (!profileUrl) {
    return <div className="flex items-center gap-3">{inner}</div>;
  }

  return (
    <a
      href={profileUrl}
      target="_blank"
      rel="noreferrer"
      className="group inline-flex items-center gap-3"
    >
      {inner}
    </a>
  );
}

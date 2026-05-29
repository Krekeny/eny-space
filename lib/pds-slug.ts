const PDS_HOSTNAME_SUFFIX = process.env.NEXT_PUBLIC_PDS_HOSTNAME_SUFFIX ?? ".eny.space";

export function normalizePdsSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .slice(0, 63);
}

export function pdsHostnameForSlug(slug: string): string {
  return `${slug}${PDS_HOSTNAME_SUFFIX}`;
}

export type PdsSlugValidation =
  | { ok: true; slug: string; hostname: string }
  | { ok: false; error: string };

export function validatePdsSlugInput(raw: string): PdsSlugValidation {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Enter a name for your PDS." };
  }

  const slug = normalizePdsSlug(trimmed);
  if (!slug) {
    return {
      ok: false,
      error: "Use letters, numbers, and hyphens only.",
    };
  }

  if (slug.length < 3) {
    return {
      ok: false,
      error: "Name must be at least 3 characters after formatting.",
    };
  }

  if (!/^[a-z0-9]/.test(slug) || !/[a-z0-9]$/.test(slug)) {
    return {
      ok: false,
      error: "Name must start and end with a letter or number.",
    };
  }

  return { ok: true, slug, hostname: pdsHostnameForSlug(slug) };
}

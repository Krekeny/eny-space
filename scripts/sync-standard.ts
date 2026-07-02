/**
 * Syndicate the markdown blog to our PDS as standard.site records (POSSE).
 *
 * Markdown stays the source of truth. This script mirrors each post to a
 * `site.standard.document` record (metadata only — no body) and upserts the
 * `site.standard.publication`. It is idempotent: rkey = slug, so re-running
 * overwrites in place and never duplicates.
 *
 * Not part of the build — run at commit time or manually via `pnpm sync:standard`.
 * A flaky network or expired app password must never break a deploy.
 */
import fs from "node:fs";
import "dotenv/config";
import { AtpAgent } from "@atproto/api";

import { getAllPostMeta } from "../lib/blog";

const {
  ATP_SERVICE,
  ATP_IDENTIFIER,
  ATP_APP_PASSWORD,
  SITE_URL = "https://eny.space",
  ATP_PUB_RKEY = "eny-space",
  PUBLICATION_NAME = "eny.space",
  PUBLICATION_DESCRIPTION = "Managed PDS hosting for the atmosphere.",
  // Square PNG (>=256px) for site.standard.publication.icon. Re-uploaded each
  // run; content-addressed, so the same file yields the same blob (no dupes).
  PUBLICATION_ICON_PATH = "public/pixel-planet-static.png",
} = process.env;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function main() {
  const service = requireEnv("ATP_SERVICE", ATP_SERVICE);
  const identifier = requireEnv("ATP_IDENTIFIER", ATP_IDENTIFIER);
  const password = requireEnv("ATP_APP_PASSWORD", ATP_APP_PASSWORD);

  const agent = new AtpAgent({ service });
  await agent.login({ identifier, password });
  const did = agent.session!.did;
  console.log(`Logged in as ${identifier} (${did})`);

  // Upload the publication icon blob if the file exists (optional).
  let icon: unknown;
  try {
    const bytes = fs.readFileSync(PUBLICATION_ICON_PATH);
    const up = await agent.uploadBlob(bytes, { encoding: "image/png" });
    icon = up.data.blob;
    console.log(`Icon blob uploaded from ${PUBLICATION_ICON_PATH}`);
  } catch (e) {
    console.warn(
      `No publication icon set (${PUBLICATION_ICON_PATH}): ${e instanceof Error ? e.message : e}`,
    );
  }

  // 1. Upsert the publication.
  const publication = {
    $type: "site.standard.publication",
    url: SITE_URL,
    name: PUBLICATION_NAME,
    description: PUBLICATION_DESCRIPTION,
    ...(icon ? { icon } : {}),
    preferences: { showInDiscover: true },
  };
  await agent.com.atproto.repo.putRecord({
    repo: did,
    collection: "site.standard.publication",
    rkey: ATP_PUB_RKEY,
    validate: false, // our PDS doesn't carry the site.standard.* lexicon
    record: publication,
  });
  const siteUri = `at://${did}/site.standard.publication/${ATP_PUB_RKEY}`;
  console.log(`Publication → ${siteUri}`);

  // 2. Upsert one document per post.
  const posts = getAllPostMeta();
  const liveSlugs = new Set(posts.map((p) => p.slug));

  for (const post of posts) {
    const record = {
      $type: "site.standard.document",
      site: siteUri,
      title: post.title,
      // Canonical URL = publication.url + path → https://eny.space/blog/<slug>.
      path: `/blog/${post.slug}`,
      description: post.description,
      publishedAt: post.publishedAt,
      ...(post.tags.length ? { tags: post.tags } : {}),
    };
    await agent.com.atproto.repo.putRecord({
      repo: did,
      collection: "site.standard.document",
      rkey: post.slug,
      validate: false,
      record,
    });
    console.log(
      `Document → at://${did}/site.standard.document/${post.slug}`,
    );
    await sleep(200); // be polite to the PDS
  }

  // 3. Reconcile deletions: drop records whose post no longer exists.
  let cursor: string | undefined;
  const orphans: string[] = [];
  do {
    const res = await agent.com.atproto.repo.listRecords({
      repo: did,
      collection: "site.standard.document",
      limit: 100,
      cursor,
    });
    for (const rec of res.data.records) {
      const rkey = rec.uri.split("/").pop()!;
      if (!liveSlugs.has(rkey)) orphans.push(rkey);
    }
    cursor = res.data.cursor;
  } while (cursor);

  for (const rkey of orphans) {
    await agent.com.atproto.repo.deleteRecord({
      repo: did,
      collection: "site.standard.document",
      rkey,
    });
    console.log(`Deleted orphaned document → ${rkey}`);
    await sleep(200);
  }

  console.log(
    `\nDone. ${posts.length} document(s) synced, ${orphans.length} removed.`,
  );
}

main().catch((err) => {
  console.error("sync:standard failed:", err);
  process.exit(1);
});

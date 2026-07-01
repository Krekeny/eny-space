// Proves the domain ↔ publication link: returns the publication's AT-URI as a
// single line of text/plain, built from ATP_DID + the publication rkey.
// Dynamic so ATP_DID is read per-request (runtime config, not baked at build).
export const dynamic = "force-dynamic";

export function GET() {
  const PUBLICATION_RKEY = process.env.ATP_PUB_RKEY || "eny-space";
  const did = process.env.ATP_DID;
  if (!did) {
    return new Response("ATP_DID not configured", { status: 503 });
  }
  return new Response(
    `at://${did}/site.standard.publication/${PUBLICATION_RKEY}`,
    { headers: { "content-type": "text/plain; charset=utf-8" } },
  );
}

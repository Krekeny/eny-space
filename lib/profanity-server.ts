import "server-only";

// Comprehensive, multi-language profanity gate for PDS slugs, backed by the
// LDNOOBW "naughty-words" lists. This is intentionally SERVER-ONLY: the word
// lists are large and must never ship in the client bundle. The lightweight,
// client-safe checks (reserved words + a curated severe-profanity substring
// list) live in `lib/pds-name-blocklist.ts` and run inside validatePdsSlugInput.
//
// Only latin-script languages are loaded — a PDS slug is normalized to
// [a-z0-9-], so cyrillic / CJK / arabic words can never match one.
import cs from "naughty-words/cs.json";
import da from "naughty-words/da.json";
import de from "naughty-words/de.json";
import en from "naughty-words/en.json";
import es from "naughty-words/es.json";
import fi from "naughty-words/fi.json";
import fr from "naughty-words/fr.json";
import hu from "naughty-words/hu.json";
import it from "naughty-words/it.json";
import nl from "naughty-words/nl.json";
import no from "naughty-words/no.json";
import pl from "naughty-words/pl.json";
import pt from "naughty-words/pt.json";
import sv from "naughty-words/sv.json";
import tr from "naughty-words/tr.json";

// Strip everything a slug can't contain (accents, spaces, apostrophes) so both
// the word list and the slug are compared on the same [a-z0-9] footing.
// German umlauts/ß are transliterated first so the ASCII spelling a user would
// actually type ("scheisse", "arschloecher") matches the list form ("scheiße").
const toAscii = (value: string) =>
  value
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/[^a-z0-9]/g, "");

function buildBadWordSet(): Set<string> {
  const set = new Set<string>();
  for (const list of [cs, da, de, en, es, fi, fr, hu, it, nl, no, pl, pt, sv, tr]) {
    for (const word of list) {
      const normalized = toAscii(word);
      // Skip 1–2 char fragments: they're too short to be a slug segment and
      // would only add noise. The slug minimum is 3 chars anyway.
      if (normalized.length >= 3) set.add(normalized);
    }
  }
  return set;
}

const BAD_WORDS = buildBadWordSet();

/**
 * Whole-word / segment match only — never a raw substring — so we avoid the
 * Scunthorpe problem: "ass" blocks the slug "ass" or "my-ass", never "class".
 *
 * Catches:
 *  - exact single words ............ "fuck"
 *  - de-hyphenated phrases ......... "blow-job" -> "blowjob"
 *  - a bad word as one segment ..... "my-fuck-pds"
 *
 * Concatenations like "fuckcorp" are caught by the curated substring list in
 * isPdsNameBlocked (which also runs server-side via validatePdsSlugInput).
 */
export function isProfaneSlug(slug: string): boolean {
  const lower = slug.toLowerCase();
  if (BAD_WORDS.has(toAscii(lower))) return true;
  return lower
    .split("-")
    .some((segment) => segment.length >= 3 && BAD_WORDS.has(segment));
}

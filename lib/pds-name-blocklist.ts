// Exact-match only — reserved words and brand names.
// These are checked as whole slugs to avoid false positives.
const EXACT_BLOCKLIST = new Set([
  // ---- System / infrastructure ----
  "admin", "administrator", "root", "superuser", "system", "daemon",
  "api", "apis", "app", "apps", "application",
  "auth", "login", "logout", "signin", "signup", "register", "account", "accounts",
  "billing", "payment", "checkout", "subscribe", "subscription",
  "dashboard", "panel", "portal", "console", "control",
  "blog", "news", "feed", "rss",
  "cdn", "static", "assets", "media", "images", "img", "upload", "uploads",
  "download", "downloads", "files", "storage", "archive", "backup", "backups",
  "dev", "developer", "staging", "stage", "prod", "production", "beta", "alpha",
  "preview", "review", "demo", "test", "testing", "sandbox",
  "internal", "intranet", "private", "public",
  "mail", "email", "smtp", "imap", "pop", "mx", "webmail",
  "ftp", "sftp", "ssh", "ssl", "tls", "vpn",
  "dns", "ns", "ns1", "ns2", "ns3", "ns4", "ntp",
  "proxy", "gateway", "relay", "firewall", "monitor", "monitoring",
  "metrics", "analytics", "stats", "status", "health", "logs", "log",
  "db", "database", "redis", "postgres", "mysql", "mongo", "elastic",
  "git", "repo", "repository",
  "help", "support", "docs", "documentation", "faq", "info", "about", "contact",
  "host", "hosting", "server", "node", "cluster",
  "www", "web", "site", "home", "index",
  "security", "secure", "safe",
  "store", "shop", "marketplace",
  "search", "explore", "discover",
  "null", "undefined", "void", "localhost",

  // ---- AT Protocol / Bluesky ----
  "atproto", "atprotocol",
  "bsky", "bluesky", "blueskyweb", "bskyweb",
  "pds", "appview", "firehose", "lexicon", "ozone",
  "did", "plc", "didplc", "handle", "profile",
  "atmosphere", "atm",

  // ---- Our brand ----
  "eny", "enyspace", "eny-space",
  "krekeny", "frx",

  // ---- Big tech / common brands ----
  "google", "gmail", "youtube", "googledrive", "googlecloud",
  "facebook", "instagram", "whatsapp", "meta", "threads",
  "twitter", "twitterx", "xtwitter",
  "apple", "icloud", "itunes", "appstore",
  "microsoft", "azure", "outlook", "hotmail", "bing", "xbox",
  "amazon", "aws", "prime",
  "netflix", "spotify", "twitch",
  "tiktok", "snapchat", "linkedin", "pinterest",
  "reddit", "discord", "slack", "telegram", "signal",
  "zoom", "skype", "teams",
  "uber", "airbnb", "paypal", "stripe", "shopify",
  "github", "gitlab", "bitbucket", "npm", "docker", "kubernetes", "k8s",
  "cloudflare", "vercel", "netlify", "heroku", "digitalocean",
  "openai", "chatgpt", "anthropic", "claude", "gemini", "copilot",
]);

// Substring-match — profanity that is offensive regardless of surrounding context.
// Kept intentionally narrower than EXACT_BLOCKLIST to avoid the Scunthorpe problem
// (e.g. "ass" is not here to avoid blocking "classic", "mass", etc.).
const PROFANITY_SUBSTRINGS = [
  "fuck", "cunt", "bitch", "nigger", "nigga", "faggot",
  "penis", "vagina", "anal", "anus", "dildo", "blowjob",
  "cum", "cumshot", "jizz",
  "rape", "rapist",
  "porn", "porno", "hentai",
  "nazi", "hitler",
  "suicide",
];

export function isPdsNameBlocked(slug: string): boolean {
  const lower = slug.toLowerCase();
  if (EXACT_BLOCKLIST.has(lower)) return true;
  return PROFANITY_SUBSTRINGS.some((word) => lower.includes(word));
}

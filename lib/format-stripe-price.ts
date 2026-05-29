export function formatStripePrice(
  unitAmount: number | null,
  currency: string | null,
): string | null {
  if (!unitAmount || !currency) return null;

  const normalized = currency.toLowerCase();
  const zeroDecimalCurrencies = new Set([
    "jpy",
    "krw",
    "clp",
    "vnd",
    "idr",
    "huf",
    "pyg",
  ]);
  const decimals = zeroDecimalCurrencies.has(normalized) ? 0 : 2;
  const major = unitAmount / 10 ** decimals;

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalized.toUpperCase(),
      maximumFractionDigits: decimals,
    }).format(major);
  } catch {
    return null;
  }
}

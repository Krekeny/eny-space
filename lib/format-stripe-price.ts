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

  // Drop the fraction digits for whole amounts (9.00 -> 9), keep them when
  // there are real cents (9.99 stays 9.99).
  const isWholeAmount = unitAmount % 10 ** decimals === 0;

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalized.toUpperCase(),
      minimumFractionDigits: isWholeAmount ? 0 : decimals,
      maximumFractionDigits: decimals,
    }).format(major);
  } catch {
    return null;
  }
}

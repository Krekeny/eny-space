const PDS_STATE_LABELS: Record<number, string> = {
  0: "Pending",
  1: "Deploying",
  2: "Awaiting first user",
  3: "Running",
  4: "Error",
};

export function pdsStateLabel(state: number | string | null | undefined): string {
  if (state === null || state === undefined) return "Unknown";
  const n = typeof state === "number" ? state : Number(state);
  if (!Number.isFinite(n)) return String(state);
  return PDS_STATE_LABELS[n] ?? `Unknown (state ${n})`;
}

export function isPdsReady(state: number | string | null | undefined): boolean {
  if (state === null || state === undefined) return false;
  const n = typeof state === "number" ? state : Number(state);
  return Number.isFinite(n) && n >= 2;
}

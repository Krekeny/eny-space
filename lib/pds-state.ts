const PDS_STATE_LABELS: Record<number, string> = {
  0: "Setting up your PDS…",
  1: "Setting up your PDS…",
  2: "Almost ready…",
  3: "Running",
  4: "Suspended",
  5: "Terminated",
  9: "Setup failed — please contact support",
};

export type PdsStateType = "pending" | "ready" | "failed";

export function pdsStateType(state: number | string | null | undefined): PdsStateType {
  if (state === null || state === undefined) return "pending";
  const n = typeof state === "number" ? state : Number(state);
  if (n === 3) return "ready";
  if (n === 5 || n === 9) return "failed";
  return "pending";
}

export function pdsStateLabel(state: number | string | null | undefined): string {
  if (state === null || state === undefined) return "Setting up your PDS…";
  const n = typeof state === "number" ? state : Number(state);
  if (!Number.isFinite(n)) return "Setting up your PDS…";
  return PDS_STATE_LABELS[n] ?? "Setting up your PDS…";
}

export function isPdsReady(state: number | string | null | undefined): boolean {
  return pdsStateType(state) === "ready";
}

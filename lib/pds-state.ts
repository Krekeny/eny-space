// Raw backend (deploy service) state codes — keep in sync with the API:
export const PDS_BACKEND_STATES: Record<number, string> = {
  0: "created",
  1: "deployment",
  2: "creating user",
  3: "done",
  4: "canceled",
  5: "terminated",
  9: "error",
};

// User-facing labels for the status card.
const PDS_STATE_LABELS: Record<number, string> = {
  0: "Setting up your PDS…",
  1: "Setting up your PDS…",
  2: "Almost ready…",
  3: "Running",
  // canceled: still reachable during the grace window — the grace banner
  // conveys the cancellation, so the card just shows it's up.
  4: "Running",
  5: "Terminated",
  9: "Setup failed — please contact support",
};

export type PdsStateType = "pending" | "ready" | "failed";

export function pdsStateType(state: number | string | null | undefined): PdsStateType {
  if (state === null || state === undefined) return "pending";
  const n = typeof state === "number" ? state : Number(state);
  if (n === 3 || n === 4) return "ready"; // done / canceled-but-running
  if (n === 5 || n === 9) return "failed"; // terminated / error
  return "pending"; // created / deployment / creating user
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

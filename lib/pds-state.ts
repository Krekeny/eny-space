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
  // canceled = the pod has been taken DOWN (replicas 0) but data is retained
  // and it's restorable until termination_date. During grace the state is still
  // 3 (running); 4 only appears once suspended, where the blocked screen shows.
  4: "Suspended",
  5: "Terminated",
  9: "Setup failed — please contact support",
};

export type PdsStateType = "pending" | "ready" | "failed";

export function pdsStateType(state: number | string | null | undefined): PdsStateType {
  if (state === null || state === undefined) return "pending";
  const n = typeof state === "number" ? state : Number(state);
  if (n === 3) return "ready"; // done / running
  if (n === 5 || n === 9) return "failed"; // terminated / error
  return "pending"; // 0,1,2 provisioning · 4 suspended (down, not reachable)
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

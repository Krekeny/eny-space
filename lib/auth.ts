export function isRecoverySession(accessToken: string): boolean {
  try {
    const base64 = accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    const amr: { method: string }[] = payload.amr ?? [];
    return amr.length === 1 && amr[0].method === "recovery";
  } catch {
    return false;
  }
}

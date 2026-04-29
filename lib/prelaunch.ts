/**
 * Feature flag for “prelaunch” mode.
 *
 * Set `NEXT_PUBLIC_PRELAUNCH=true` to enable prelaunch gating that hides
 * elements meant to ship only after launch.
 */
export const prelaunch =
  process.env.NEXT_PUBLIC_PRELAUNCH?.toLowerCase() === "true";


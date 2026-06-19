export type OnboardingSearchParams = {
  pds_plan?: string;
};

export function appendOnboardingParams(
  target: URLSearchParams,
  params?: OnboardingSearchParams,
) {
  if (!params) return;
  if (params.pds_plan) target.set("pds_plan", params.pds_plan);
}

export function onboardingQueryString(params?: OnboardingSearchParams): string {
  const sp = new URLSearchParams();
  appendOnboardingParams(sp, params);
  return sp.toString();
}

export function subscribePath(params?: OnboardingSearchParams): string {
  const qs = onboardingQueryString(params);
  return qs ? `/subscribe?${qs}` : "/subscribe";
}

export function subscribeNamePath(params?: OnboardingSearchParams): string {
  const qs = onboardingQueryString(params);
  return qs ? `/subscribe/name?${qs}` : "/subscribe/name";
}

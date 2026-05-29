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

export function welcomePath(params?: OnboardingSearchParams): string {
  const qs = onboardingQueryString(params);
  return qs ? `/welcome?${qs}` : "/welcome";
}

export function welcomeNamePath(params?: OnboardingSearchParams): string {
  const qs = onboardingQueryString(params);
  return qs ? `/welcome/name?${qs}` : "/welcome/name";
}

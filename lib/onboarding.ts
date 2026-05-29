export type OnboardingSearchParams = {
  pds_plan?: string;
  pds_username?: string;
  pds_hostname?: string;
  pds_disksize_gb?: string;
};

export function appendOnboardingParams(
  target: URLSearchParams,
  params?: OnboardingSearchParams,
) {
  if (!params) return;
  if (params.pds_plan) target.set("pds_plan", params.pds_plan);
  if (params.pds_username) target.set("pds_username", params.pds_username);
  if (params.pds_hostname) target.set("pds_hostname", params.pds_hostname);
  if (params.pds_disksize_gb) {
    target.set("pds_disksize_gb", params.pds_disksize_gb);
  }
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

import { Suspense } from "react";
import { SignUpForm } from "./signup-form";

type SignUpPageProps = {
  searchParams?: Promise<{
    auto_checkout?: string;
    pds_plan?: string;
    pds_username?: string;
    pds_hostname?: string;
    pds_disksize_gb?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const nextParams = new URLSearchParams();

  if (params?.auto_checkout) nextParams.set("auto_checkout", params.auto_checkout);
  if (params?.pds_plan) nextParams.set("pds_plan", params.pds_plan);
  if (params?.pds_username) nextParams.set("pds_username", params.pds_username);
  if (params?.pds_hostname) nextParams.set("pds_hostname", params.pds_hostname);
  if (params?.pds_disksize_gb) nextParams.set("pds_disksize_gb", params.pds_disksize_gb);

  const qs = nextParams.toString();
  const next = `/dashboard${qs ? `?${qs}` : ""}`;
  const loginHref = `/login${qs ? `?${qs}` : ""}`;

  return (
    <Suspense>
      <SignUpForm next={next} loginHref={loginHref} />
    </Suspense>
  );
}

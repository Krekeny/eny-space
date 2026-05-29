import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { welcomePath, type OnboardingSearchParams } from "@/lib/onboarding";
import { Button } from "@/actions/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/actions/components/ui/card";
import { Input } from "@/actions/components/ui/input";
import { Label } from "@/actions/components/ui/label";

type LoginPageProps = {
  searchParams?: Promise<
    OnboardingSearchParams & {
      message?: string;
    }
  >;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const onboarding = { pds_plan: params?.pds_plan };
  const next = welcomePath(onboarding);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect(next);
  }
  const signupQs = new URLSearchParams();
  if (params?.pds_plan) signupQs.set("pds_plan", params.pds_plan);
  const signupHref = `/signup${signupQs.toString() ? `?${signupQs}` : ""}`;

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Sign in to access your eny.space dashboard.
          </CardDescription>
        </CardHeader>
        {params?.message === "password-reset" && (
          <div className="mx-6 mb-2 rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-600">
            Password updated — please sign in with your new password.
          </div>
        )}
        <CardContent>
          <form action={signIn} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
              <p className="text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm text-muted-foreground underline underline-offset-4"
                >
                  Forgot password?
                </Link>
              </p>
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 text-sm text-muted-foreground">
          <span>
            Don&apos;t have an account?{" "}
            <Link href={signupHref} className="underline underline-offset-4">
              Sign up
            </Link>
          </span>
          <p className="text-center text-xs text-muted-foreground/70">
            Login with your eny.space email — not your Atmosphere handle.
            Atmosphere login is coming soon.
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}

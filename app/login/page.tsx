import Link from "next/link";
import { signIn } from "@/actions/auth";
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
  searchParams?: {
    auto_checkout?: string;
    pds_plan?: string;
    pds_username?: string;
    pds_hostname?: string;
    pds_disksize_gb?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const nextParams = new URLSearchParams();
  if (searchParams?.auto_checkout) {
    nextParams.set("auto_checkout", searchParams.auto_checkout);
  }
  if (searchParams?.pds_plan) {
    nextParams.set("pds_plan", searchParams.pds_plan);
  }
  if (searchParams?.pds_username) {
    nextParams.set("pds_username", searchParams.pds_username);
  }
  if (searchParams?.pds_hostname) {
    nextParams.set("pds_hostname", searchParams.pds_hostname);
  }
  if (searchParams?.pds_disksize_gb) {
    nextParams.set("pds_disksize_gb", searchParams.pds_disksize_gb);
  }

  const next = `/dashboard${nextParams.toString() ? `?${nextParams.toString()}` : ""}`;
  const signupHref = `/signup${nextParams.toString() ? `?${nextParams.toString()}` : ""}`;

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Sign in to access your eny.space dashboard.
          </CardDescription>
        </CardHeader>
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

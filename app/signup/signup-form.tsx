"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signUp } from "@/actions/auth";
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
import { PasswordInput } from "@/components/password-input";

interface SignUpFormProps {
  next: string;
  loginHref: string;
}

const EXPIRED_LINK_MESSAGE =
  "This confirmation link is invalid or has expired. Sign up again to receive a new email.";

export function SignUpForm({ next, loginHref }: SignUpFormProps) {
  const searchParams = useSearchParams();
  const linkExpired = searchParams.get("error") === "expired";
  const [state, setState] = useState<{
    error?: string;
    success?: boolean;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const result = await signUp(null, formData);
        setState(result);
      } catch {
        setState({ error: "An unexpected error occurred. Please try again." });
      }
    });
  }

  if (state?.success) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We sent you a confirmation link. Click it to confirm your email and
              activate your account.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-2">
          <div className="flex rounded-lg bg-white/5 p-1 mb-4">
            <Link
              href={loginHref}
              className="flex-1 px-3 py-1.5 text-center text-sm font-medium text-white/40 hover:text-white/70 transition-colors"
            >
              Log in
            </Link>
            <span className="flex-1 rounded-md bg-white/15 px-3 py-1.5 text-center text-sm font-semibold text-white shadow-sm">
              Create account
            </span>
          </div>
          <CardDescription>
            Get started with eny.space in a few seconds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            {linkExpired && !state?.error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {EXPIRED_LINK_MESSAGE}
              </p>
            )}
            {state?.error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            )}
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
              <PasswordInput
                id="password"
                name="password"
                minLength={6}
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-center w-full text-xs text-muted-foreground/70">
            We use email login to keep your account secure during PDS setup.
            Atmosphere login is coming soon.
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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

interface SignUpFormProps {
  next: string;
  loginHref: string;
}

export function SignUpForm({ next, loginHref }: SignUpFormProps) {
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
              We sent you a confirmation link. Click it to activate your account
              and you&apos;ll be taken to your dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>
            Get started with eny.space in a few seconds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="next" value={next} />
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
              <Input
                id="password"
                name="password"
                type="password"
                minLength={6}
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Creating account…" : "Sign Up"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 text-sm text-muted-foreground">
          <span>
            Already have an account?{" "}
            <Link href={loginHref} className="underline underline-offset-4">
              Login
            </Link>
          </span>
          <p className="text-center text-xs text-muted-foreground/70">
            We use email login to keep your account secure during PDS setup.
            Atmosphere login is coming soon.
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}

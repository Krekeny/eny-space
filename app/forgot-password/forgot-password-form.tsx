"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { requestPasswordReset } from "@/actions/auth";
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

const EXPIRED_LINK_MESSAGE =
  "This reset link is invalid or has expired. Request a new one below.";

export function ForgotPasswordForm() {
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
        const result = await requestPasswordReset(null, formData);
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
              If an account exists for that address, we sent a link to reset
              your password.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center text-sm text-muted-foreground">
            <Link href="/login" className="underline underline-offset-4">
              Back to login
            </Link>
          </CardFooter>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a link to choose a new
            password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Sending link…" : "Send reset link"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          <Link href="/login" className="underline underline-offset-4">
            Back to login
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}

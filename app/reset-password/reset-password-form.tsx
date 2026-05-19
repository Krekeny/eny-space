"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updatePassword } from "@/actions/auth";
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

export function ResetPasswordForm() {
  const [state, setState] = useState<{ error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const result = await updatePassword(null, formData);
        setState(result);
      } catch {
        setState({ error: "An unexpected error occurred. Please try again." });
      }
    });
  }

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Choose a new password</CardTitle>
          <CardDescription>
            Enter a new password for your eny.space account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {state?.error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
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
              {isPending ? "Updating…" : "Update password"}
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

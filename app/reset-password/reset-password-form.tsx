"use client";

import { useState, useTransition } from "react";
import { updatePassword, signOut } from "@/actions/auth";
import { Button } from "@/actions/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/actions/components/ui/card";
import { Input } from "@/actions/components/ui/input";
import { Label } from "@/actions/components/ui/label";

export function ResetPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isCancelling, startCancelTransition] = useTransition();

  function handleCancel() {
    startCancelTransition(async () => {
      await signOut();
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const result = await updatePassword(null, formData);
        if (result?.error) setError(result.error);
      } catch {
        setError("An unexpected error occurred. Please try again.");
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
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
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
            <Button type="submit" className="w-full" disabled={isPending || isCancelling}>
              {isPending ? "Updating…" : "Update password"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={isPending || isCancelling}
              onClick={handleCancel}
            >
              {isCancelling ? "Cancelling…" : "Cancel"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

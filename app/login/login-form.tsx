"use client";

import Link from "next/link";
import { signIn } from "@/actions/auth";
import { Button } from "@/actions/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/actions/components/ui/card";
import { Input } from "@/actions/components/ui/input";
import { Label } from "@/actions/components/ui/label";
import { PasswordInput } from "@/components/password-input";

interface LoginFormProps {
  next: string;
  signupHref: string;
  passwordResetSuccess?: boolean;
}

export function LoginForm({ next, signupHref, passwordResetSuccess }: LoginFormProps) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-2">
          <div className="flex rounded-lg bg-white/5 p-1 mb-4">
            <span className="flex-1 rounded-md bg-white/15 px-3 py-1.5 text-center text-sm font-semibold text-white shadow-sm">
              Log in
            </span>
            <Link
              href={signupHref}
              className="flex-1 px-3 py-1.5 text-center text-sm font-medium text-white/40 hover:text-white/70 transition-colors"
            >
              Create account
            </Link>
          </div>
          <CardDescription>
            Sign in to access your eny.space dashboard.
          </CardDescription>
        </CardHeader>
        {passwordResetSuccess && (
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
              <PasswordInput
                id="password"
                name="password"
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
              Log in
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-center w-full text-xs text-muted-foreground/70">
            Login with your eny.space email — not your Atmosphere handle.
            Atmosphere login is coming soon.
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}

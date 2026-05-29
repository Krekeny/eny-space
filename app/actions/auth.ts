"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const appOrigin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function signUp(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = (formData.get("next") as string) || "/welcome";
  const confirmUrl = new URL("/auth/confirm-callback", appOrigin);
  confirmUrl.searchParams.set("next", next);

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: confirmUrl.toString(),
      },
    });

    if (error) {
      return { error: error.message };
    }
  } catch (err) {
    const cause = (err as any)?.cause;
    const isTimeout =
      cause?.code === "UND_ERR_CONNECT_TIMEOUT" ||
      (err as Error)?.message === "fetch failed";
    return {
      error: isTimeout
        ? "Could not reach the server. Please check your connection and try again."
        : "An unexpected error occurred. Please try again.",
    };
  }

  return { success: true };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return { error: error.message };
  }

  const next = (formData.get("next") as string) || "/welcome";
  revalidatePath("/", "layout");
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordReset(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appOrigin}/auth/reset-callback`,
    });

    if (error) {
      return {
        error:
          error.message === "fetch failed"
            ? connectionErrorMessage(new Error("fetch failed"))
            : error.message,
      };
    }
  } catch (err) {
    return { error: connectionErrorMessage(err) };
  }

  return { success: true };
}

function connectionErrorMessage(err: unknown): string {
  const cause = (err as { cause?: { code?: string } })?.cause;
  const message = (err as Error)?.message;
  const isConnectionIssue =
    cause?.code === "UND_ERR_CONNECT_TIMEOUT" ||
    cause?.code === "ENOTFOUND" ||
    message === "fetch failed";
  return isConnectionIssue
    ? "Could not reach the server. Please check your connection and try again."
    : "An unexpected error occurred. Please try again.";
}

export async function updatePassword(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login?message=password-reset");
}

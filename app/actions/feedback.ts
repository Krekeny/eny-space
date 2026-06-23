"use server";

import { createClient } from "@/lib/supabase/server";

export type FeedbackInput = {
  message: string;
  category?: string;
  context?: string;
};

const MAX_MESSAGE = 4000;

/** Store a feedback / support request from the signed-in user. */
export async function submitFeedback(
  input: FeedbackInput,
): Promise<{ ok: boolean; error?: string }> {
  const message = input.message?.trim() ?? "";
  if (!message) return { ok: false, error: "Please enter a message." };
  if (message.length > MAX_MESSAGE) {
    return { ok: false, error: "Message is too long." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You need to be signed in." };

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    category: input.category?.slice(0, 50) ?? null,
    message,
    context: input.context?.slice(0, 200) ?? null,
  });

  if (error) {
    console.error("[feedback] insert failed", error);
    return { ok: false, error: "Could not send right now. Please try again." };
  }

  return { ok: true };
}

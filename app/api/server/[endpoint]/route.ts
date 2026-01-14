import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyActiveSubscription } from "@/actions/subscription";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ endpoint: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  // Always verify subscription status directly from Stripe (source of truth)
  const { active } = await verifyActiveSubscription();

  if (!active) {
    return NextResponse.json(
      { message: "Active subscription required" },
      { status: 403 }
    );
  }

  const { endpoint } = await params;

  // Here you would make the actual call to your other server
  // For now, this is a placeholder that you can customize
  try {
    // Example: Make a call to your external server
    // const externalServerUrl = process.env.EXTERNAL_SERVER_URL;
    // const response = await fetch(`${externalServerUrl}/${endpoint}`, {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Bearer ${userToken}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({ userId: user.id }),
    // });
    // const data = await response.json();

    // Placeholder response
    return NextResponse.json({
      success: true,
      endpoint,
      message: `Server call to ${endpoint} successful`,
      userId: user.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error making server call:", error);
    return NextResponse.json(
      { message: "Failed to make server call", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

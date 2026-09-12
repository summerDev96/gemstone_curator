import { NextResponse } from "next/server";
import { apiError } from "@/lib/apiError";
import { getClientIp } from "@/lib/clientIp";
import { checkRateLimit } from "@/lib/rateLimit";
import { issueAnonymousSession } from "@/lib/session";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`sessions:${ip}`, 20, 60_000);
  if (!rateLimit.allowed) {
    return apiError("RATE_LIMITED", "잠시 후 다시 시도해주세요.");
  }

  const session = await issueAnonymousSession();

  return NextResponse.json(
    {
      sessionId: session.sessionId,
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt.toISOString(),
    },
    { status: 201 },
  );
}

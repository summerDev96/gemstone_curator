import { NextResponse } from "next/server";
import { apiError } from "@/lib/apiError";
import { generateToken, hashToken } from "@/lib/crypto/tokenHash";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import { resolveSession } from "@/lib/session";
import { ShareLinkRequestSchema } from "@/lib/validation/recommendations";
import { zodToFieldErrors } from "@/lib/validation/zodToFieldErrors";

const SHARE_LINK_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30일, docs/13 "추가 검증 필요"

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await resolveSession(request);
  if (!session) {
    return apiError("UNAUTHORIZED", "세션이 유효하지 않습니다.");
  }

  const rateLimit = checkRateLimit(`share-links:${session.id}`, 10, 60_000);
  if (!rateLimit.allowed) {
    return apiError("RATE_LIMITED", "잠시 후 다시 시도해주세요.");
  }

  const { id } = await context.params;

  const recommendation = await prisma.recommendation.findUnique({
    where: { id },
    include: { wishSession: true },
  });
  if (
    !recommendation ||
    recommendation.wishSession.anonymousSessionId !== session.id
  ) {
    return apiError("NOT_FOUND", "결과를 찾을 수 없습니다.");
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "요청 본문이 유효한 JSON이 아닙니다.");
  }

  const parsed = ShareLinkRequestSchema.safeParse(json);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "입력값을 확인해주세요.",
      zodToFieldErrors(parsed.error),
    );
  }

  if (parsed.data.scope === "five-elements" && !recommendation.fiveElementProfileId) {
    return apiError(
      "VALIDATION_ERROR",
      "오행 분석이 아직 생성되지 않았습니다.",
      { scope: ["오행 분석 결과가 없으면 five-elements 범위로 공유할 수 없습니다."] },
    );
  }

  const token = generateToken("shr");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SHARE_LINK_TTL_MS);

  await prisma.shareLink.create({
    data: {
      recommendationId: recommendation.id,
      scope: parsed.data.scope,
      tokenHash,
      expiresAt,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

  return NextResponse.json(
    {
      token,
      url: `${appUrl}/share/${token}`,
      expiresAt: expiresAt.toISOString(),
    },
    { status: 201 },
  );
}

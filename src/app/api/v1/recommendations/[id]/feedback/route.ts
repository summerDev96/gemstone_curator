import { NextResponse } from "next/server";
import { apiError } from "@/lib/apiError";
import { prisma } from "@/lib/db";
import { resolveSession } from "@/lib/session";
import { FeedbackRequestSchema } from "@/lib/validation/recommendations";
import { zodToFieldErrors } from "@/lib/validation/zodToFieldErrors";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await resolveSession(request);
  if (!session) {
    return apiError("UNAUTHORIZED", "세션이 유효하지 않습니다.");
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

  const parsed = FeedbackRequestSchema.safeParse(json);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "입력값을 확인해주세요.",
      zodToFieldErrors(parsed.error),
    );
  }

  const existing = await prisma.feedback.findUnique({
    where: { recommendationId: id },
  });
  if (existing) {
    return apiError("CONFLICT", "이미 만족도를 제출했습니다.");
  }

  const feedback = await prisma.feedback.create({
    data: {
      recommendationId: id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  });

  return NextResponse.json(
    {
      id: feedback.id,
      rating: feedback.rating,
      createdAt: feedback.createdAt.toISOString(),
    },
    { status: 201 },
  );
}

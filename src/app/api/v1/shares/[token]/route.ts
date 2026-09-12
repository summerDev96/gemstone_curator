import { NextResponse } from "next/server";
import { apiError } from "@/lib/apiError";
import { hashToken } from "@/lib/crypto/tokenHash";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/clientIp";

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const rateLimit = checkRateLimit(`shares:${getClientIp(request)}`, 30, 60_000);
  if (!rateLimit.allowed) {
    return apiError("RATE_LIMITED", "잠시 후 다시 시도해주세요.");
  }

  const { token } = await context.params;
  const tokenHash = hashToken(token);

  const shareLink = await prisma.shareLink.findUnique({
    where: { tokenHash },
    include: {
      recommendation: {
        include: {
          stone: true,
          fiveElementProfile: { include: { integratedStone: true } },
        },
      },
    },
  });

  if (!shareLink) {
    return apiError("NOT_FOUND", "공유 링크를 찾을 수 없습니다.");
  }
  if (shareLink.revokedAt || shareLink.expiresAt.getTime() < Date.now()) {
    return apiError("SHARE_EXPIRED", "만료되었거나 철회된 공유입니다.");
  }

  await prisma.shareLink.update({
    where: { id: shareLink.id },
    data: { viewCount: { increment: 1 } },
  });

  const isFiveElements = shareLink.scope === "five-elements";
  const stone = isFiveElements
    ? shareLink.recommendation.fiveElementProfile?.integratedStone
    : shareLink.recommendation.stone;
  const summary = isFiveElements
    ? shareLink.recommendation.fiveElementProfile?.heartSummary
    : shareLink.recommendation.heartSummary;

  if (!stone || !summary) {
    return apiError("NOT_FOUND", "공유할 결과를 찾을 수 없습니다.");
  }

  return NextResponse.json({
    scope: shareLink.scope,
    stone: {
      nameKo: stone.nameKo,
      nameEn: stone.nameEn,
      colorHex: stone.colorHex,
      imageUrl: stone.imageUrl,
    },
    summary,
  });
}

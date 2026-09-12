import { apiError } from "@/lib/apiError";
import { hashToken } from "@/lib/crypto/tokenHash";
import { prisma } from "@/lib/db";
import { resolveSession } from "@/lib/session";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const session = await resolveSession(request);
  if (!session) {
    return apiError("UNAUTHORIZED", "세션이 유효하지 않습니다.");
  }

  const { token } = await context.params;
  const tokenHash = hashToken(token);

  const shareLink = await prisma.shareLink.findUnique({
    where: { tokenHash },
    include: { recommendation: { include: { wishSession: true } } },
  });

  if (
    !shareLink ||
    shareLink.recommendation.wishSession.anonymousSessionId !== session.id
  ) {
    return apiError("NOT_FOUND", "공유 링크를 찾을 수 없습니다.");
  }
  if (shareLink.revokedAt) {
    return apiError("CONFLICT", "이미 철회된 공유 링크입니다.");
  }

  await prisma.shareLink.update({
    where: { id: shareLink.id },
    data: { revokedAt: new Date() },
  });

  return new Response(null, { status: 204 });
}

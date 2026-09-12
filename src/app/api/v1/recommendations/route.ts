import { NextResponse } from "next/server";
import { apiError } from "@/lib/apiError";
import { prisma } from "@/lib/db";
import { resolveSession } from "@/lib/session";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/**
 * 로그인 없이 "보관함"을 지원하기 위한 세션 범위 결과 목록 조회.
 * docs/07의 회원 전용 `GET /me/recommendations`와 달리, 이 저장소는 계정을 만들지
 * 않기로 결정했기 때문에(docs/13 참조) 현재 비회원 세션이 소유한 결과만 반환한다.
 */
export async function GET(request: Request) {
  const session = await resolveSession(request);
  if (!session) {
    return apiError("UNAUTHORIZED", "세션이 유효하지 않습니다.");
  }

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const limitParam = Number(url.searchParams.get("limit"));
  const limit =
    Number.isInteger(limitParam) && limitParam > 0
      ? Math.min(limitParam, MAX_LIMIT)
      : DEFAULT_LIMIT;

  const recommendations = await prisma.recommendation.findMany({
    where: { wishSession: { anonymousSessionId: session.id } },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { stone: true, fiveElementProfile: { select: { id: true } } },
  });

  const hasMore = recommendations.length > limit;
  const page = hasMore ? recommendations.slice(0, limit) : recommendations;

  return NextResponse.json({
    items: page.map((r) => ({
      id: r.id,
      stone: { nameKo: r.stone.nameKo, nameEn: r.stone.nameEn, colorHex: r.stone.colorHex },
      createdAt: r.createdAt.toISOString(),
      hasFiveElements: r.fiveElementProfile !== null,
    })),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
}

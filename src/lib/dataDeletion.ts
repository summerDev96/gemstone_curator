import { prisma } from "./db";

/**
 * 비회원 세션(AnonymousSession)에 귀속된 모든 데이터를 삭제한다.
 * 계정 기능이 아직 없어 "DELETE /me/data"의 비회원 버전 역할을 한다
 * (docs/13-decisions-and-open-questions.md "삭제 경로 부재" 항목 대응).
 *
 * 삭제 순서가 중요하다: `FiveElementProfile.consentRecordId`는 ON DELETE RESTRICT라서
 * `ConsentRecord`(AnonymousSession 삭제 시 CASCADE 대상)보다 먼저 지워야 한다.
 * `Recommendation.fiveElementProfileId`/`RelationshipAnalysis.partnerFiveElementProfileId`는
 * 둘 다 ON DELETE SET NULL이므로 순서를 지키면 안전하다.
 *
 * `FiveElementProfile`은 두 경로로 이 세션에 속할 수 있다: (1) 본인 오행 분석
 * (`Recommendation.fiveElementProfileId`), (2) 관계 분석 중 상대방 오행
 * (`RelationshipAnalysis.partnerFiveElementProfileId`) — 두 경로 모두 조회해야
 * 상대방의 암호화된 생년월일시가 삭제 누락되지 않는다.
 *
 * 멱등성: 이미 삭제된(또는 동시에 다른 호출이 먼저 삭제한) 세션 id로 다시 호출해도
 * 예외를 던지지 않는다(`deleteMany`는 대상이 없어도 실패하지 않음) — 세션 만료 배치와
 * `resolveSession`의 즉시 정리가 동시에 같은 세션을 처리할 수 있어 필요한 안전장치다.
 */
export async function deleteAllDataForSession(
  anonymousSessionId: string,
): Promise<{ deletedFiveElementProfiles: number; deletedSession: boolean }> {
  return prisma.$transaction(async (tx) => {
    const profiles = await tx.fiveElementProfile.findMany({
      where: {
        OR: [
          { recommendation: { wishSession: { anonymousSessionId } } },
          {
            partnerOfAnalyses: {
              some: { recommendation: { wishSession: { anonymousSessionId } } },
            },
          },
        ],
      },
      select: { id: true },
    });

    if (profiles.length > 0) {
      await tx.fiveElementProfile.deleteMany({
        where: { id: { in: profiles.map((p) => p.id) } },
      });
    }

    // WishSession(→Recommendation→Feedback/ShareLink)과 ConsentRecord는
    // AnonymousSession 삭제 시 onDelete: Cascade로 함께 제거된다.
    const { count } = await tx.anonymousSession.deleteMany({
      where: { id: anonymousSessionId },
    });

    return { deletedFiveElementProfiles: profiles.length, deletedSession: count > 0 };
  });
}

/**
 * 만료된(그리고 소유자가 다시 방문하지 않은) 비회원 세션을 일괄 삭제한다.
 * 실행 트리거(cron 등)는 아직 정해지지 않아 스크립트로 수동/예약 실행한다
 * (`npm run cleanup:sessions`, docs/13 "추가 검증 필요": 실제 스케줄러 연동).
 */
export async function cleanupExpiredSessions(
  now: Date = new Date(),
): Promise<{ deletedSessions: number }> {
  const expired = await prisma.anonymousSession.findMany({
    where: { expiresAt: { lt: now } },
    select: { id: true },
  });

  for (const session of expired) {
    await deleteAllDataForSession(session.id);
  }

  return { deletedSessions: expired.length };
}

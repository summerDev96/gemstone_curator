import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

import { cleanupExpiredSessions } from "../src/lib/dataDeletion";
import { prisma } from "../src/lib/db";

/**
 * 만료된 비회원 세션과 관련 데이터를 일괄 삭제한다.
 * 실행: `npm run cleanup:sessions`
 * 프로덕션에서는 이 스크립트를 cron/스케줄러(예: Vercel Cron, 시스템 cron)로
 * 주기적으로 호출해야 한다(docs/13-decisions-and-open-questions.md 추가 검증 필요:
 * 실제 스케줄러 선택 및 실행 주기).
 */
async function main() {
  const { deletedSessions } = await cleanupExpiredSessions();
  console.log(`만료된 세션 ${deletedSessions}건을 삭제했습니다.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

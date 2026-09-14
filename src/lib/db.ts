import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * Next.js는 .env.local을 자동 로드하지만, `tsx`로 직접 실행하는 스크립트
 * (prisma/seed.ts, scripts/*.ts)는 그렇지 않다. 그 스크립트들도 각자
 * dotenv를 호출하지만, ES `import`는 정적으로 호이스팅되어 이 모듈이
 * 그 호출보다 먼저 평가될 수 있다(실제로 이 문제로 시드가 한 번 실패했다).
 * 이 모듈이 스스로도 로드하도록 만들어 호출 순서와 무관하게 동작하게 한다.
 */
function ensureEnvLoaded(): void {
  if (process.env.DATABASE_URL) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("dotenv").config({ path: ".env.local" });
  } catch {
    // dotenv가 없거나(프로덕션 번들 등) 이미 다른 방식으로 주입된 경우 무시한다.
  }
}

function createPrismaClient(): PrismaClient {
  ensureEnvLoaded();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL 환경변수가 설정되지 않았습니다.");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

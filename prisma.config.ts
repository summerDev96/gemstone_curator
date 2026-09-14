import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: ".env.local" });

/**
 * `env()`(from "prisma/config")는 변수가 없으면 즉시 예외를 던져 `prisma generate`까지
 * 막아버린다. `generate`는 스키마만 읽고 실제 DB 연결이 필요 없는데, 배포 환경(Vercel 등)의
 * 빌드 단계에는 DATABASE_URL이 아직 설정되지 않을 수 있어 빌드 자체가 깨지는 문제가 있었다.
 * `migrate`/`db push`처럼 실제로 연결이 필요한 명령은 이 값이 없으면 각자 명확한 오류를
 * 낸다(런타임 DB 연결은 이 파일이 아니라 src/lib/db.ts가 process.env.DATABASE_URL을
 * 직접 읽어 별도로 검증한다).
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});

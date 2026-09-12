import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

function createPrismaClient(): PrismaClient {
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

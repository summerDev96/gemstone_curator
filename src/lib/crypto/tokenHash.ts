import { randomBytes, createHash, timingSafeEqual } from "node:crypto";

function getPepper(): string {
  const pepper = process.env.SESSION_TOKEN_PEPPER;
  if (!pepper) {
    throw new Error("SESSION_TOKEN_PEPPER 환경변수가 설정되지 않았습니다.");
  }
  return pepper;
}

export function generateToken(prefix: string): string {
  return `${prefix}_${randomBytes(32).toString("hex")}`;
}

export function hashToken(token: string): string {
  return createHash("sha256")
    .update(`${getPepper()}:${token}`)
    .digest("hex");
}

export function verifyToken(token: string, hash: string): boolean {
  const computed = Buffer.from(hashToken(token), "hex");
  const expected = Buffer.from(hash, "hex");
  if (computed.length !== expected.length) return false;
  return timingSafeEqual(computed, expected);
}

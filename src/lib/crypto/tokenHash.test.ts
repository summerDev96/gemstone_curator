import { describe, expect, it } from "vitest";
import { generateToken, hashToken, verifyToken } from "./tokenHash";

describe("tokenHash", () => {
  it("발급된 토큰은 매번 다르다", () => {
    const a = generateToken("sst");
    const b = generateToken("sst");
    expect(a).not.toBe(b);
  });

  it("동일 토큰은 항상 동일 해시를 생성한다", () => {
    const token = generateToken("sst");
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it("해시로부터 원문 토큰을 복원할 수 없다 (단방향)", () => {
    const token = generateToken("sst");
    const hash = hashToken(token);
    expect(hash).not.toContain(token);
    expect(hash.length).toBe(64); // sha256 hex
  });

  it("verifyToken은 올바른 토큰만 통과시킨다", () => {
    const token = generateToken("sst");
    const hash = hashToken(token);
    expect(verifyToken(token, hash)).toBe(true);
    expect(verifyToken("wrong-token", hash)).toBe(false);
  });
});

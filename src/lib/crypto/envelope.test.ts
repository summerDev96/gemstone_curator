import { describe, expect, it } from "vitest";
import { decryptField, encryptField } from "./envelope";

describe("envelope encryption", () => {
  it("암호화한 값을 복호화하면 원문과 동일하다 (왕복 검증)", () => {
    const plaintext = "1996-04-12";
    const encrypted = encryptField(plaintext);
    expect(decryptField(encrypted)).toBe(plaintext);
  });

  it("암호화 결과에는 평문이 그대로 포함되지 않는다", () => {
    const plaintext = "1996-04-12T14:30:00";
    const encrypted = Buffer.from(encryptField(plaintext));
    expect(encrypted.toString("utf8")).not.toContain(plaintext);
    expect(encrypted.toString("base64")).not.toContain(
      Buffer.from(plaintext).toString("base64"),
    );
  });

  it("같은 평문도 매번 다른 암호문을 생성한다 (랜덤 IV)", () => {
    const a = Buffer.from(encryptField("동일한 값"));
    const b = Buffer.from(encryptField("동일한 값"));
    expect(a.equals(b)).toBe(false);
  });

  it("변조된 암호문은 복호화 시 실패한다 (GCM 무결성 검증)", () => {
    const encrypted = encryptField("민감한 값");
    const tampered = Buffer.from(encrypted);
    tampered[tampered.length - 1] ^= 0xff;
    expect(() => decryptField(tampered)).toThrow();
  });
});

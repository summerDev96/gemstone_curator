import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKek(): Buffer {
  const b64 = process.env.ENCRYPTION_KEK;
  if (!b64) {
    throw new Error("ENCRYPTION_KEK 환경변수가 설정되지 않았습니다.");
  }
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEK는 base64로 인코딩된 32바이트 키여야 합니다.");
  }
  return key;
}

/**
 * docs/12-privacy-security-compliance.md#암호화-정책
 * application-level envelope encryption(AES-256-GCM). KEK는 환경변수로 주입한다
 * (실제 운영에서는 KMS 관리 필요, docs/13 추가 검증 필요).
 * 출력 포맷: [iv(12B)][authTag(16B)][ciphertext]
 */
export function encryptField(plaintext: string): Uint8Array<ArrayBuffer> {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKek(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, ciphertext]);

  const out = new Uint8Array(combined.length);
  out.set(combined);
  return out;
}

export function decryptField(encrypted: Uint8Array): string {
  const buf = Buffer.from(
    encrypted.buffer,
    encrypted.byteOffset,
    encrypted.byteLength,
  );
  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + 16);
  const ciphertext = buf.subarray(IV_LENGTH + 16);
  const decipher = createDecipheriv(ALGORITHM, getKek(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
    "utf8",
  );
}

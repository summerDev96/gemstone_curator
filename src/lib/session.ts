import type { AnonymousSession } from "@prisma/client";
import { prisma } from "./db";
import { generateToken, hashToken } from "./crypto/tokenHash";
import { deleteAllDataForSession } from "./dataDeletion";

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30일, docs/06 "추가 검증 필요"

export interface IssuedSession {
  sessionId: string;
  sessionToken: string;
  expiresAt: Date;
}

export async function issueAnonymousSession(): Promise<IssuedSession> {
  const sessionToken = generateToken("sst");
  const sessionTokenHash = hashToken(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  const session = await prisma.anonymousSession.create({
    data: { sessionTokenHash, expiresAt },
  });

  return { sessionId: session.id, sessionToken, expiresAt };
}

export function extractBearerToken(
  request: Request | { headers: Headers },
): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1] : null;
}

export async function resolveSession(
  request: Request,
): Promise<AnonymousSession | null> {
  const token = extractBearerToken(request);
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.anonymousSession.findUnique({
    where: { sessionTokenHash: tokenHash },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    // 만료된 세션을 우연히 다시 만난 시점에 즉시 정리한다(배치 정리의 보완책).
    await deleteAllDataForSession(session.id);
    return null;
  }

  await prisma.anonymousSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });

  return session;
}

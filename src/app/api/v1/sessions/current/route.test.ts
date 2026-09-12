import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { POST as issueSession } from "../route";
import { DELETE as deleteCurrentSession } from "./route";

describe("DELETE /api/v1/sessions/current", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("세션 없이 호출하면 401을 반환한다", async () => {
    const res = await deleteCurrentSession(
      new Request("http://localhost/api/v1/sessions/current", { method: "DELETE" }),
    );
    expect(res.status).toBe(401);
  });

  it("유효한 세션이면 204를 반환하고 세션과 데이터를 삭제한다", async () => {
    const sessionRes = await issueSession(
      new Request("http://localhost/api/v1/sessions", { method: "POST" }),
    );
    const { sessionId, sessionToken } = await sessionRes.json();

    const res = await deleteCurrentSession(
      new Request("http://localhost/api/v1/sessions/current", {
        method: "DELETE",
        headers: { authorization: `Bearer ${sessionToken}` },
      }),
    );
    expect(res.status).toBe(204);

    expect(await prisma.anonymousSession.findUnique({ where: { id: sessionId } })).toBeNull();
  });

  it("삭제된 세션 토큰으로는 더 이상 인증되지 않는다", async () => {
    const sessionRes = await issueSession(
      new Request("http://localhost/api/v1/sessions", { method: "POST" }),
    );
    const { sessionToken } = await sessionRes.json();

    await deleteCurrentSession(
      new Request("http://localhost/api/v1/sessions/current", {
        method: "DELETE",
        headers: { authorization: `Bearer ${sessionToken}` },
      }),
    );

    const second = await deleteCurrentSession(
      new Request("http://localhost/api/v1/sessions/current", {
        method: "DELETE",
        headers: { authorization: `Bearer ${sessionToken}` },
      }),
    );
    expect(second.status).toBe(401);
  });
});

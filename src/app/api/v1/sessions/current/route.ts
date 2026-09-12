import { apiError } from "@/lib/apiError";
import { deleteAllDataForSession } from "@/lib/dataDeletion";
import { checkRateLimit } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/clientIp";
import { resolveSession } from "@/lib/session";

/**
 * 비회원 세션의 "내 데이터 삭제" 경로. 계정 기능이 아직 없어 docs/07의
 * `DELETE /me/data`(회원 전용) 대신, 현재 세션이 소유한 모든 데이터를 삭제한다.
 * docs/13-decisions-and-open-questions.md "비회원 세션 삭제 경로 부재" 항목 대응.
 */
export async function DELETE(request: Request) {
  const session = await resolveSession(request);
  if (!session) {
    return apiError("UNAUTHORIZED", "세션이 유효하지 않습니다.");
  }

  const rateLimit = checkRateLimit(
    `sessions-current-delete:${getClientIp(request)}`,
    5,
    60_000,
  );
  if (!rateLimit.allowed) {
    return apiError("RATE_LIMITED", "잠시 후 다시 시도해주세요.");
  }

  await deleteAllDataForSession(session.id);

  return new Response(null, { status: 204 });
}

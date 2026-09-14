import { apiFetch } from "@/lib/client/session";

/**
 * "내 사주로 추천받기"/"관계의 사주로 추천받기"는 소원·감정을 직접 고르지 않고
 * 곧바로 생년월일 입력으로 들어간다. 하지만 오행/관계 화면은 기존 `Recommendation`
 * 레코드(id)가 있어야 진입할 수 있는 구조라, 기존 `POST /recommendations/basic` API를
 * 그대로(기본값 소원/감정으로) 호출해 화면에는 보이지 않는 추천을 하나 만든다.
 * 이 추천의 "기본 원석"은 사용자에게 노출되지 않으며, 오행 결과(myStone)는
 * 이후 화면에서 생년월일 기반으로 새로 계산되므로 이 기본값 선택과 무관하다
 * (docs/13 참조). API 자체는 전혀 바꾸지 않는다.
 */
export async function createDefaultRecommendationId(): Promise<string> {
  const catalogRes = await apiFetch("/api/v1/catalog/wishes");
  if (!catalogRes.ok) throw new Error("카탈로그를 불러오지 못했습니다.");
  const catalog = await catalogRes.json();
  const primaryWishTagId = catalog.wishes?.[0]?.id;
  const heartTagId = catalog.emotions?.[0]?.id;
  if (!primaryWishTagId || !heartTagId) {
    throw new Error("기본 소원/감정 태그를 찾지 못했습니다.");
  }

  const res = await apiFetch("/api/v1/recommendations/basic", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ primaryWishTagId, heartTagId }),
  });
  if (!res.ok) throw new Error("추천을 생성하지 못했습니다.");
  const body = await res.json();
  return body.id as string;
}

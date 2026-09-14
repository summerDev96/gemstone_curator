"use client";

import { useState } from "react";
import { NavigableCtaCard } from "@/components/result/NavigableCtaCard";
import { getOrCreateSessionToken } from "@/lib/client/session";
import { clearWishFlowState } from "@/lib/client/wishFlowStore";
import { createDefaultRecommendationId } from "@/lib/client/createDefaultRecommendation";

/** 메인 화면의 3가지 추천 방식 진입 버튼. 기존 사주/관계 화면은 그대로 재사용하고,
 * 여기서는 각 방식에 맞는 진입 경로로만 분기한다. */
export function EntryModeButtons() {
  const [error, setError] = useState<string | null>(null);

  async function prepareSajuEntry(): Promise<string> {
    await getOrCreateSessionToken();
    clearWishFlowState();
    const id = await createDefaultRecommendationId();
    return `/result/${id}/five-elements/intro`;
  }

  async function prepareRelationshipEntry(): Promise<string> {
    await getOrCreateSessionToken();
    clearWishFlowState();
    const id = await createDefaultRecommendationId();
    return `/result/${id}/relationship`;
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <NavigableCtaCard
        title="✨ 내 염원으로 추천받기"
        description="지금 나에게 필요한 기운과 염원에 맞는 원석을 찾아보세요."
        event="landing_desire_click"
        href="/desire"
      />
      <NavigableCtaCard
        title="🔮 내 사주로 추천받기"
        description="나의 사주와 오행을 바탕으로 원석을 추천받아보세요."
        event="landing_saju_click"
        href="/wish"
        onBeforeNavigate={() =>
          prepareSajuEntry().catch((e) => {
            setError("시작하지 못했어요. 잠시 후 다시 시도해주세요.");
            throw e;
          })
        }
      />
      <NavigableCtaCard
        title="💕 관계의 사주로 추천받기"
        description="나와 소중한 사람의 사주를 바탕으로 원석을 찾아보세요."
        event="landing_relationship_click"
        href="/wish"
        onBeforeNavigate={() =>
          prepareRelationshipEntry().catch((e) => {
            setError("시작하지 못했어요. 잠시 후 다시 시도해주세요.");
            throw e;
          })
        }
      />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

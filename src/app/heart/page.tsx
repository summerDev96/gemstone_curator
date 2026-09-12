"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StepHeader } from "@/components/ui/StepHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { HeartOptionList } from "@/components/heart/HeartOptionList";
import { OptionalFreeTextArea } from "@/components/heart/OptionalFreeTextArea";
import { TrackView } from "@/components/TrackView";
import { apiFetch } from "@/lib/client/session";
import { getWishFlowState, setWishFlowState } from "@/lib/client/wishFlowStore";
import { track } from "@/lib/analytics/track";

interface CatalogTag {
  id: string;
  slug: string;
  labelKo: string;
}

const MAX_FREE_TEXT = 300;

export default function HeartPage() {
  const router = useRouter();
  const [emotions, setEmotions] = useState<CatalogTag[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [heartId, setHeartId] = useState<string | null>(
    () => getWishFlowState().heartTagId ?? null,
  );
  const [freeText, setFreeText] = useState(
    () => getWishFlowState().freeText ?? "",
  );

  useEffect(() => {
    if (!getWishFlowState().primaryWishTagId) {
      router.replace("/wish");
      return;
    }

    apiFetch("/api/v1/catalog/wishes")
      .then(async (res) => {
        if (!res.ok) throw new Error("failed");
        const body = await res.json();
        setEmotions(body.emotions);
      })
      .catch(() => setError("목록을 불러오지 못했어요."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelect(id: string) {
    setHeartId(id);
    track("heart_selected", { tagId: id });
  }

  function handleNext() {
    if (!heartId || freeText.length > MAX_FREE_TEXT) return;
    const heart = emotions?.find((e) => e.id === heartId);
    setWishFlowState({
      heartTagId: heartId,
      heartLabel: heart?.labelKo,
      freeText: freeText.trim() || undefined,
    });
    if (freeText.trim()) track("free_text_provided", { provided: true });
    track("heart_next_click");
    router.push("/result/new");
  }

  const options = emotions?.map((e) => ({ id: e.id, label: e.labelKo })) ?? [];

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
      <TrackView event="heart_view" />
      <StepHeader step={2} totalSteps={3} />

      <h1 className="pt-2 text-xl font-semibold text-text-primary">
        요즘 마음과 가장 가까운 문장을 골라주세요
      </h1>

      {error && (
        <p role="alert" className="pt-4 text-sm text-danger">
          {error}
        </p>
      )}
      {!emotions && !error && (
        <p className="pt-4 text-sm text-text-secondary">불러오는 중...</p>
      )}

      {emotions && (
        <div className="flex flex-col gap-8 py-6">
          <HeartOptionList
            legend="현재 마음"
            name="heart"
            options={options}
            value={heartId}
            onChange={handleSelect}
          />
          <OptionalFreeTextArea value={freeText} onChange={setFreeText} />
        </div>
      )}

      <div className="mt-auto py-6">
        <PrimaryButton
          onClick={handleNext}
          disabled={!heartId || freeText.length > MAX_FREE_TEXT}
        >
          결과 보기
        </PrimaryButton>
      </div>
    </main>
  );
}

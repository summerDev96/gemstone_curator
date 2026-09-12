"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StepHeader } from "@/components/ui/StepHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TagChipGroup, type TagOption } from "@/components/ui/TagChipGroup";
import { TrackView } from "@/components/TrackView";
import { apiFetch } from "@/lib/client/session";
import { getWishFlowState, setWishFlowState } from "@/lib/client/wishFlowStore";
import { track } from "@/lib/analytics/track";

interface CatalogTag {
  id: string;
  slug: string;
  labelKo: string;
}

export default function WishPage() {
  const router = useRouter();
  const [wishes, setWishes] = useState<CatalogTag[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [primaryId, setPrimaryId] = useState<string | null>(
    () => getWishFlowState().primaryWishTagId ?? null,
  );
  const [secondaryId, setSecondaryId] = useState<string | null>(
    () => getWishFlowState().secondaryWishTagId ?? null,
  );

  useEffect(() => {
    apiFetch("/api/v1/catalog/wishes")
      .then(async (res) => {
        if (!res.ok) throw new Error("failed");
        const body = await res.json();
        setWishes(body.wishes);
      })
      .catch(() => setError("소원 목록을 불러오지 못했어요."));
  }, []);

  const options: TagOption[] =
    wishes?.map((w) => ({ id: w.id, label: w.labelKo })) ?? [];

  function handlePrimarySelect(id: string) {
    setPrimaryId(id);
    if (secondaryId === id) setSecondaryId(null);
    track("wish_primary_selected", { tagId: id });
  }

  function handleSecondarySelect(id: string) {
    const next = secondaryId === id ? null : id;
    setSecondaryId(next);
    if (next) track("wish_secondary_selected", { tagId: next });
  }

  function handleNext() {
    if (!primaryId) return;
    const primary = wishes?.find((w) => w.id === primaryId);
    const secondary = secondaryId
      ? wishes?.find((w) => w.id === secondaryId)
      : undefined;
    setWishFlowState({
      primaryWishTagId: primaryId,
      primaryWishLabel: primary?.labelKo,
      secondaryWishTagId: secondaryId ?? undefined,
      secondaryWishLabel: secondary?.labelKo,
    });
    track("wish_next_click");
    router.push("/heart");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
      <TrackView event="wish_view" />
      <StepHeader step={1} totalSteps={3} />

      <h1 className="pt-2 text-xl font-semibold text-text-primary">
        지금 가장 바라는 건 무엇인가요?
      </h1>
      <p className="pb-6 pt-1 text-sm text-text-secondary">
        최대 2개까지 선택할 수 있어요.
      </p>

      {error && (
        <p role="alert" className="pb-4 text-sm text-danger">
          {error}
        </p>
      )}

      {!wishes && !error && (
        <p className="text-sm text-text-secondary">불러오는 중...</p>
      )}

      {wishes && (
        <div className="flex flex-col gap-8">
          <TagChipGroup
            legend="주 소원"
            name="primary-wish"
            options={options}
            value={primaryId}
            onChange={handlePrimarySelect}
          />

          {primaryId && (
            <div>
              <p className="pb-3 text-sm font-medium text-text-primary">
                하나 더 고를까요? (선택)
              </p>
              <div className="flex flex-wrap gap-3">
                {options
                  .filter((o) => o.id !== primaryId)
                  .map((option) => {
                    const selected = secondaryId === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => handleSecondarySelect(option.id)}
                        className={`min-h-[44px] rounded-[var(--radius-full)] border px-4 py-2 text-base transition-colors ${
                          selected
                            ? "border-accent-primary bg-accent-primary/10 font-medium text-accent-primary"
                            : "border-border-subtle bg-bg-surface text-text-primary hover:border-accent-primary/50"
                        }`}
                      >
                        {selected ? "✓ " : ""}
                        {option.label}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto py-6">
        <PrimaryButton onClick={handleNext} disabled={!primaryId}>
          다음
        </PrimaryButton>
      </div>
    </main>
  );
}

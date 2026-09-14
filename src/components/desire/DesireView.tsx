"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { StepHeader } from "@/components/ui/StepHeader";
import { StoneAvatar } from "@/components/ui/StoneAvatar";
import { TrackView } from "@/components/TrackView";
import { apiFetch } from "@/lib/client/session";
import { track } from "@/lib/analytics/track";
import { USER_DESIRE_LABEL, type UserDesire } from "@/lib/desire/mapping";

const DESIRE_EMOJI: Record<UserDesire, string> = {
  love: "❤️",
  romance: "💕",
  health: "🌿",
  vitality: "🔥",
  study: "📚",
  healing: "🕊️",
  relationships: "🤝",
  protection: "🛡️",
  defense: "🔰",
};

const DESIRE_ORDER: UserDesire[] = [
  "love",
  "romance",
  "health",
  "vitality",
  "study",
  "healing",
  "relationships",
  "protection",
  "defense",
];

interface DesireOtherStone {
  id: string;
  slug: string;
  nameKo: string;
  nameEn: string;
  colorHex: string;
  imageUrl: string | null;
  summary: string;
}

interface DesireTopStone extends DesireOtherStone {
  heartSummary: string;
  rationale: string;
  comfortLines: string[];
  microAction: string;
  usedFallback: boolean;
}

type Step = "select" | "loading" | "result" | "error";

export function DesireView() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("select");
  const [topStone, setTopStone] = useState<DesireTopStone | null>(null);
  const [otherStones, setOtherStones] = useState<DesireOtherStone[]>([]);

  async function selectDesire(desire: UserDesire) {
    setStep("loading");
    track("desire_selected", { desire });
    try {
      const res = await apiFetch("/api/v1/recommendations/desire", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ desire }),
      });
      if (!res.ok) {
        setStep("error");
        return;
      }
      const body = await res.json();
      setTopStone(body.topStone ?? null);
      setOtherStones(body.otherStones ?? []);
      setStep("result");
    } catch {
      setStep("error");
    }
  }

  if (step === "select") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
        <TrackView event="desire_view" />
        <StepHeader step={1} totalSteps={1} onBack={() => router.push("/")} />
        <h1 className="pt-2 text-xl font-semibold text-text-primary">
          지금 어떤 마음이 필요하신가요?
        </h1>
        <p className="pt-2 text-base text-text-secondary">
          하나를 고르면, 그 마음에 어울리는 원석을 찾아드려요.
        </p>
        <div className="grid grid-cols-2 gap-3 py-6">
          {DESIRE_ORDER.map((desire) => (
            <button
              key={desire}
              type="button"
              onClick={() => selectDesire(desire)}
              className="flex min-h-[56px] items-center gap-2 rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface px-4 py-3 text-base text-text-primary transition-colors hover:border-accent-primary/50"
            >
              <span aria-hidden="true">{DESIRE_EMOJI[desire]}</span>
              {USER_DESIRE_LABEL[desire]}
            </button>
          ))}
        </div>
      </main>
    );
  }

  if (step === "loading") {
    return (
      <main
        className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center"
        role="status"
        aria-live="polite"
      >
        <div
          aria-hidden="true"
          className="h-16 w-16 animate-pulse rounded-full bg-accent-primary/20 motion-reduce:animate-none"
        />
        <p className="text-base text-text-secondary">어울리는 원석을 찾고 있어요...</p>
      </main>
    );
  }

  if (step === "error") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-base text-text-secondary">결과를 만드는 중 문제가 생겼어요.</p>
        <PrimaryButton onClick={() => setStep("select")}>다시 시도</PrimaryButton>
      </main>
    );
  }

  if (!topStone) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
        <TrackView event="desire_result_view" />
        <StepHeader step={1} totalSteps={1} onBack={() => setStep("select")} />
        <p className="pt-6 text-base text-text-secondary">
          아직 이 염원에 등록된 원석이 없어요.
        </p>
        <div className="flex flex-col gap-3 pb-8 pt-6">
          <PrimaryButton variant="secondary" onClick={() => router.push("/")}>
            처음으로
          </PrimaryButton>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
      <TrackView event="desire_result_view" />
      <StepHeader step={1} totalSteps={1} onBack={() => setStep("select")} />

      <section className="flex flex-col items-center gap-3 py-4 text-center">
        <StoneAvatar
          imageUrl={topStone.imageUrl}
          colorHex={topStone.colorHex}
          alt={topStone.nameKo}
          size={112}
        />
        <h1 className="text-lg font-semibold text-text-primary">
          {topStone.nameKo}
          <span className="pl-2 text-sm font-normal text-text-secondary">
            {topStone.nameEn}
          </span>
        </h1>
        <p className="text-sm text-text-secondary">가장 어울리는 원석</p>
      </section>

      <div className="flex flex-col gap-6 py-4">
        <div>
          <h2 className="pb-2 text-sm font-medium text-text-secondary">마음 요약</h2>
          <p className="text-base text-text-primary">{topStone.heartSummary}</p>
        </div>
        <div>
          <h2 className="pb-2 text-sm font-medium text-text-secondary">추천 이유</h2>
          <p className="text-base text-text-primary">{topStone.rationale}</p>
        </div>
        <div>
          <h2 className="pb-2 text-sm font-medium text-text-secondary">위로의 말</h2>
          <ul className="flex flex-col gap-1">
            {topStone.comfortLines.map((line) => (
              <li key={line} className="text-base text-text-primary">
                {line}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="pb-2 text-sm font-medium text-text-secondary">오늘의 작은 행동</h2>
          <p className="text-base text-text-primary">{topStone.microAction}</p>
        </div>
      </div>

      {otherStones.length > 0 && (
        <div className="pt-4">
          <h2 className="pb-3 text-sm font-medium text-text-secondary">그 외의 원석</h2>
          <div className="flex flex-col gap-3">
            {otherStones.map((stone) => (
              <div
                key={stone.id}
                className="flex items-center gap-4 rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-3"
              >
                <StoneAvatar
                  imageUrl={stone.imageUrl}
                  colorHex={stone.colorHex}
                  alt={stone.nameKo}
                  size={48}
                />
                <div>
                  <p className="font-medium text-text-primary">
                    {stone.nameKo}
                    <span className="pl-2 text-sm font-normal text-text-secondary">
                      {stone.nameEn}
                    </span>
                  </p>
                  <p className="pt-1 text-sm text-text-secondary">{stone.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 pb-8 pt-6">
        <PrimaryButton variant="secondary" onClick={() => router.push("/")}>
          처음으로
        </PrimaryButton>
      </div>
    </main>
  );
}

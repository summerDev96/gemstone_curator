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

interface DesireStone {
  id: string;
  slug: string;
  nameKo: string;
  nameEn: string;
  colorHex: string;
  imageUrl: string | null;
  summary: string;
}

type Step = "select" | "loading" | "result" | "error";

export function DesireView() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("select");
  const [stones, setStones] = useState<DesireStone[]>([]);

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
      setStones(body.stones ?? []);
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

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
      <TrackView event="desire_result_view" />
      <StepHeader step={1} totalSteps={1} onBack={() => setStep("select")} />
      <h1 className="pt-2 text-xl font-semibold text-text-primary">
        이 마음에 어울리는 원석이에요
      </h1>

      {stones.length === 0 ? (
        <p className="pt-6 text-base text-text-secondary">
          아직 이 염원에 등록된 원석이 없어요.
        </p>
      ) : (
        <div className="flex flex-col gap-4 py-6">
          {stones.map((stone) => (
            <div
              key={stone.id}
              className="flex items-center gap-4 rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-4"
            >
              <StoneAvatar
                imageUrl={stone.imageUrl}
                colorHex={stone.colorHex}
                alt={stone.nameKo}
                size={64}
              />
              <div>
                <p className="font-semibold text-text-primary">
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
      )}

      <div className="flex flex-col gap-3 pb-8">
        <PrimaryButton variant="secondary" onClick={() => router.push("/")}>
          처음으로
        </PrimaryButton>
      </div>
    </main>
  );
}

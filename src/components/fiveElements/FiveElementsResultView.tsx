"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StepHeader } from "@/components/ui/StepHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ExpansionCtaCard } from "@/components/result/ExpansionCtaCard";
import { ShareButton } from "@/components/result/ShareButton";
import { TrackView } from "@/components/TrackView";
import { apiFetch } from "@/lib/client/session";

const ELEMENT_LABEL: Record<string, string> = {
  WOOD: "목",
  FIRE: "화",
  EARTH: "토",
  METAL: "금",
  WATER: "수",
};

interface FiveElementsDetail {
  fiveElementProfileId: string;
  computedElement: string;
  balance: Record<string, number>;
  integratedStone: {
    nameKo: string;
    nameEn: string;
    colorHex: string;
  };
  heartSummary: string;
  rationale: string;
  comfortLines: string[];
  microAction: string;
}

interface RecommendationDetail {
  id: string;
  fiveElements: FiveElementsDetail | null;
}

export function FiveElementsResultView({ id }: { id: string }) {
  const router = useRouter();
  const [data, setData] = useState<RecommendationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`/api/v1/recommendations/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("failed");
        const body = (await res.json()) as RecommendationDetail;
        if (!body.fiveElements) {
          router.replace(`/result/${id}/five-elements/intro`);
          return;
        }
        setData(body);
      })
      .catch(() => setError("결과를 불러오지 못했어요."));
  }, [id, router]);

  if (error) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4">
        <p role="alert" className="text-base text-danger">
          {error}
        </p>
      </main>
    );
  }

  if (!data?.fiveElements) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4">
        <p className="text-sm text-text-secondary">불러오는 중...</p>
      </main>
    );
  }

  const fe = data.fiveElements;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
      <TrackView event="five_elements_result_view" />
      <StepHeader
        step={3}
        totalSteps={3}
        onBack={() => router.push(`/result/${id}`)}
        rightSlot={<ShareButton recommendationId={id} scope="five-elements" />}
      />

      <section className="py-4">
        <h2 className="pb-2 text-sm font-medium text-text-secondary">오행 균형</h2>
        <div className="flex flex-col gap-2">
          {Object.entries(fe.balance).map(([element, ratio]) => (
            <div key={element} className="flex items-center gap-2">
              <span className="w-6 text-sm text-text-secondary">
                {ELEMENT_LABEL[element] ?? element}
              </span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-bg-surface">
                <div
                  className="h-full rounded-full bg-accent-primary"
                  style={{ width: `${Math.round(ratio * 100)}%` }}
                />
              </div>
              <span className="w-10 text-right text-xs text-text-secondary">
                {Math.round(ratio * 100)}%
              </span>
            </div>
          ))}
        </div>
      </section>

      <p className="pb-2 text-base text-text-primary">
        당신에게 필요한 기운은 {ELEMENT_LABEL[fe.computedElement] ?? fe.computedElement}이에요
      </p>

      <section className="flex flex-col items-center gap-3 py-4 text-center">
        <div
          aria-hidden="true"
          className="flex h-28 w-28 items-center justify-center rounded-full"
          style={{ backgroundColor: `${fe.integratedStone.colorHex}33` }}
        >
          <div
            className="h-16 w-16 rounded-full"
            style={{ backgroundColor: fe.integratedStone.colorHex }}
          />
        </div>
        <h1 className="text-lg font-semibold text-text-primary">
          {fe.integratedStone.nameKo}
          <span className="pl-2 text-sm font-normal text-text-secondary">
            {fe.integratedStone.nameEn}
          </span>
        </h1>
      </section>

      <div className="flex flex-col gap-6 py-4">
        <div>
          <h2 className="pb-2 text-sm font-medium text-text-secondary">마음 요약</h2>
          <p className="text-base text-text-primary">{fe.heartSummary}</p>
        </div>
        <div>
          <h2 className="pb-2 text-sm font-medium text-text-secondary">
            오행 기반 추천 이유
          </h2>
          <p className="text-base text-text-primary">{fe.rationale}</p>
        </div>
        <div>
          <h2 className="pb-2 text-sm font-medium text-text-secondary">위로의 말</h2>
          <ul className="flex flex-col gap-2">
            {fe.comfortLines.map((line, i) => (
              <li key={i} className="text-base text-text-primary">
                {line}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="pb-2 text-sm font-medium text-text-secondary">
            오늘의 작은 행동
          </h2>
          <p className="text-base text-text-primary">{fe.microAction}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 py-6">
        <ExpansionCtaCard
          title="관계 원석 알아보기"
          description="소중한 인연과의 원석도 함께 알아볼 수 있어요."
          event="relationship_cta_click"
        />
      </div>

      <div className="flex flex-col gap-3 pb-8">
        <p className="text-center text-xs text-text-secondary">
          이 결과는 이 브라우저의{" "}
          <Link href="/library" className="text-accent-primary underline">
            보관함
          </Link>
          에서 다시 볼 수 있어요.
        </p>
        <PrimaryButton variant="secondary" onClick={() => router.push("/")}>
          처음으로
        </PrimaryButton>
      </div>
    </main>
  );
}

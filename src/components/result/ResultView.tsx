"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { StepHeader } from "@/components/ui/StepHeader";
import { FeedbackRating } from "@/components/result/FeedbackRating";
import { NavigableCtaCard } from "@/components/result/NavigableCtaCard";
import { ShareButton } from "@/components/result/ShareButton";
import { StoneAvatar } from "@/components/ui/StoneAvatar";
import { TrackView } from "@/components/TrackView";
import { apiFetch } from "@/lib/client/session";

interface RecommendationDetail {
  id: string;
  stone: {
    nameKo: string;
    nameEn: string;
    colorHex: string;
    imageUrl: string | null;
  };
  heartSummary: string;
  rationale: string;
  comfortLines: string[];
  microAction: string;
  fiveElements: { fiveElementProfileId: string } | null;
}

export function ResultView({ id }: { id: string }) {
  const router = useRouter();
  const [data, setData] = useState<RecommendationDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`/api/v1/recommendations/${id}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error("failed");
        setData(await res.json());
      })
      .catch(() => setError("결과를 불러오지 못했어요."));
  }, [id]);

  if (notFound) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-base text-text-secondary">
          결과를 찾을 수 없어요.
        </p>
        <Link href="/" className="text-accent-primary underline">
          처음으로 돌아가기
        </Link>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <p role="alert" className="text-base text-danger">
          {error}
        </p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4">
        <p className="text-sm text-text-secondary">불러오는 중...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
      <TrackView event="recommendation_view" props={{ stone: data.stone.nameKo }} />
      <StepHeader step={3} totalSteps={3} />

      <section className="flex flex-col items-center gap-3 py-4 text-center">
        <StoneAvatar
          imageUrl={data.stone.imageUrl}
          colorHex={data.stone.colorHex}
          alt={data.stone.nameKo}
          size={128}
        />
        <h1 className="text-xl font-semibold text-text-primary">
          {data.stone.nameKo}
          <span className="pl-2 text-sm font-normal text-text-secondary">
            {data.stone.nameEn}
          </span>
        </h1>
      </section>

      <div className="flex flex-col gap-6 py-4">
        <ResultSection title="마음 요약" body={data.heartSummary} />
        <ResultSection title="추천 이유" body={data.rationale} />
        <div>
          <h2 className="pb-2 text-sm font-medium text-text-secondary">
            위로의 말
          </h2>
          <ul className="flex flex-col gap-2">
            {data.comfortLines.map((line, i) => (
              <li key={i} className="text-base text-text-primary">
                {line}
              </li>
            ))}
          </ul>
        </div>
        <ResultSection title="오늘의 작은 행동" body={data.microAction} />
      </div>

      <div className="py-4">
        <FeedbackRating recommendationId={data.id} />
      </div>

      <div className="flex flex-col gap-3 py-6">
        {data.fiveElements ? (
          <NavigableCtaCard
            title="오행 분석 결과 보기"
            description="이미 오행 통합 결과를 생성했어요."
            event="five_elements_cta_click"
            href={`/result/${data.id}/five-elements`}
          />
        ) : (
          <NavigableCtaCard
            title="오행 분석 더 알아보기"
            description="생년월일시를 더하면 오행 기반 추천을 받을 수 있어요."
            event="five_elements_cta_click"
            href={`/result/${data.id}/five-elements/intro`}
          />
        )}
        <NavigableCtaCard
          title="관계 원석 알아보기"
          description="소중한 인연과의 원석도 함께 알아볼 수 있어요."
          event="relationship_cta_click"
          href={`/result/${data.id}/relationship`}
        />
      </div>

      <div className="flex flex-col gap-3 pb-8">
        <ShareButton recommendationId={data.id} scope="basic" />
        <PrimaryButton variant="secondary" onClick={() => router.push("/")}>
          처음으로
        </PrimaryButton>
        <p className="text-center text-xs text-text-secondary">
          이 결과는 이 브라우저의{" "}
          <Link href="/library" className="text-accent-primary underline">
            보관함
          </Link>
          에서 다시 볼 수 있어요.
        </p>
      </div>
    </main>
  );
}

function ResultSection({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2 className="pb-2 text-sm font-medium text-text-secondary">{title}</h2>
      <p className="text-base text-text-primary">{body}</p>
    </div>
  );
}

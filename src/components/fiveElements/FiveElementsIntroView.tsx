"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { StepHeader } from "@/components/ui/StepHeader";
import { TrackView } from "@/components/TrackView";
import { track } from "@/lib/analytics/track";

export function FiveElementsIntroView({ id }: { id: string }) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
      <TrackView event="five_elements_intro_view" />
      <StepHeader step={1} totalSteps={3} onBack={() => router.push(`/result/${id}`)} />

      <h1 className="pt-2 text-xl font-semibold text-text-primary">
        오행으로 더 깊이 알아볼까요?
      </h1>
      <p className="pt-2 text-base text-text-secondary">
        생년월일시를 입력하면 당신의 오행 균형에 맞는 원석을 추천해드려요.
      </p>

      <div className="mt-6 flex flex-col gap-2 rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-4 text-sm text-text-secondary">
        <p>
          <span className="font-medium text-text-primary">수집 항목: </span>
          생년월일시(양력/음력, 출생시간은 선택)
        </p>
        <p>
          <span className="font-medium text-text-primary">사용 목적: </span>
          오행 계산 전용
        </p>
        <p>
          <span className="font-medium text-text-primary">보관 방식: </span>
          암호화 저장
        </p>
        <p>
          <span className="font-medium text-text-primary">철회: </span>
          언제든 가능
        </p>
      </div>

      <label className="mt-6 flex items-start gap-3 text-sm text-text-primary">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 h-5 w-5 accent-[var(--color-accent-primary)]"
        />
        안내를 읽었으며 동의합니다
      </label>

      <div className="mt-auto flex flex-col gap-3 py-6">
        <PrimaryButton
          disabled={!agreed}
          onClick={() => {
            track("five_elements_consent_granted");
            router.push(`/result/${id}/five-elements/birth-info`);
          }}
        >
          동의하고 계속하기
        </PrimaryButton>
        <PrimaryButton
          variant="secondary"
          onClick={() => {
            track("five_elements_consent_denied");
            router.push(`/result/${id}`);
          }}
        >
          다음에 할게요
        </PrimaryButton>
      </div>
    </main>
  );
}

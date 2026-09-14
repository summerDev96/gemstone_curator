"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GemIcon } from "@/components/ui/GemIcon";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiFetch } from "@/lib/client/session";
import { getWishFlowState } from "@/lib/client/wishFlowStore";
import { track } from "@/lib/analytics/track";

type State = "loading" | "error" | "safety_blocked";

export default function ResultNewPage() {
  const router = useRouter();
  const [state, setState] = useState<State>("loading");
  const requestedRef = useRef(false);

  const requestRecommendation = useCallback(async () => {
    setState("loading");
    const flow = getWishFlowState();
    if (!flow.primaryWishTagId || !flow.heartTagId) {
      router.replace("/wish");
      return;
    }

    track("recommendation_requested");

    try {
      const res = await apiFetch("/api/v1/recommendations/basic", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          primaryWishTagId: flow.primaryWishTagId,
          secondaryWishTagId: flow.secondaryWishTagId,
          heartTagId: flow.heartTagId,
          freeText: flow.freeText,
        }),
      });

      if (res.status === 422) {
        setState("safety_blocked");
        track("safety_flag_triggered", { source: "recommendation_basic" });
        return;
      }

      if (!res.ok) {
        setState("error");
        return;
      }

      const body = await res.json();
      router.replace(`/result/${body.id}`);
    } catch {
      setState("error");
    }
  }, [router]);

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    void requestRecommendation();
  }, [requestRecommendation]);

  if (state === "safety_blocked") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <TrackSafetyView />
        <h1 className="text-xl font-semibold text-text-primary">
          지금 많이 힘드셨겠어요
        </h1>
        <p className="text-base text-text-secondary">
          지금 겪고 계신 어려움은 혼자 감당하지 않으셔도 돼요. 전문적인 도움을
          받아보시는 걸 권해드려요. 자살예방상담전화 109(24시간, 국번없이)로
          언제든 연결하실 수 있어요.
        </p>
        <PrimaryButton onClick={() => router.push("/")}>처음으로</PrimaryButton>
      </main>
    );
  }

  if (state === "error") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-base text-text-secondary">
          결과를 만드는 중 문제가 생겼어요.
        </p>
        <PrimaryButton onClick={() => void requestRecommendation()}>
          다시 시도
        </PrimaryButton>
      </main>
    );
  }

  return (
    <main
      className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center"
      role="status"
      aria-live="polite"
    >
      <div
        aria-hidden="true"
        className="flex h-16 w-16 items-center justify-center animate-pulse rounded-full bg-accent-primary/20 motion-reduce:animate-none"
      >
        <GemIcon className="h-8 w-8 text-accent-primary" />
      </div>
      <p className="text-base text-text-secondary">
        당신에게 맞는 원석을 찾고 있어요...
      </p>
    </main>
  );
}

function TrackSafetyView() {
  useEffect(() => {
    track("safety_guidance_view");
  }, []);
  return null;
}

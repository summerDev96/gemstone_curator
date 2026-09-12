"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics/track";
import { getOrCreateSessionToken } from "@/lib/client/session";
import { clearWishFlowState } from "@/lib/client/wishFlowStore";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

export function LandingCta() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setLoading(true);
    setError(null);
    track("landing_cta_click");
    try {
      await getOrCreateSessionToken();
      clearWishFlowState();
      router.push("/wish");
    } catch {
      setError("세션을 시작하지 못했어요. 잠시 후 다시 시도해주세요.");
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <PrimaryButton onClick={handleStart} disabled={loading}>
        {loading ? "시작하는 중..." : "지금 시작하기"}
      </PrimaryButton>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

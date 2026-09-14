"use client";

import { useEffect, useState } from "react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiFetch } from "@/lib/client/session";
import { track } from "@/lib/analytics/track";

export function ShareButton({
  recommendationId,
  scope,
  relationshipAnalysisId,
}: {
  recommendationId: string;
  scope: "basic" | "five-elements" | "relationship";
  relationshipAnalysisId?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (!toastVisible) return;
    const timer = setTimeout(() => setToastVisible(false), 2500);
    return () => clearTimeout(timer);
  }, [toastVisible]);

  async function handleShare() {
    track("share_button_click", { scope });
    setError(null);
    setFallbackUrl(null);
    setLoading(true);
    try {
      const res = await apiFetch(
        `/api/v1/recommendations/${recommendationId}/share-links`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ scope, relationshipAnalysisId }),
        },
      );
      if (!res.ok) throw new Error("failed");
      const body = await res.json();
      track("share_link_created", { scope });
      try {
        await navigator.clipboard.writeText(body.url);
        setToastVisible(true);
      } catch {
        setFallbackUrl(body.url);
      }
    } catch {
      setError("공유 링크를 만들지 못했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <PrimaryButton variant="secondary" onClick={handleShare} disabled={loading}>
        {loading ? "링크 만드는 중..." : "공유하기"}
      </PrimaryButton>
      {fallbackUrl && (
        <p className="text-xs text-text-secondary">{fallbackUrl}</p>
      )}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      {toastVisible && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
        >
          <div className="rounded-full bg-text-primary px-4 py-2 text-sm text-white shadow-lg">
            링크가 복사됐어요
          </div>
        </div>
      )}
    </div>
  );
}

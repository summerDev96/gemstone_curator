"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/client/session";
import { track } from "@/lib/analytics/track";

export function ShareButton({
  recommendationId,
  scope,
}: {
  recommendationId: string;
  scope: "basic" | "five-elements";
}) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    track("share_button_click", { scope });
    setError(null);
    try {
      const res = await apiFetch(
        `/api/v1/recommendations/${recommendationId}/share-links`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ scope }),
        },
      );
      if (!res.ok) throw new Error("failed");
      const body = await res.json();
      setShareUrl(body.url);
      track("share_link_created", { scope });
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(body.url);
        setCopied(true);
      }
    } catch {
      setError("공유 링크를 만들지 못했어요.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleShare}
        aria-label="결과 공유하기"
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border-subtle text-text-primary hover:bg-bg-surface"
      >
        ⤴
      </button>
      {shareUrl && (
        <p className="text-xs text-text-secondary">
          {copied ? "링크가 복사됐어요: " : ""}
          {shareUrl}
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

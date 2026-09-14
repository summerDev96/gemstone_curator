"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/client/session";
import { track } from "@/lib/analytics/track";

export function FeedbackRating({ recommendationId }: { recommendationId: string }) {
  const [rating, setRating] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(value: number) {
    setRating(value);
    setError(null);
    try {
      const res = await apiFetch(
        `/api/v1/recommendations/${recommendationId}/feedback`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ rating: value }),
        },
      );
      if (!res.ok && res.status !== 409) throw new Error("failed");
      setSubmitted(true);
      track("feedback_submitted", { rating: value });
    } catch {
      setError("제출하지 못했어요. 다시 시도해주세요.");
    }
  }

  return (
    <div>
      <p className="pb-2 text-sm font-medium text-text-primary">
        이 결과가 도움이 됐나요?
      </p>
      <div role="radiogroup" aria-label="만족도 1~5점" className="flex gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={`${value}점`}
            onClick={() => submit(value)}
            disabled={submitted}
            className={`flex min-h-[44px] min-w-[44px] items-center justify-center text-2xl disabled:cursor-not-allowed ${
              rating !== null && value <= rating
                ? "text-accent-primary"
                : "text-text-secondary"
            }`}
          >
            ★
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="pt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

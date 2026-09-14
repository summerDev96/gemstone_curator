"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics/track";
import type { AnalyticsEventName } from "@/lib/analytics/allowlist";

export function NavigableCtaCard({
  title,
  description,
  event,
  href,
  onBeforeNavigate,
}: {
  title: string;
  description: string;
  event: AnalyticsEventName;
  href: string;
  /**
   * 이동 전에 비동기 준비 작업이 필요한 경우(예: 추천 ID를 미리 만들어야 하는 경우)
   * 사용한다. 반환한 경로로 이동하며, 아무것도 반환하지 않으면 기본 href로 이동한다.
   * 실패(reject)하면 이동하지 않는다.
   */
  onBeforeNavigate?: () => Promise<string | void>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    track(event);
    if (!onBeforeNavigate) {
      router.push(href);
      return;
    }
    setLoading(true);
    try {
      const nextHref = await onBeforeNavigate();
      router.push(nextHref || href);
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-4 text-left transition-colors hover:border-accent-primary/50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <p className="font-medium text-text-primary">{loading ? "이동하는 중..." : title}</p>
      <p className="pt-1 text-sm text-text-secondary">{description}</p>
    </button>
  );
}

"use client";

import { useState } from "react";
import { track } from "@/lib/analytics/track";
import type { AnalyticsEventName } from "@/lib/analytics/allowlist";

interface Props {
  title: string;
  description: string;
  event: AnalyticsEventName;
}

/**
 * FR-BASIC-012: 오행/관계 기능 관심도 CTA 노출.
 * 실제 오행·관계 기능(Phase 2/3)은 아직 구현되지 않았으므로 클릭 시 관심도만 기록하고
 * 안내 문구를 보여준다 (Phase 범위 밖 기능으로 이동하지 않음).
 */
export function ExpansionCtaCard({ title, description, event }: Props) {
  const [clicked, setClicked] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        setClicked(true);
        track(event);
      }}
      className="w-full rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-4 text-left transition-colors hover:border-accent-primary/50"
    >
      <p className="font-medium text-text-primary">{title}</p>
      <p className="pt-1 text-sm text-text-secondary">
        {clicked ? "관심 가져주셔서 감사해요. 곧 만나볼 수 있어요." : description}
      </p>
    </button>
  );
}

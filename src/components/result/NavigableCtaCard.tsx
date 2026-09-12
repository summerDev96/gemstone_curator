"use client";

import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics/track";
import type { AnalyticsEventName } from "@/lib/analytics/allowlist";

export function NavigableCtaCard({
  title,
  description,
  event,
  href,
}: {
  title: string;
  description: string;
  event: AnalyticsEventName;
  href: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        track(event);
        router.push(href);
      }}
      className="w-full rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface p-4 text-left transition-colors hover:border-accent-primary/50"
    >
      <p className="font-medium text-text-primary">{title}</p>
      <p className="pt-1 text-sm text-text-secondary">{description}</p>
    </button>
  );
}

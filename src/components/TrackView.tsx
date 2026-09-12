"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/track";
import type { AnalyticsEventName, AnalyticsEventProps } from "@/lib/analytics/allowlist";

export function TrackView({
  event,
  props,
}: {
  event: AnalyticsEventName;
  props?: AnalyticsEventProps;
}) {
  useEffect(() => {
    track(event, props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);
  return null;
}

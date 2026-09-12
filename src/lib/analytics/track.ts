import {
  assertSafeAnalyticsProps,
  isAllowedAnalyticsEvent,
  type AnalyticsEventProps,
} from "./allowlist";

/**
 * 분석 이벤트 전송 스텁. 실제 분석 벤더 연동은 범위 밖이며(docs/13 미해결 항목),
 * 현재는 allowlist 검증 후 콘솔에만 기록한다.
 */
export function track(name: string, props: AnalyticsEventProps = {}): void {
  if (!isAllowedAnalyticsEvent(name)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[analytics] allowlist에 없는 이벤트 무시됨: ${name}`);
    }
    return;
  }
  assertSafeAnalyticsProps(props);
  if (process.env.NODE_ENV !== "production") {
    console.info(`[analytics] ${name}`, props);
  }
}

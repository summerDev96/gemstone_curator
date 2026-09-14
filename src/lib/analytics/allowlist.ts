/**
 * docs/12-privacy-security-compliance.md#분석-이벤트-allowlist
 * 이 목록에 없는 이벤트명은 전송을 거부한다. 값 필드는 boolean/문자열 ID/숫자만 허용하고
 * 자유 텍스트(원문)는 어떤 이벤트에도 포함하지 않는다.
 */
export const ANALYTICS_EVENT_ALLOWLIST = [
  "landing_view",
  "landing_desire_click",
  "landing_saju_click",
  "landing_relationship_click",
  "desire_view",
  "desire_selected",
  "desire_result_view",
  "wish_view",
  "wish_primary_selected",
  "wish_secondary_selected",
  "wish_next_click",
  "heart_view",
  "heart_selected",
  "free_text_provided",
  "heart_next_click",
  "recommendation_requested",
  "recommendation_generation_timeout",
  "recommendation_view",
  "feedback_submitted",
  "five_elements_cta_click",
  "five_elements_intro_view",
  "five_elements_consent_granted",
  "five_elements_consent_denied",
  "birth_info_view",
  "birth_info_submitted",
  "birth_time_unknown_selected",
  "five_elements_result_view",
  "relationship_cta_click",
  "relationship_intro_view",
  "relationship_form_view",
  "relationship_submitted",
  "relationship_result_view",
  "relationship_invite_click",
  "relationship_invite_created",
  "relationship_invite_view",
  "relationship_invite_submitted",
  "relationship_invite_completed",
  "share_button_click",
  "share_link_created",
  "share_link_viewed",
  "share_link_revoked",
  "save_cta_click",
  "library_view",
  "library_tab_switch",
  "data_deletion_requested",
  "data_deletion_completed",
  "safety_flag_triggered",
  "safety_guidance_view",
  "llm_generation_success",
  "llm_generation_fallback_used",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_ALLOWLIST)[number];

export type AnalyticsEventProps = Record<string, string | number | boolean>;

const FORBIDDEN_PROP_KEYS = [
  "birthDate",
  "birthTime",
  "freeText",
  "partnerNickname",
  "email",
  "sessionToken",
  "comment",
];

export function isAllowedAnalyticsEvent(
  name: string,
): name is AnalyticsEventName {
  return (ANALYTICS_EVENT_ALLOWLIST as readonly string[]).includes(name);
}

export function assertSafeAnalyticsProps(props: AnalyticsEventProps): void {
  for (const key of Object.keys(props)) {
    if (FORBIDDEN_PROP_KEYS.includes(key)) {
      throw new Error(`분석 이벤트에 금지된 필드가 포함되어 있습니다: ${key}`);
    }
  }
}

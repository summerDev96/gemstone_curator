# 03. 사용자 흐름 — 원석 큐레이터

- 문서 버전: 0.1.0
- 최종 수정일: 2026-09-11 (Asia/Seoul)
- 상태: Draft

화면 ID는 [04-screen-specifications.md](04-screen-specifications.md), API는 [07-api-specification.md](07-api-specification.md), 분석 이벤트 allowlist는 [12-privacy-security-compliance.md](12-privacy-security-compliance.md#분석-이벤트-allowlist)를 참조한다.

## 1. 비회원 기본 원석 추천

```mermaid
flowchart TD
    Start([진입: S01 랜딩]) --> A{세션 존재?}
    A -->|없음| B["POST /sessions 호출"]
    A -->|있음| C[S02 소원 선택]
    B --> C
    C --> D{주 소원 선택함?}
    D -->|아니오| C
    D -->|예| E[S03 마음 선택 + 자유입력 선택]
    E --> F[S04 추천 생성 요청]
    F --> G["POST /recommendations/basic"]
    G --> H{성공?}
    H -->|예| I[S05 기본 결과 표시]
    H -->|오류| J["오류 배너 + 재시도 CTA"]
    J --> F
    I --> End([완료: 결과 소비 가능])
```

- **진입 조건**: 신규 방문 또는 세션 만료 후 재방문.
- **정상 경로**: S01 → S02 → S03 → S04 → S05.
- **분기**: 주 소원 미선택 시 다음 단계 비활성화, 자유 입력은 선택 사항.
- **오류 경로**: `POST /recommendations/basic` 실패(네트워크 오류) 시 재시도 CTA 노출. LLM 실패는 오류가 아니라 fallback으로 처리되어 정상 경로로 간주(흐름 6 참조).
- **완료 조건**: S05에 `stone`, `heartSummary`, `rationale`, `comfortLines`, `microAction`이 모두 렌더링됨.
- **분석 이벤트**: `landing_view`, `wish_selected`, `heart_selected`, `recommendation_requested`, `recommendation_view`.

## 2. 기본 결과 이후 오행 분석

```mermaid
flowchart TD
    Start([진입: S05 기본 결과]) --> A["오행 CTA 클릭"]
    A --> B[S06 오행 안내·동의]
    B --> C{동의함?}
    C -->|아니오| D["S05로 복귀"]
    C -->|예| E[S07 출생정보 입력]
    E --> F{출생시간 앎?}
    F -->|모름| G["출생시간 미상 체크"]
    F -->|앎| H["생년월일시 입력"]
    G --> I["POST /recommendations/{id}/five-elements"]
    H --> I
    I --> J{검증 통과?}
    J -->|아니오| K["필드 오류 표시"]
    K --> E
    J -->|예| L[S08 오행 통합 결과]
    L --> End([완료])
```

- **진입 조건**: S05에서 오행 CTA 클릭.
- **정상 경로**: S05 → S06 → S07 → S08.
- **분기**: 출생시간 미상 시 시주 제외 분석(FR-FIVE-003). 동의 거부 시 S05로 복귀.
- **오류 경로**: 생년월일 형식 오류, 미래 날짜 등 입력 검증 실패 시 S07에서 필드 오류 표시.
- **완료 조건**: `FiveElementProfile`이 생성되고 `balanceJson`, `computedElement`, `integratedStone`이 S08에 렌더링됨.
- **분석 이벤트**: `five_elements_cta_click`, `five_elements_consent_granted`, `five_elements_consent_denied`, `birth_info_submitted`(값 자체는 미포함, 제출 여부만), `five_elements_result_view`.

## 3. 관계 원석 추천

```mermaid
flowchart TD
    Start([진입: S05 또는 S08]) --> A["관계 CTA 클릭"]
    A --> B[S09 관계 안내]
    B --> C[S10 상대방 정보 입력]
    C --> D{별명 입력함?}
    D -->|아니오| C
    D -->|예| E[S11 관계 소원 선택]
    E --> F["POST /recommendations/{id}/relationship"]
    F --> G{성공?}
    G -->|아니오| H["오류 표시 + 재시도"]
    H --> F
    G -->|예| I[S12 관계 원석 결과]
    I --> J{"초대 링크 생성?"}
    J -->|예| K["초대 링크 발급 및 공유"]
    J -->|아니오| End1([완료: 단방향 결과])
    K --> End2([완료: 초대 대기 상태])
```

- **진입 조건**: S05 또는 S08에서 관계 CTA 클릭.
- **정상 경로**: S09 → S10 → S11 → S12.
- **분기**: 상대방 출생정보는 선택 입력이며 미입력 시 상대의 원석은 별명 기반 최소 정보로만 산출되거나 생략된다(FR-REL-002/003). 초대 링크 생성 여부는 선택.
- **오류 경로**: 별명 미입력 시 다음 단계 비활성화. API 실패 시 재시도.
- **완료 조건**: `RelationshipAnalysis`가 생성되고 최소한 `myStone`, `weStone`이 S12에 렌더링됨.
- **분석 이벤트**: `relationship_cta_click`, `relationship_type_selected`, `relationship_wish_selected`, `relationship_result_view`, `invite_link_created`.

## 4. 결과 저장 및 로그인

```mermaid
flowchart TD
    Start([진입: S05/S08/S12 결과 화면]) --> A["보관함 저장 CTA 클릭"]
    A --> B{로그인 상태?}
    B -->|이미 로그인| C["결과가 자동으로 계정에 연결됨"]
    B -->|비회원| D["로그인/가입 화면 진입"]
    D --> E{가입 또는 로그인 성공?}
    E -->|아니오| F["비회원 세션 유지, 결과는 세션 범위로만 보존"]
    E -->|예| G["비회원 세션 데이터를 계정으로 승계"]
    C --> H[S14 보관함에서 조회 가능]
    G --> H
    F --> End([결과는 세션 만료 시 소멸])
    H --> End2([완료])
```

- **진입 조건**: 결과 화면에서 저장 CTA 클릭.
- **정상 경로**: 로그인 성공 → `AnonymousSession.convertedUserId` 연결 → 세션에 귀속된 `WishSession`/`Recommendation`이 사용자 소유로 전환.
- **분기**: 이미 로그인된 사용자는 즉시 저장.
- **오류 경로**: 가입/로그인 실패 시 비회원 세션 유지, 데이터는 세션 만료 정책에 따라 소멸(FR-BASIC-013 비회원 우선 원칙 유지).
- **완료 조건**: `GET /me/recommendations`에 해당 결과가 노출됨.
- **분석 이벤트**: `save_cta_click`, `signup_started`, `signup_completed`, `session_claimed`.

## 5. 결과 공유와 링크 만료

```mermaid
flowchart TD
    Start([진입: 결과 화면 공유 버튼]) --> A["POST /recommendations/{id}/share-links"]
    A --> B[S13 공유 미리보기 생성]
    B --> C["링크 복사/SNS 공유"]
    C --> D(["제3자가 링크 접근"])
    D --> E["GET /shares/{token}"]
    E --> F{"만료/철회됨?"}
    F -->|예| G["410 Gone: 만료 안내 화면"]
    F -->|아니오| H["S13 공유 카드 표시 (viewCount 증가)"]
    H --> End([완료])
    G --> End2([종료])
```

- **진입 조건**: 결과 화면에서 공유 버튼 클릭.
- **정상 경로**: 토큰 발급 → 공유 → 제3자 조회.
- **분기**: 소유자는 `DELETE /share-links/{token}`으로 언제든 철회 가능.
- **오류 경로**: 만료·철회된 토큰 접근 시 410 응답, S13은 만료 안내로 전환.
- **완료 조건**: 공유 payload에 개인정보 필드가 없음(원석, 요약 카피, 태그만 노출).
- **분석 이벤트**: `share_link_created`, `share_link_viewed`, `share_link_revoked`.

## 6. AI 실패 시 fallback

```mermaid
flowchart TD
    Start(["POST /recommendations/basic 처리 시작"]) --> A["규칙 엔진이 대표 원석 결정"]
    A --> B["LLM에 카피 생성 요청"]
    B --> C{"응답 성공 및 스키마 검증 통과?"}
    C -->|예| D["생성된 카피 사용 (usedFallback=false)"]
    C -->|타임아웃/오류/스키마 실패| E["재시도 1회"]
    E --> F{"재시도 성공?"}
    F -->|예| D
    F -->|아니오| G["검수된 fallback 문장 세트 적용 (usedFallback=true)"]
    D --> H[S05 결과 렌더링]
    G --> H
    H --> End([완료: 결과 화면은 항상 완성됨])
```

- **진입 조건**: 기본 추천 API 처리 중.
- **정상 경로**: LLM 성공 시 생성 카피 사용.
- **분기/오류 경로**: 실패 시 1회 재시도 후에도 실패하면 원석별로 검수된 fallback 문장([09-ai-prompts-and-safety.md](09-ai-prompts-and-safety.md#fallback-문장-템플릿)) 사용.
- **완료 조건**: 사용자에게는 항상 완성된 결과가 노출되며, `usedFallback` 플래그로 내부 관측만 구분한다(UI에 실패 여부를 노출하지 않음).
- **분석 이벤트**: `llm_generation_success`, `llm_generation_fallback_used`(개인정보 미포함, 원인 코드만 포함).

## 7. 위기 표현 감지와 안전 안내

```mermaid
flowchart TD
    Start(["S03 자유 입력 제출 또는 API 요청"]) --> A["규칙 기반 키워드 감지"]
    A --> B["LLM 안전 분류 프롬프트 실행"]
    B --> C{"위기 신호 감지?"}
    C -->|아니오| D["일반 추천 흐름 계속"]
    C -->|예| E["일반 원석 추천 대신 안전 안내 화면 표시"]
    E --> F["상담 지원 정보 안내 (일반 위로 문구만 제공)"]
    F --> End1([종료: 사용자가 계속 진행할지 선택])
    D --> End2([완료: 흐름 1로 계속])
```

- **진입 조건**: S03 자유 입력 제출 시 또는 추천 생성 API 처리 시.
- **정상 경로**: 위기 신호 없음 → 일반 흐름 계속.
- **분기**: 규칙 기반 키워드 매칭과 LLM 안전 분류가 이중으로 동작하며 둘 중 하나라도 위기로 판단하면 안전 경로로 라우팅한다.
- **오류 경로**: 안전 분류 자체가 실패(타임아웃 등)하면 보수적으로 규칙 기반 키워드 결과만으로 판단하며, 규칙 기반도 실패 시 안전 경로를 우선한다(fail-safe).
- **완료 조건**: 위기 신호 감지 시 원석 추천을 생성하지 않고 안전 안내만 제공한다(AI 금지행위, [09-ai-prompts-and-safety.md](09-ai-prompts-and-safety.md) 참조).
- **분석 이벤트**: `safety_flag_triggered`(원문 미포함, 트리거 유형 코드만), `safety_guidance_view`.

## 8. 개인정보 동의 철회 및 삭제

```mermaid
flowchart TD
    Start([진입: S14 개인정보 설정]) --> A["동의 항목 목록 조회"]
    A --> B{"철회할 동의 선택"}
    B --> C["동의 철회 처리"]
    C --> D{"철회 대상에 연동된 기능 있음?"}
    D -->|예: 오행 분석| E["FiveElementProfile 접근 제한 처리"]
    D -->|아니오| F["동의 상태만 업데이트"]
    E --> G["상태 갱신 완료"]
    F --> G
    A --> H["전체 데이터 삭제 요청"]
    H --> I["DELETE /me/data 확인 모달"]
    I --> J{"최종 확인?"}
    J -->|아니오| A
    J -->|예| K["계정 및 연관 데이터 cascade 삭제"]
    K --> L["활성 공유 링크 즉시 무효화"]
    L --> End([완료: 로그아웃 및 삭제 완료 안내])
```

- **진입 조건**: 로그인한 회원이 S14 진입.
- **정상 경로**: 개별 동의 철회 또는 전체 데이터 삭제.
- **분기**: 오행 동의 철회 시 `FiveElementProfile` 접근을 제한하되, [12-privacy-security-compliance.md](12-privacy-security-compliance.md#보유·파기-정책)에 정의된 보유기간 내 삭제 처리. 전체 삭제는 되돌릴 수 없음을 확인 모달에서 고지.
- **오류 경로**: 삭제 처리 중 실패 시 재시도 안내, 부분 실패 없이 트랜잭션 단위로 처리.
- **완료 조건**: 삭제 후 `GET /me/recommendations`, `GET /shares/{token}`(해당 사용자 소유 링크) 모두 접근 불가.
- **분석 이벤트**: `consent_revoked`, `data_deletion_requested`, `data_deletion_completed`.

## Assumptions

- 흐름 4(저장/로그인)의 가입 방식은 이메일/소셜 여부를 특정하지 않고 중립적으로 표현했다.
- 흐름 7의 규칙 기반 키워드 목록 자체는 [09-ai-prompts-and-safety.md](09-ai-prompts-and-safety.md)에서 관리하며 본 문서는 라우팅 로직만 다룬다.

## 추가 검증 필요

- 위기 표현 감지 이중 안전망의 실제 정확도(한국어 기준)는 [13-decisions-and-open-questions.md](13-decisions-and-open-questions.md)의 미해결 항목 참조.

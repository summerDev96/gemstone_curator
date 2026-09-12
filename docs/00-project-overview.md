# 00. 프로젝트 개요 — 원석 큐레이터 (Gemstone Curator)

- 문서 버전: 0.1.0
- 최종 수정일: 2026-09-11 (Asia/Seoul)
- 상태: Draft

## 한 문장 정의

원석 큐레이터는 사용자가 지금 바라는 변화와 마음 상태를 입력하면 규칙 기반 엔진이 상징적 원석 하나를 정해주고, AI가 그 원석에 대한 위로와 작은 행동을 제안하는 모바일 우선 자기성찰 웹앱이다.

- 한글 서비스명: 원석 큐레이터
- 영문 서비스명: Gemstone Curator (저장소 디렉터리명 `gemstonecurator`와 일치시킨 표기. `추가 검증 필요`: 사용자/브랜드팀의 영문 표기 최종 확인)
- 설명: AI 원석 큐레이터
- 태그라인: "당신의 바람과 기운, 인연을 잇는 원석"

## 문제와 해결 방식

**문제**: 사용자는 자신이 지금 바라는 변화나 마음 상태를 스스로 정리하기 어렵고, 짧고 감성적인 자기성찰 콘텐츠를 원하지만 기존 사주·타로 서비스는 진입장벽(생년월일시 필수 입력, 회원가입, 긴 텍스트)이 높다.

**해결 방식**: 소원과 마음을 고르는 짧은 선택형 흐름만으로 비회원도 즉시 대표 원석 하나를 추천받는다. 원석 선정은 [규칙 기반 추천 엔진](08-recommendation-engine.md)이 결정론적으로 수행하고, AI는 [검수된 원석 정보 안에서만](09-ai-prompts-and-safety.md) 설명·위로 문장을 생성한다. 오행 분석과 관계 궁합은 기본 결과를 받은 이후 선택적으로 확장되는 기능이다.

## 주요 사용자

- 연령: 20~39세
- 관심사: 원석, 옥, 사주, 오행, 운세형 콘텐츠
- 행동 패턴: 모바일 중심, 짧고 감성적인 콘텐츠 소비, 결과를 저장하거나 SNS·메신저로 공유
- 상세 페르소나는 [01-prd.md](01-prd.md#persona)를 참조한다.

## 핵심 가치 제안

1. 회원가입이나 민감정보 입력 없이 30초 내로 첫 추천을 받을 수 있다.
2. 원석 선정은 항상 결정론적 규칙에 근거하므로 같은 입력에는 같은 원석이 나온다 (재현성).
3. 오행·관계 궁합은 강요되지 않는 선택적 심화 경로로, 사용자가 원할 때만 개인정보를 추가로 제공한다.
4. 모든 콘텐츠는 문화적·상징적 자기성찰로 표현되며 의학적·운명론적 단정을 하지 않는다 ([09-ai-prompts-and-safety.md](09-ai-prompts-and-safety.md) 금지행위 참조).

## Phase 범위

| Phase | 핵심 산출물 | 상세 |
|---|---|---|
| Phase 1 (MVP) | 비회원 기본 소원→원석 추천 전체 흐름, 안전장치, fallback | [01-prd.md](01-prd.md#phase-1-범위) |
| Phase 2 | 오행 분석, 회원가입, 보관함, 공유 링크, 개인정보 동의관리 | [01-prd.md](01-prd.md#phase-2-범위) |
| Phase 3 | 관계 원석 궁합, 초대 링크, 커머스/수호캐릭터 확장 후보 | [01-prd.md](01-prd.md#phase-3-범위) |

## 명시적 비범위 (모든 Phase 공통)

- 실시간 채팅형 상담 UX (1회성 결과 화면 중심)
- 결제·전자상거래 기능의 실제 구현 (Phase 3에서 "확장 후보"로만 문서화, 구현은 범위 밖)
- 의료, 심리 상담, 운세 예언, 궁합 성사 여부의 확정적 판정 — [12-privacy-security-compliance.md](12-privacy-security-compliance.md) 및 [09-ai-prompts-and-safety.md](09-ai-prompts-and-safety.md) 금지행위 참조
- 네이티브 모바일 앱 (모바일 웹 우선, PWA 여부는 `추가 검증 필요`)
- 다국어 지원 (한국어 우선, 영어 등 확장은 범위 밖)

## 전체 문서 탐색

| 문서 | 목적 |
|---|---|
| [01-prd.md](01-prd.md) | 제품 요구사항, 요구사항 ID, 성공 지표 |
| [02-information-architecture.md](02-information-architecture.md) | 사이트맵, URL 구조, 접근 권한 |
| [03-user-flows.md](03-user-flows.md) | 핵심 사용자 흐름 Mermaid 다이어그램 |
| [04-screen-specifications.md](04-screen-specifications.md) | S01~S14 화면별 상세 명세 |
| [05-design-system.md](05-design-system.md) | 디자인 토큰, 컴포넌트, 접근성 기준 |
| [06-database-schema.md](06-database-schema.md) | ERD, Prisma 스키마, DDL |
| [07-api-specification.md](07-api-specification.md) | REST API 명세 |
| [08-recommendation-engine.md](08-recommendation-engine.md) | 규칙 기반 추천 엔진 설계 |
| [09-ai-prompts-and-safety.md](09-ai-prompts-and-safety.md) | LLM 프롬프트, 안전 규칙 |
| [10-testing-and-acceptance.md](10-testing-and-acceptance.md) | 테스트 전략, 수용 기준 |
| [11-implementation-roadmap.md](11-implementation-roadmap.md) | 구현 순서, 작업 단위 |
| [12-privacy-security-compliance.md](12-privacy-security-compliance.md) | 개인정보·보안·컴플라이언스 |
| [13-decisions-and-open-questions.md](13-decisions-and-open-questions.md) | 확정 결정, 미해결 질문, ADR 후보 |
| [../README.md](../README.md) | 저장소 개요, 로컬 개발 예정 절차 |
| [../AGENTS.md](../AGENTS.md) | 코딩 에이전트 작업 규칙 |

## 빠른 개발 시작 순서

Phase 1 구현 착수 순서는 [11-implementation-roadmap.md](11-implementation-roadmap.md#phase-1-순서)에서 9단계로 정의한다. 요약하면 다음 순서를 따른다.

1. 프로젝트 기반/디자인 토큰 → 2. 원석 지식 모델/seed → 3. 비회원 세션/개인정보 안전 기반 → 4. 소원·감정 입력 UI → 5. 결정론적 추천 엔진 → 6. 안전 라우팅 → 7. LLM 카피 생성/fallback → 8. 기본 추천 API/결과 UI → 9. 분석·관측·CI.

Phase 1 완료 전에는 Phase 2, Phase 3 구현에 착수하지 않는다.

## Assumptions

- 저장소에 `OHGYEOL_PRODUCT_DEVELOPMENT_SPEC.md`가 존재하지 않으므로, 본 문서 세트 작성을 요청한 프롬프트 자체를 제품 요구사항의 최우선 기준으로 삼았다.
- 서비스명은 사용자 지시에 따라 "원석 큐레이터 / Gemstone Curator"로 확정했다 (`docs/13-decisions-and-open-questions.md` 결정 이력 참조).
- 저장소는 현재 `create-next-app` 기본 스캐폴드 상태이며, 실제 도메인 코드(Prisma, API 라우트 등)는 아직 없다. 본 문서 세트는 Phase 1 구현 착수 전 설계 산출물이다.

## 추가 검증 필요

- 영문 서비스명 "Gemstone Curator" 최종 확정 여부
- PWA 지원 여부 및 네이티브 앱 전환 로드맵
- 정식 도메인/브랜드 가이드라인

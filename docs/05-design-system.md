# 05. 디자인 시스템 — 원석 큐레이터

- 문서 버전: 0.1.0
- 최종 수정일: 2026-09-11 (Asia/Seoul)
- 상태: Draft

화면별 적용 예시는 [04-screen-specifications.md](04-screen-specifications.md)를 참조한다. 실제 구현 시 Tailwind CSS 토큰으로 매핑하며, 정확한 설정값은 `추가 검증 필요`(Tailwind 설정 파일은 구현 단계에서 확정).

## 브랜드 톤

- **신비롭지만 미신을 강요하지 않는다**: 별자리·오행 상징은 은유적 장식으로 사용하고, 문구는 항상 "~일 수 있어요", "~로 여겨져요"처럼 단정을 피한다.
- **따뜻하지만 과도하게 감상적이지 않는다**: 위로 문장은 짧고 담백하게, 과장된 감탄사·이모지 남용을 피한다.
- **전통 오행 색을 현대적이고 절제되게 사용한다**: 오행 5색은 저채도 톤으로 재해석해 사용하고, 원색 그대로 배경 전체에 사용하지 않는다.

## 색상 토큰

### 시맨틱 토큰 (Light 기준)

| 토큰 | 값(예시, HEX) | 용도 |
|---|---|---|
| `color-bg-base` | `#FBF9F6` | 기본 배경 |
| `color-bg-surface` | `#FFFFFF` | 카드/시트 표면 |
| `color-text-primary` | `#211D1A` | 본문 텍스트 |
| `color-text-secondary` | `#6B6259` | 보조 텍스트 |
| `color-border-subtle` | `#E7E1D8` | 구분선, 카드 테두리 |
| `color-accent-primary` | `#7A5CFA` | Primary CTA, 강조 |
| `color-accent-primary-hover` | `#6647E0` | Primary CTA 호버/눌림 |
| `color-success` | `#3E8E5A` | 성공 상태 |
| `color-warning` | `#B8842E` | 경고, 안전 안내 |
| `color-danger` | `#C1443C` | 오류, 삭제 위험 동작 |

### 오행 상징 색 (절제된 팔레트, 장식·차트 전용)

| 오행 | 토큰 | 값(예시, HEX) | 비고 |
|---|---|---|---|
| 목(木) | `color-element-wood` | `#5B8C5A` | 저채도 그린 |
| 화(火) | `color-element-fire` | `#C0604A` | 저채도 레드-오렌지 |
| 토(土) | `color-element-earth` | `#B08D4F` | 저채도 옐로우-브라운 |
| 금(金) | `color-element-metal` | `#9C9284` | 저채도 그레이-골드 |
| 수(水) | `color-element-water` | `#4A7A8C` | 저채도 블루 |

Dark 모드 토큰 값은 `추가 검증 필요`(다크 모드 지원 여부 자체가 Phase 1 범위 밖일 수 있음, [13-decisions-and-open-questions.md](13-decisions-and-open-questions.md) 참조).

## Typography

| 토큰 | 용도 | 크기(예시) | 최소 기준 |
|---|---|---|---|
| `font-display` | 히어로 타이틀, 결과 원석 이름 | 24~28px | - |
| `font-heading` | 섹션 제목(H2 수준) | 18~20px | - |
| `font-body` | 본문 | 16px | 본문 최소 16px 권장 준수 |
| `font-caption` | 보조 설명, 카운터 | 13~14px | 장식적 용도로만 사용, 핵심 정보에는 미사용 |

폰트 패밀리는 시스템 폰트 우선(`추가 검증 필요`: 커스텀 웹폰트 도입 여부).

## Spacing

8px 기반 스케일 사용: `space-1`(4px), `space-2`(8px), `space-3`(12px), `space-4`(16px), `space-6`(24px), `space-8`(32px), `space-12`(48px). 화면 좌우 여백은 최소 `space-4`(16px) 이상 확보.

## Radius

| 토큰 | 값 | 용도 |
|---|---|---|
| `radius-sm` | 8px | 입력 필드, 태그칩 |
| `radius-md` | 16px | 카드 |
| `radius-lg` | 24px | Bottom Sheet, Modal 상단 |
| `radius-full` | 999px | 원형 버튼, 별점 아이콘 |

## Shadow

| 토큰 | 용도 |
|---|---|
| `shadow-card` | 기본 카드 부양감 (낮은 강도) |
| `shadow-sheet` | Bottom Sheet/Modal 상승 강조 |
| `shadow-none` | 기본 배경 요소(과도한 그림자 지양) |

## Breakpoints

| 토큰 | 값 | 대응 |
|---|---|---|
| `bp-min` | 320px | 최소 지원 너비 |
| `bp-base` | 390px | 기본 모바일 기준 |
| `bp-tablet` | 768px | 태블릿 |
| `bp-desktop` | 1440px | 데스크톱(콘텐츠 중앙 정렬 + 최대 폭 제한, 모바일 레이아웃 확대 지양) |

## Motion

- 기본 전환: 150~250ms, ease-out.
- 로딩 애니메이션(S04): 최대 반복 모션이되 `prefers-reduced-motion: reduce` 감지 시 정적 아이콘 + 텍스트로 대체.
- 페이지 전환: 슬라이드 인/아웃은 선형 흐름(S02~S04)에서만 사용, 결과 화면 진입은 페이드 사용.

## Icon 정책

- 라인 아이콘 스타일 통일(`추가 검증 필요`: 구체 아이콘 세트 라이선스 확정), 채움 아이콘은 선택 상태 표시 등 상태 강조 용도로만 제한적으로 사용.
- 모든 기능적 아이콘(뒤로가기, 공유, 삭제 등)은 텍스트 라벨 또는 `aria-label`을 동반한다.

## 컴포넌트 스펙

### 원석 카드 (`StoneCard`)

- 이미지(1:1 또는 4:5 비율) + 원석 이름(한글/영문 병기) + 선택적 색상 스와치.
- 상태: `default`, `loading`(스켈레톤), `error`(이미지 로드 실패 시 색상 스와치 + 이름만 표시).

### 소원 선택 카드 (`WishTagChip`)

- 단일 선택 칩, 선택 시 배경(`color-accent-primary`의 저채도 톤) + 테두리 강조 + 체크 아이콘.
- 최소 터치 영역 44×44px, 텍스트 최소 16px.

### CTA (`PrimaryCtaButton` / `SecondaryCtaButton`)

- Primary: 배경 `color-accent-primary`, 높이 최소 48px, 전체 너비 기본.
- Secondary: 텍스트 버튼 또는 아웃라인 버튼, 동일 높이 기준 유지.
- 비활성 상태: 배경 저채도 + `aria-disabled="true"`, 커서 변경.

### Form Controls

- 텍스트 입력/텍스트에어리어: 높이 최소 48px(단일 라인), `radius-sm`, 포커스 시 `color-accent-primary` 2px 아웃라인.
- 라디오/체크박스: 네이티브 접근성 유지, 커스텀 스타일은 시각적 표현만 대체하고 `input` 요소 자체는 유지(스크린리더 호환).

### Bottom Sheet

- 하단에서 슬라이드업, `radius-lg` 상단 모서리, 배경 딤 처리, 포커스 트랩 적용, `Esc`/딤 영역 클릭으로 닫기.
- 사용처(예): 공유 옵션 선택, 관계 유형 선택 확장 옵션(`추가 검증 필요`: 최종 적용 화면 목록).

### Modal

- 중앙 정렬, 최대 너비 400px(모바일에서는 좌우 여백 유지한 풀블리드), 포커스 트랩, 닫기 버튼 44×44px 이상.
- 사용처: 삭제 확인(S14), 로딩 중 이탈 확인(S04).

### Toast

- 화면 하단 고정, 3~5초 자동 소멸, 중요 액션 실패(예: 만족도 제출 실패)에는 사용하지 않고 인라인 오류를 우선한다(토스트만으로는 스크린리더 사용자가 놓칠 수 있음).

### Skeleton

- 카드형 스켈레톤은 실제 콘텐츠와 동일한 레이아웃 비율 유지, 애니메이션은 `prefers-reduced-motion` 시 정적 회색 블록으로 대체.

### Empty State

- 아이콘/일러스트 + 짧은 설명 문구 + 행동 유도 CTA(예: S14 보관함 비어있을 때 "아직 저장된 결과가 없어요" + "지금 시작하기").

### Error State

- 인라인 오류: 필드 하단 빨간 텍스트 + `aria-invalid`.
- 전체 화면 오류(404, 410 등): 아이콘 + 설명 + 복귀 CTA.

## WCAG 2.2 AA 체크리스트

- [ ] 모든 텍스트-배경 대비 4.5:1 이상(큰 텍스트는 3:1 이상)
- [ ] 모든 인터랙티브 요소 최소 44×44px 터치 영역
- [ ] 모든 기능이 키보드만으로 조작 가능(`Tab`/`Shift+Tab`/`Enter`/`Space`/화살표)
- [ ] 포커스 인디케이터가 항상 시각적으로 보임(커스텀 포커스 스타일 제거 금지)
- [ ] 색상만으로 정보를 전달하지 않음(아이콘/텍스트 병行)
- [ ] 폼 오류는 `aria-invalid` + `aria-describedby`로 프로그래밍적으로 연결
- [ ] 동적 콘텐츠 변경(로딩 완료, 오류 등)은 `aria-live` 영역으로 안내
- [ ] 이미지에 적절한 `alt`(정보성) 또는 `alt=""`(장식용) 제공
- [ ] 모달/시트는 포커스 트랩 및 `Esc` 닫기 지원
- [ ] 페이지 제목과 랜드마크(`main`, `nav`, `header`)가 명확히 구성됨

## `prefers-reduced-motion` 대응

- 모든 애니메이션(로딩 모션, 페이지 전환, 카드 등장 효과)은 `@media (prefers-reduced-motion: reduce)` 규칙에서 0~짧은 지속시간의 대체 상태로 전환한다.
- S04 로딩 애니메이션은 이 설정 시 정적 아이콘 + `aria-live` 텍스트만으로 진행 상태를 전달한다.

## Assumptions

- 색상 토큰 값은 브랜드 가이드가 없어 초기 제안값이며 디자이너 검수가 필요하다.
- 다크 모드는 Phase 범위에 명시되지 않아 토큰 구조만 예약하고 실제 값은 정의하지 않았다.

## 추가 검증 필요

- 최종 색상 팔레트 및 브랜드 가이드
- 아이콘 세트 라이선스
- 커스텀 웹폰트 도입 여부
- 다크 모드 지원 여부

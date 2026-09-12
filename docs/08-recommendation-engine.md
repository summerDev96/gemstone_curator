# 08. 추천 엔진 — 원석 큐레이터

- 문서 버전: 0.1.0
- 최종 수정일: 2026-09-11 (Asia/Seoul)
- 상태: Draft

DB 모델은 [06-database-schema.md](06-database-schema.md), API 응답 형태는 [07-api-specification.md](07-api-specification.md), LLM 역할은 [09-ai-prompts-and-safety.md](09-ai-prompts-and-safety.md)를 참조한다.

## LLM과 규칙 엔진의 역할 분리

| 구분 | 규칙 기반 엔진 | LLM |
|---|---|---|
| 원석 선택 | **전담**. 결정론적 점수 계산으로 단일 원석을 확정한다 | 관여하지 않는다(원석 재선택/변경 금지) |
| 설명·위로 생성 | 관여하지 않는다 | **전담**. 확정된 원석과 검수된 원석 정보만 근거로 카피를 생성한다 |
| 실패 시 동작 | 항상 결정론적으로 성공(외부 의존성 없음) | 실패 시 검수된 fallback 문장으로 대체 |

이 분리는 제품 구조 원칙("LLM은 원석을 임의로 선택하거나 변경할 수 없다")의 기술적 구현이다.

## 입력 신호

| 신호 | 소스 | 사용 컨텍스트 |
|---|---|---|
| 주 소원 (`primaryWishTagId`) | S02 | 기본, 오행, 관계 |
| 보조 소원 (`secondaryWishTagId`, 선택) | S02 | 기본, 오행, 관계 |
| 감정 (`heartTagId`) | S03 | 기본, 오행, 관계 |
| 오행 보완 필요 원소 (`neededElement`) | S07 계산 결과 | 오행 |
| 관계 목표 (`relationshipGoalTagId`) | S11 | 관계 |
| 관계 유형 (`relationshipType`) | S10 | 관계 |
| 최근 추천 원석 이력 (`recentStoneIds`) | 서버 조회(동일 세션/계정의 최근 N=3건) | 전체(반복 패널티) |

자유 입력(`freeText`)은 원석 선택 신호로 사용하지 않는다. LLM 카피 생성에만 사용되며 엔진 점수 계산에는 관여하지 않는다(결정론 보장을 위해 비정형 텍스트를 점수화 입력에서 제외).

## 원석 지식 모델

`Stone`과 `StoneTag`([06-database-schema.md](06-database-schema.md#stonetag))로 표현한다. 각 원석은 다수의 태그(소원/감정/관계목표)에 대해 0.0~1.0의 친화도(`weight`)를 가지며, 매핑이 없는 조합은 친화도 0으로 간주한다. `Stone.element`는 오행 컨텍스트에서 원소 일치 판정에 사용된다.

오행 상생 관계(목생화, 화생토, 토생금, 금생수, 수생목)를 활용한 부분 친화도 판정은 `추가 검증 필요`(전문가 검수 전까지는 단순 일치/불일치만 사용, 아래 점수식 참조).

## 점수식

컨텍스트 `c ∈ {basic, five-elements, relationship}`에 대해 원석 `s`의 점수는 다음과 같다.

```
score(s, c) = Σ_i weight[c][i] * affinity(s, signal_i) * repeatPenalty(s) + diversityBonus(s)
```

- `affinity(s, signal_i)`: 태그 신호는 `StoneTag.weight`, 오행 신호는 아래 "오행 보완" 절 참조.
- `repeatPenalty(s)`: 최근 `recentStoneIds`에 `s`가 포함된 횟수에 따른 감쇠(아래 절 참조).
- `diversityBonus(s)`: 전역 추천 빈도 기반 소폭 보정(아래 절 참조).

### 오행 보완 친화도

```
affinity(s, neededElement) =
  1.0   if s.element == neededElement
  0.5   if s.element generates neededElement (오행 상생, 추가 검증 필요)
  0.0   otherwise (s.element가 null인 경우 포함)
```

## 신호별 가중치 (초기 휴리스틱, `추가 검증 필요`)

| 신호 | 기본(basic) | 오행(five-elements) | 관계(relationship) |
| --- | ---: | ---: | ---: |
| 주 소원 | 0.50 | 0.35 | 0.20 |
| 보조 소원 | 0.15 | 0.10 | 0.05 |
| 감정 | 0.35 | 0.20 | 0.15 |
| 오행 보완 | 0 | 0.35 | 0.20 |
| 관계 목표 | 0 | 0 | 0.30 |
| 관계 유형 | 0 | 0 | 0.10 |

각 컨텍스트별 가중치 합은 1.0이다. 이 값은 검증된 사용자 데이터 없이 설정된 초기 휴리스틱이며 모든 값이 `추가 검증 필요` 대상이다([추천 가중치 실험 계획](#추천-가중치-실험-계획) 참조).

## 누락 신호 재정규화

보조 소원처럼 선택적 신호가 누락된 경우, 해당 가중치를 나머지 존재하는 신호들에 비례 배분해 컨텍스트별 가중치 합이 항상 1.0이 되도록 재정규화한다.

```
presentSignals = { i | signal_i가 존재함 }
missingWeight = Σ_{i ∉ presentSignals} weight[c][i]
for i in presentSignals:
  normalizedWeight[c][i] = weight[c][i] + missingWeight * (weight[c][i] / Σ_{j ∈ presentSignals} weight[c][j])
```

예: 기본 컨텍스트에서 보조 소원이 없으면 0.15를 주 소원(0.50)과 감정(0.35)에 비례 배분하여 주 소원 ≈0.588, 감정 ≈0.412가 된다.

## 동점 해결

1순위 최고 점수 원석이 복수인 경우, 다음 순서로 결정론적으로 하나를 확정한다.

1. `repeatPenalty` 적용 전 원점수가 더 높은 원석 우선(패널티로 인한 동점 방지)
2. 그래도 동점이면 `Stone.slug`의 사전식(lexicographic) 오름차순으로 가장 앞선 원석 선택

난수(`Math.random` 등)는 사용하지 않는다(결정론 보장 원칙).

## 반복 추천 패널티

동일 세션/계정의 최근 `N=3`건(`추가 검증 필요`: N값) 추천에 이미 등장한 원석은 다음 감쇠를 적용한다.

```
repeatPenalty(s) =
  1.0    if s가 최근 N건에 없음
  0.85   if s가 최근 N건 중 1회 등장
  0.7    if s가 최근 N건 중 2회 이상 등장
```

완전 배제가 아닌 감쇠 방식을 택해, 실제로 그 원석이 압도적으로 적합한 경우에는 반복 추천도 허용한다.

## 다양성 보너스

전역 추천 분포가 특정 원석에 과도하게 쏠리는 것을 완화하기 위한 소폭 보정이다.

```
diversityBonus(s) = 0.05 * (1 - normalizedGlobalFrequency(s))
```

`normalizedGlobalFrequency(s)`는 최근 30일간 전체 추천 중 `s`가 차지한 비율(0~1)이다. 가중치(0.05)는 초기 실험값이며 `추가 검증 필요`.

## Ruleset 버전 관리

- `Recommendation.rulesetVersion`에 시맨틱 버전 문자열(예: `"2026.09.0"`)을 기록한다.
- 가중치 표, 점수식, 패널티/보너스 로직 중 하나라도 변경되면 버전을 올린다.
- 과거 추천 결과는 생성 당시의 `rulesetVersion`을 그대로 유지하며 소급 재계산하지 않는다(재현성 보장).

## 추천 근거 추적

각 추천 요청은 내부 관측용으로 `scoreBreakdown`(신호별 기여도)과 상위 후보 목록(`candidates`)을 로깅한다(개인정보 미포함, 태그/원석 ID만 포함). 이는 오프라인 평가와 이상 탐지에 사용되며 공개 API 응답에는 노출하지 않는다([07-api-specification.md](07-api-specification.md#post-recommendationsbasic) 참조).

## TypeScript 인터페이스

```ts
type FiveElement = "WOOD" | "FIRE" | "EARTH" | "METAL" | "WATER";
type RelationshipType = "FAMILY" | "FRIEND" | "ROMANTIC" | "COLLEAGUE" | "OTHER";
type EngineContext = "basic" | "five-elements" | "relationship";

interface WishSignal {
  primaryWishTagId: string;
  secondaryWishTagId?: string;
  heartTagId: string;
}

interface FiveElementSignal {
  neededElement: FiveElement;
}

interface RelationshipSignal {
  relationshipGoalTagId: string;
  relationshipType: RelationshipType;
}

interface RecommendationEngineInput {
  context: EngineContext;
  wish: WishSignal;
  fiveElement?: FiveElementSignal; // context === "five-elements"일 때 필수
  relationship?: RelationshipSignal; // context === "relationship"일 때 필수
  recentStoneIds: string[];
}

interface StoneCandidateScore {
  stoneId: string;
  rawScore: number;
  finalScore: number; // repeatPenalty, diversityBonus 적용 후
  breakdown: Record<string, number>;
}

interface RecommendationEngineResult {
  stoneId: string;
  rulesetVersion: string;
  finalScore: number;
  breakdown: Record<string, number>;
  candidates: StoneCandidateScore[]; // 점수 내림차순, 상위 10개
}
```

## 의사코드

```ts
function recommend(input: RecommendationEngineInput, stones: Stone[], stoneTags: StoneTag[]): RecommendationEngineResult {
  const weights = normalizeWeights(WEIGHT_TABLE[input.context], input);
  const globalFrequency = loadGlobalFrequency(); // 최근 30일 집계, 캐시됨

  const scored: StoneCandidateScore[] = stones.map((stone) => {
    const breakdown: Record<string, number> = {};
    let rawScore = 0;

    if (weights.primaryWish) {
      breakdown.primaryWish = weights.primaryWish * affinity(stone, input.wish.primaryWishTagId, stoneTags);
      rawScore += breakdown.primaryWish;
    }
    if (weights.secondaryWish && input.wish.secondaryWishTagId) {
      breakdown.secondaryWish = weights.secondaryWish * affinity(stone, input.wish.secondaryWishTagId, stoneTags);
      rawScore += breakdown.secondaryWish;
    }
    if (weights.heart) {
      breakdown.heart = weights.heart * affinity(stone, input.wish.heartTagId, stoneTags);
      rawScore += breakdown.heart;
    }
    if (weights.fiveElement && input.fiveElement) {
      breakdown.fiveElement = weights.fiveElement * elementAffinity(stone, input.fiveElement.neededElement);
      rawScore += breakdown.fiveElement;
    }
    if (weights.relationshipGoal && input.relationship) {
      breakdown.relationshipGoal = weights.relationshipGoal * affinity(stone, input.relationship.relationshipGoalTagId, stoneTags);
      rawScore += breakdown.relationshipGoal;
    }
    if (weights.relationshipType && input.relationship) {
      breakdown.relationshipType = weights.relationshipType * typeAffinity(stone, input.relationship.relationshipType);
      rawScore += breakdown.relationshipType;
    }

    const penalty = repeatPenalty(stone.id, input.recentStoneIds);
    const bonus = diversityBonus(stone.id, globalFrequency);
    const finalScore = rawScore * penalty + bonus;

    return { stoneId: stone.id, rawScore, finalScore, breakdown };
  });

  scored.sort((a, b) => {
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    if (b.rawScore !== a.rawScore) return b.rawScore - a.rawScore;
    return stoneSlugOf(a.stoneId).localeCompare(stoneSlugOf(b.stoneId));
  });

  const winner = scored[0];
  return {
    stoneId: winner.stoneId,
    rulesetVersion: CURRENT_RULESET_VERSION,
    finalScore: winner.finalScore,
    breakdown: winner.breakdown,
    candidates: scored.slice(0, 10),
  };
}
```

## 결정론 보장

- 난수 미사용, 시간 의존적 로직 미사용(전역 빈도는 사전 집계된 스냅샷을 입력으로 주입).
- 동일한 `RecommendationEngineInput` + 동일한 `stones`/`stoneTags` 스냅샷 + 동일한 `rulesetVersion`이면 항상 동일한 `stoneId`를 반환한다.
- 부동소수점 비교는 정렬 기준에서만 사용하며 결과 선택(동점 처리)은 정수/문자열 비교로 확정한다.

## 성능 요구사항

- 순수 연산(정렬·점수 계산)은 원석 수 O(100) 기준 100ms 미만을 목표로 한다(NFR-PERF-003).
- 원석/태그 데이터는 요청마다 DB 전체 조회하지 않고 인메모리 캐시(주기적 갱신, `추가 검증 필요`: 캐시 무효화 전략)를 사용한다.

## 단위 테스트

- `ENGINE-01`: 주 소원만 주어졌을 때 재정규화가 올바르게 적용되는지 검증.
- `ENGINE-02`: 보조 소원까지 모두 주어졌을 때 가중치 표 그대로 적용되는지 검증.
- `ENGINE-03`: 동점 상황에서 `slug` 오름차순으로 결정론적으로 선택되는지 검증.
- `ENGINE-04`: 반복 추천 패널티가 최근 이력에 따라 올바르게 감쇠되는지 검증.
- `ENGINE-05`: 오행 컨텍스트에서 `neededElement` 일치/상생/불일치 3가지 케이스 점수 검증.
- `ENGINE-06`: 원석 100개 기준 연산 시간이 100ms 미만인지 성능 벤치마크.

## 속성 기반 테스트

- 임의의 유효한 `RecommendationEngineInput`과 원석/태그 데이터셋에 대해, 동일 입력을 N회 반복 실행했을 때 항상 동일한 `stoneId`가 반환됨을 검증한다(결정론 속성).
- 가중치 재정규화 후 각 컨텍스트의 존재하는 신호 가중치 합이 항상 1.0(부동소수점 오차 허용 범위 내)임을 검증한다.
- `recentStoneIds`에 포함된 원석의 `finalScore`가 동일 `rawScore`를 가진 미포함 원석보다 항상 낮거나 같음을 검증한다.

## 오프라인 평가 데이터셋 형식

```json
{
  "datasetVersion": "2026.09.0",
  "cases": [
    {
      "caseId": "case-0001",
      "input": {
        "context": "basic",
        "wish": { "primaryWishTagId": "...", "heartTagId": "..." },
        "recentStoneIds": []
      },
      "expectedStoneId": "...",
      "expertNote": "전문가 검수자가 남긴 판단 근거 (선택)"
    }
  ]
}
```

전문가 검수를 거친 입력-기대출력 쌍을 축적해 회귀 테스트 및 가중치 튜닝 검증에 사용한다(`추가 검증 필요`: 초기 데이터셋 구축, [13-decisions-and-open-questions.md](13-decisions-and-open-questions.md) 참조).

## 추천 가중치 실험 계획

1. **베이스라인 고정**: 본 문서의 초기 가중치를 `rulesetVersion "2026.09.0"`으로 고정하고 Phase 1 출시.
2. **오프라인 평가**: 전문가 검수 데이터셋 대비 일치율을 측정해 명백한 오류(예: 특정 소원-원석 매핑이 상식과 크게 어긋남)를 우선 수정.
3. **온라인 신호 수집**: 만족도 점수(`Feedback.rating`)와 `usedFallback` 비율을 `rulesetVersion`별로 집계.
4. **A/B 실험**(`추가 검증 필요`: 실험 인프라 확정 후): 가중치 변형 버전을 일부 트래픽에 노출해 만족도 차이를 비교.
5. **버전 승격**: 통계적으로 유의미한 개선이 확인되면 새 `rulesetVersion`으로 전체 승격, 기존 결과는 소급 변경하지 않는다.

## Assumptions

- 반복 추천 윈도우 `N=3`, 다양성 보너스 계수 `0.05`는 초기 제안값이며 실측 데이터 없이 설정했다.
- 오행 상생 관계를 이용한 부분 친화도(0.5)는 단순화된 규칙이며 명리학 전문가 검수가 필요하다.

## 추가 검증 필요

- 모든 신호별 가중치 값 (표 전체)
- 오행 상생·상극 관계를 이용한 친화도 계산 방식의 명리학적 타당성
- 반복 추천 패널티 윈도우 크기(N)와 감쇠 계수
- 다양성 보너스 계수 및 집계 주기
- 오프라인 평가 데이터셋 최초 구축 및 검수 주체

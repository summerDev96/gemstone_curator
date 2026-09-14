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
| 관계 유형 (`relationshipType`) | S10 | LLM 카피 맥락 입력만(원석 점수화 신호 아님, 실제 구현 참고) |

자유 입력(`freeText`)은 원석 선택 신호로 사용하지 않는다. LLM 카피 생성에만 사용되며 엔진 점수 계산에는 관여하지 않는다(결정론 보장을 위해 비정형 텍스트를 점수화 입력에서 제외).

## 원석 지식 모델

`Stone`과 `StoneTag`([06-database-schema.md](06-database-schema.md#stonetag))로 표현한다. 각 원석은 다수의 태그(소원/감정/관계목표)에 대해 0.0~1.0의 친화도(`weight`)를 가지며, 매핑이 없는 조합은 친화도 0으로 간주한다. `Stone.element`는 오행 컨텍스트에서 원소 일치 판정에 사용된다.

오행 상생 관계(목생화, 화생토, 토생금, 금생수, 수생목)를 활용한 부분 친화도 판정은 `추가 검증 필요`(전문가 검수 전까지는 단순 일치/불일치만 사용, 아래 점수식 참조).

## 점수식

컨텍스트 `c ∈ {basic, five-elements, relationship, partner-five-elements}`에 대해 원석 `s`의 점수는 다음과 같다(`partner-five-elements`는 관계 원석(Phase 3)에서 상대방의 원석을 상대방의 오행만으로 정하는 컨텍스트, 실제 구현 참고).

```
score(s, c) = Σ_i weight[c][i] * affinity(s, signal_i)
```

- `affinity(s, signal_i)`: 태그 신호는 `StoneTag.weight`, 오행 신호는 아래 "오행 보완" 절 참조.
- 반복 패널티(최근 추천 감쇠)와 다양성 보너스(전역 빈도 보정)는 도입했다가 제거했거나 처음부터 구현하지 않았다 — 자세한 경위는 아래 "반복 추천 패널티 (제거됨)" 절 참조.

### 오행 보완 친화도

```
affinity(s, neededElement) =
  1.0   if s.element == neededElement
  0.5   if s.element generates neededElement (오행 상생, 추가 검증 필요)
  0.0   otherwise (s.element가 null인 경우 포함)
```

**실제 구현 참고**: "relationship" 컨텍스트에서 상대방의 필요 기운(`partnerNeededElement`)도 함께 주어지면(상대방 생년월일시를 처음부터 입력했거나, 초대 링크 응답으로 나중에 확보된 경우) 위 `affinity`를 나와 상대방 양쪽에 대해 각각 계산해 평균한다: `combinedAffinity = (affinity(s, myNeeded) + affinity(s, partnerNeeded)) / 2`. 상대방 정보가 없으면 기존처럼 내 필요 기운만 사용한다. 초대 링크로 상대방이 나중에 응답하는 경우, 응답 시점에 "우리의 원석"을 이 계산으로 재계산해 DB에 반영한다([13-decisions-and-open-questions.md](13-decisions-and-open-questions.md#확정된-제품-결정) 참조).

## 신호별 가중치 (초기 휴리스틱, `추가 검증 필요`)

| 신호 | 기본(basic) | 오행(five-elements) | 관계(relationship) | 상대방 오행(partner-five-elements) |
| --- | ---: | ---: | ---: | ---: |
| 주 소원 | 0.50 | 0.35 | 0.20 | 0 |
| 보조 소원 | 0.15 | 0.10 | 0.05 | 0 |
| 감정 | 0.35 | 0.20 | 0.15 | 0 |
| 오행 보완 | 0 | 0.35 | 0.25 | 1.00 |
| 관계 목표 | 0 | 0 | 0.35 | 0 |

각 컨텍스트별 가중치 합은 1.0이다. 이 값은 검증된 사용자 데이터 없이 설정된 초기 휴리스틱이며 모든 값이 `추가 검증 필요` 대상이다([추천 가중치 실험 계획](#추천-가중치-실험-계획) 참조).

**실제 구현 참고(Phase 3)**: 이 표는 원안(`relationshipType`을 0.10 가중치의 별도 신호로 포함)과 다르다. 원석↔관계 유형(가족/친구/연인/동료/기타) 간 친화도를 뒷받침할 근거가 없어(전문가 검수 전) 원석 점수화 신호에서 제외했고, 그 0.10을 관계 목표/오행 보완/소원/감정에 비례 배분했다(`relationshipType`은 여전히 LLM 카피의 맥락 입력으로는 쓰인다). `partner-five-elements`는 상대방의 오행만으로 상대방의 원석을 정하는 별도 컨텍스트로, 상대방은 소원·감정을 입력하지 않으므로 오행 보완 가중치가 1.0이다. 자세한 배경은 [13-decisions-and-open-questions.md](13-decisions-and-open-questions.md#확정된-제품-결정)를 참조. 실제 코드는 [src/lib/engine/weights.ts](../src/lib/engine/weights.ts)의 `WEIGHT_TABLE`을 정본으로 한다.

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

최고 점수 원석이 복수인 경우, `Stone.slug`의 사전식(lexicographic) 오름차순으로 가장 앞선 원석을 결정론적으로 선택한다.

난수(`Math.random` 등)는 사용하지 않는다(결정론 보장 원칙).

## 반복 추천 패널티 (제거됨, 실제 구현 참고)

원안은 동일 세션/계정의 최근 `N=3`건 추천에 이미 등장한 원석에 감쇠(1회 등장 0.85배, 2회 이상 0.7배)를 적용해 "기본 추천"을 다시 뽑을 때 다양성을 주려 했다. 하지만 이 `recentStoneIds` 이력이 컨텍스트 구분 없이 세션의 모든 추천(기본 추천·오행 분석·관계 원석)에서 함께 집계되다 보니, 오행 분석·관계 원석처럼 "같은 생년월일시+소원이면 항상 같은 결과"여야 하는 진단성 결과까지 무관한 최근 활동에 따라 흔들리는 문제가 있었다. 사용자가 실사용 중 "오행 분석을 반복해도 원석이 계속 바뀐다"는 문제를 신고했고, 논의 끝에 반복 패널티 자체를 완전히 제거하기로 했다(기본 추천도 포함— 사용자가 "기본 추천도 같은 게 나오는 게 맞다"고 명시적으로 판단, [13-decisions-and-open-questions.md](13-decisions-and-open-questions.md) 참조). 엔진은 이제 `recentStoneIds` 입력 자체를 받지 않으며, 동일한 소원/감정/오행/관계목표 입력은 언제 호출해도 항상 동일한 원석을 반환한다.

## 다양성 보너스 (미구현)

원안은 전역 추천 분포가 특정 원석에 과도하게 쏠리는 것을 완화하기 위해 아래와 같은 소폭 보정을 제안했으나, 실제로 구현한 적은 없다(반복 패널티와 마찬가지로 근거 있는 판단 로직이 아니라는 이유로 도입하지 않았다).

```
diversityBonus(s) = 0.05 * (1 - normalizedGlobalFrequency(s))  // 미구현
```

## Ruleset 버전 관리

- `Recommendation.rulesetVersion`에 시맨틱 버전 문자열(예: `"2026.09.0"`)을 기록한다.
- 가중치 표, 점수식, 패널티/보너스 로직 중 하나라도 변경되면 버전을 올린다.
- 과거 추천 결과는 생성 당시의 `rulesetVersion`을 그대로 유지하며 소급 재계산하지 않는다(재현성 보장).

## 추천 근거 추적

각 추천 요청은 내부 관측용으로 `scoreBreakdown`(신호별 기여도)과 상위 후보 목록(`candidates`)을 로깅한다(개인정보 미포함, 태그/원석 ID만 포함). 이는 오프라인 평가와 이상 탐지에 사용되며 공개 API 응답에는 노출하지 않는다([07-api-specification.md](07-api-specification.md#post-recommendationsbasic) 참조).

## TypeScript 인터페이스

```ts
type FiveElement = "WOOD" | "FIRE" | "EARTH" | "METAL" | "WATER";
// EngineContext는 실제로는 4가지다("partner-five-elements" 추가, 실제 구현 참고 각주 참조).
type EngineContext = "basic" | "five-elements" | "relationship" | "partner-five-elements";

interface WishSignal {
  // "partner-five-elements" 컨텍스트에서는 상대방 본인의 소원/감정을 입력받지 않으므로
  // 모든 필드가 선택적이다(실제 구현 참고).
  primaryWishTagId?: string;
  secondaryWishTagId?: string;
  heartTagId?: string;
}

interface FiveElementSignal {
  neededElement: FiveElement;
}

interface RelationshipSignal {
  // relationshipType(관계 유형)은 원석 점수화 신호에서 제외했다(실제 구현 참고,
  // 13-decisions-and-open-questions.md 참조). LLM 카피 생성의 맥락 입력으로만 쓰인다.
  relationshipGoalTagId: string;
}

interface RecommendationEngineInput {
  context: EngineContext;
  wish: WishSignal;
  fiveElement?: FiveElementSignal; // context === "five-elements" | "partner-five-elements"일 때 필수
  relationship?: RelationshipSignal; // context === "relationship"일 때 필수
}

interface StoneCandidateScore {
  stoneId: string;
  score: number;
  breakdown: Record<string, number>;
}

interface RecommendationEngineResult {
  stoneId: string;
  rulesetVersion: string;
  score: number;
  breakdown: Record<string, number>;
  candidates: StoneCandidateScore[]; // 점수 내림차순, 상위 10개
}
```

## 의사코드

**실제 구현 참고**: 아래 의사코드는 반복 추천 패널티/다양성 보너스를 제외한 최종 형태다(제거 경위는 위 "반복 추천 패널티 (제거됨)" 절 참조. 다양성 보너스는 처음부터 구현되지 않았다 — 근거 없는 전역 빈도 보정을 도입하지 않기로 함).

```ts
function recommend(input: RecommendationEngineInput, stones: Stone[], stoneTags: StoneTag[]): RecommendationEngineResult {
  const weights = normalizeWeights(WEIGHT_TABLE[input.context], input);

  const scored: StoneCandidateScore[] = stones.map((stone) => {
    const breakdown: Record<string, number> = {};
    let score = 0;

    if (weights.primaryWish) {
      breakdown.primaryWish = weights.primaryWish * affinity(stone, input.wish.primaryWishTagId, stoneTags);
      score += breakdown.primaryWish;
    }
    if (weights.secondaryWish && input.wish.secondaryWishTagId) {
      breakdown.secondaryWish = weights.secondaryWish * affinity(stone, input.wish.secondaryWishTagId, stoneTags);
      score += breakdown.secondaryWish;
    }
    if (weights.heart) {
      breakdown.heart = weights.heart * affinity(stone, input.wish.heartTagId, stoneTags);
      score += breakdown.heart;
    }
    if (weights.fiveElement && input.fiveElement) {
      breakdown.fiveElement = weights.fiveElement * elementAffinity(stone, input.fiveElement.neededElement);
      score += breakdown.fiveElement;
    }
    if (weights.relationshipGoal && input.relationship) {
      breakdown.relationshipGoal = weights.relationshipGoal * affinity(stone, input.relationship.relationshipGoalTagId, stoneTags);
      score += breakdown.relationshipGoal;
    }

    return { stoneId: stone.id, score, breakdown };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return stoneSlugOf(a.stoneId).localeCompare(stoneSlugOf(b.stoneId));
  });

  const winner = scored[0];
  return {
    stoneId: winner.stoneId,
    rulesetVersion: CURRENT_RULESET_VERSION,
    score: winner.score,
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
- `ENGINE-03`: 동점 상황에서 `slug` 오름차순으로 결정론적으로 선택되는지, 그리고 세션의 다른 추천 이력이 있어도 결과가 흔들리지 않는지 검증.
- `ENGINE-05`: 오행 컨텍스트에서 `neededElement` 일치/상생/불일치 3가지 케이스 점수 검증.
- `ENGINE-06`: 원석 100개 기준 연산 시간이 100ms 미만인지 성능 벤치마크.

## 속성 기반 테스트

- 임의의 유효한 `RecommendationEngineInput`과 원석/태그 데이터셋에 대해, 동일 입력을 N회 반복 실행했을 때 항상 동일한 `stoneId`가 반환됨을 검증한다(결정론 속성).
- 가중치 재정규화 후 각 컨텍스트의 존재하는 신호 가중치 합이 항상 1.0(부동소수점 오차 허용 범위 내)임을 검증한다.

## 오프라인 평가 데이터셋 형식

```json
{
  "datasetVersion": "2026.09.0",
  "cases": [
    {
      "caseId": "case-0001",
      "input": {
        "context": "basic",
        "wish": { "primaryWishTagId": "...", "heartTagId": "..." }
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

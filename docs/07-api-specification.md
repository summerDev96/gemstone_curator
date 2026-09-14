# 07. API 명세 — 원석 큐레이터

- 문서 버전: 0.1.0
- 최종 수정일: 2026-09-11 (Asia/Seoul)
- 상태: Draft

Base URL: `/api/v1`. 모든 요청/응답은 `application/json`. 시간 필드는 ISO 8601 UTC(`Z` 접미사)로 직렬화하고, 클라이언트에서 Asia/Seoul로 표시한다. 필드명은 [06-database-schema.md](06-database-schema.md)의 Prisma 필드명과 동일한 camelCase를 사용한다.

## 인증 공통 규칙

- 비회원: `POST /sessions`로 발급받은 세션 토큰을 `Authorization: Bearer <sessionToken>` 헤더로 전달한다.
- 회원: 로그인 후 발급되는 인증 토큰을 동일하게 `Authorization: Bearer <authToken>` 헤더로 전달한다(세션 토큰과 인증 토큰은 서버에서 종류를 구분해 검증한다). 로그인/가입 전용 엔드포인트는 `추가 검증 필요`(FR-FIVE-005 인증 방식 확정 후 본 문서에 추가).
- 소유권 검증이 필요한 리소스(`Recommendation`, `RelationshipAnalysis`, `ShareLink` 등)는 요청 주체의 세션/계정이 해당 리소스를 생성했는지 서버에서 검증하며, 불일치 시 리소스 존재 여부를 노출하지 않기 위해 `404 NOT_FOUND`를 반환한다.

## 공통 오류 Envelope

```ts
type ApiError = {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
    requestId: string;
  };
};
```

공통 오류 코드: `VALIDATION_ERROR`(400), `UNAUTHORIZED`(401), `NOT_FOUND`(404), `CONFLICT`(409), `RATE_LIMITED`(429), `SAFETY_BLOCKED`(422, 위기 표현 감지), `INTERNAL_ERROR`(500).

---

## POST /sessions

- **목적**: 비회원 세션을 발급한다.
- **인증·소유권**: 인증 불요(공개).
- **Headers**: 없음.
- **Body**: 없음(빈 객체 허용).
- **Zod Schema**: `z.object({})`
- **요청 예시**
```json
{}
```
- **성공 응답 예시 (201)**
```json
{
  "sessionId": "b3d3c9b0-1e3a-4b8a-9c2b-1a2b3c4d5e6f",
  "sessionToken": "sst_9f8e7d6c5b4a3210...",
  "expiresAt": "2026-10-11T00:00:00.000Z"
}
```
- **오류 응답**: `RATE_LIMITED`(과도한 세션 발급 시도).
- **Rate limit**: IP 기준 분당 20회(`추가 검증 필요`: 최종 임계값).
- **Idempotency**: 비멱등(호출마다 새 세션 발급).
- **개인정보 처리**: IP는 rate limiting 목적의 단기 로그로만 사용, 세션 레코드에는 저장하지 않는다.
- **관련 화면**: S01.
- **테스트 케이스**: API-01.

---

## GET /catalog/wishes

- **목적**: 소원(`WISH`)/감정(`EMOTION`) 태그 목록을 조회한다.
- **인증·소유권**: 세션 토큰 필요(비회원도 접근 가능).
- **Headers**: `Authorization: Bearer <sessionToken|authToken>`
- **Query**: 없음.
- **Zod Schema**: 요청 파라미터 없음.
- **요청 예시**: `GET /api/v1/catalog/wishes`
- **성공 응답 예시 (200)**
```json
{
  "wishes": [
    { "id": "8a1b...", "slug": "new-beginning", "labelKo": "새로운 시작" },
    { "id": "9c2d...", "slug": "confidence", "labelKo": "자신감" }
  ],
  "emotions": [
    { "id": "1e2f...", "slug": "calm", "labelKo": "마음이 편안해지고 싶어요" }
  ]
}
```
- **오류 응답**: `UNAUTHORIZED`(세션 토큰 누락/만료).
- **Rate limit**: 사용자당 분당 60회.
- **Idempotency**: 멱등(GET).
- **개인정보 처리**: 없음(정적 카탈로그).
- **관련 화면**: S02, S03.
- **테스트 케이스**: API-02.

---

## POST /recommendations/basic

- **목적**: 소원·마음 입력을 받아 결정론적 원석 추천과 AI 생성 카피를 반환한다.
- **인증·소유권**: 세션 토큰 필요. 생성된 리소스는 해당 세션/계정 소유가 된다.
- **Headers**: `Authorization: Bearer <sessionToken|authToken>`
- **Body**:
```ts
{
  primaryWishTagId: string; // uuid
  secondaryWishTagId?: string; // uuid
  heartTagId: string; // uuid
  freeText?: string; // max 300 chars, 서버 저장 안 함
}
```
- **Zod Schema**
```ts
const RecommendationBasicRequestSchema = z.object({
  primaryWishTagId: z.string().uuid(),
  secondaryWishTagId: z.string().uuid().optional(),
  heartTagId: z.string().uuid(),
  freeText: z.string().max(300).optional(),
});
```
- **요청 예시**
```json
{
  "primaryWishTagId": "8a1b2c3d-0000-0000-0000-000000000001",
  "secondaryWishTagId": "8a1b2c3d-0000-0000-0000-000000000002",
  "heartTagId": "1e2f3a4b-0000-0000-0000-000000000001",
  "freeText": "요즘 이직을 고민하고 있어요."
}
```
- **성공 응답 예시 (201)**
```json
{
  "id": "c1d2e3f4-0000-0000-0000-000000000001",
  "stone": {
    "id": "aa11...",
    "slug": "rose-quartz",
    "nameKo": "로즈쿼츠",
    "nameEn": "Rose Quartz",
    "colorHex": "#E8B4B8",
    "imageUrl": "https://cdn.example.com/stones/rose-quartz.jpg"
  },
  "heartSummary": "새로운 시작 앞에서 설렘과 불안이 함께 있는 마음이에요.",
  "rationale": "변화를 바라는 마음과 편안함을 찾고 싶은 마음이 함께 느껴져 로즈쿼츠를 골랐어요.",
  "comfortLines": [
    "지금의 흔들림은 방향을 찾아가는 자연스러운 과정이에요.",
    "천천히 나아가도 괜찮아요."
  ],
  "microAction": "오늘 5분, 지금 마음을 한 문장으로 적어보세요.",
  "usedFallback": false,
  "createdAt": "2026-09-11T02:00:00.000Z"
}
```
- **오류 응답**: `VALIDATION_ERROR`(태그 ID 형식/300자 초과), `SAFETY_BLOCKED`(위기 표현 감지 시, [09-ai-prompts-and-safety.md](09-ai-prompts-and-safety.md) 참조), `NOT_FOUND`(존재하지 않는 태그 ID).
- **Rate limit**: 세션당 분당 5회(`추가 검증 필요`).
- **Idempotency**: 비멱등(호출마다 새 `Recommendation` 생성). 클라이언트 이중 클릭 방지는 UI 레벨에서 처리.
- **개인정보 처리**: `freeText`는 LLM 프롬프트 구성에만 사용되고 응답 생성 즉시 폐기되며 DB에 저장되지 않는다. 서버 로그에도 기록하지 않는다.
- **관련 화면**: S04, S05.
- **테스트 케이스**: API-03, E2E-01, E2E-03, E2E-04, ENGINE-01~05.

---

## POST /recommendations/desire

- **목적**: "내 염원으로 추천받기"(S01-D) — 생년월일 없이, 사용자가 고른 염원 하나로 원석 후보를 조회한다. `Recommendation`을 생성하지 않는 상태 없는(stateless) 조회다.
- **인증**: 세션 토큰 필요(개인화 데이터는 만들지 않지만, 다른 엔드포인트와 동일하게 비회원 세션 체계를 통일해 사용).
- **Headers**: `Authorization: Bearer <sessionToken>`
- **Body**:
```ts
{
  desire: "love" | "romance" | "health" | "vitality" | "study"
        | "healing" | "relationships" | "protection" | "defense";
}
```
- **처리 로직**: `desire` → 내부 목적 그룹(5종: `love_romance`, `health_vitality`, `study`, `healing_relationships`, `protection_defense`) → 사람이 정리한 오행×목적 매핑 표에서 해당 그룹에 속한 원석 slug 목록 조회 → 기존 `Stone` 테이블에서 실제 데이터 조회(없는 slug는 조용히 제외). 결정론적 규칙 엔진(`recommend()`)은 사용하지 않는다 — 사주 입력이 없어 오행 신호가 없기 때문.
- **요청 예시**
```json
{ "desire": "love" }
```
- **성공 응답 예시 (200)**
```json
{
  "stones": [
    { "id": "...", "slug": "turquoise", "nameKo": "터키석", "nameEn": "Turquoise", "colorHex": "#3FB8AF", "imageUrl": "/images/jewelry/turquoise.png", "summary": "..." },
    { "id": "...", "slug": "amazonite", "nameKo": "아마조나이트", "nameEn": "Amazonite", "colorHex": "...", "imageUrl": "...", "summary": "..." }
  ]
}
```
- **오류 응답**: `VALIDATION_ERROR`(`desire`가 9개 값 중 하나가 아님), `UNAUTHORIZED`.
- **Rate limit**: 세션당 분당 10회.
- **Idempotency**: 멱등(같은 `desire`는 항상 같은 목록을 반환, DB에 아무것도 쓰지 않는다).
- **매핑 데이터 출처**: [src/lib/desire/mapping.ts](src/lib/desire/mapping.ts) — 원안(오행×목적 표)에 있던 원석 중 실제 23종 카탈로그에 없는 것(20여 종)은 임의로 대체하지 않고 제외했다. 매핑에 후보가 없는 조합은 빈 배열을 반환하며, 현재 9개 염원은 모두 최소 1개 이상의 후보를 가진다([13-decisions-and-open-questions.md](13-decisions-and-open-questions.md) 참조).
- **관련 화면**: S01-D.
- **테스트 케이스**: `src/lib/desire/mapping.test.ts`, `src/app/api/v1/recommendations/desire/route.test.ts`, `e2e/entry-mode-flow.spec.ts`.

---

## GET /recommendations/{id}

- **목적**: 기본 추천 결과(및 확장된 오행/관계 결과 요약)를 조회한다.
- **인증·소유권**: 세션/계정이 해당 `Recommendation`의 `WishSession` 소유자와 일치해야 한다.
- **Headers**: `Authorization: Bearer <sessionToken|authToken>`
- **Path**: `id` (uuid)
- **성공 응답 예시 (200)**: `POST /recommendations/basic` 응답과 동일한 형태에 더해 오행/관계 확장 여부 플래그 포함
```json
{
  "id": "c1d2e3f4-0000-0000-0000-000000000001",
  "stone": { "...": "..." },
  "heartSummary": "...",
  "rationale": "...",
  "comfortLines": ["...", "..."],
  "microAction": "...",
  "usedFallback": false,
  "createdAt": "2026-09-11T02:00:00.000Z",
  "fiveElements": null,
  "relationships": []
}
```
- **오류 응답**: `NOT_FOUND`(존재하지 않거나 소유자 불일치).
- **Rate limit**: 세션당 분당 60회.
- **Idempotency**: 멱등(GET).
- **개인정보 처리**: `fiveElements`가 존재해도 `balanceJson`/`computedElement`/`integratedStone`만 노출하며 생년월일시 원문은 절대 포함하지 않는다.
- **관련 화면**: S05, S08, S12.
- **테스트 케이스**: API-04.

---

## POST /recommendations/{id}/five-elements

- **목적**: 오행 분석 동의와 출생정보를 받아 오행 통합 결과를 생성한다.
- **인증·소유권**: `Recommendation` 소유자만 호출 가능.
- **Headers**: `Authorization: Bearer <sessionToken|authToken>`
- **Path**: `id` (uuid, Recommendation ID)
- **Body**
```ts
{
  consent: true; // 리터럴 true만 허용
  consentVersion: string;
  calendarType: "SOLAR" | "LUNAR";
  birthDate: string; // YYYY-MM-DD
  birthTimeUnknown: boolean;
  birthTime?: string; // HH:mm, birthTimeUnknown=false일 때 필수
}
```
- **Zod Schema**
```ts
const FiveElementsRequestSchema = z.object({
  consent: z.literal(true),
  consentVersion: z.string().min(1),
  calendarType: z.enum(["SOLAR", "LUNAR"]),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTimeUnknown: z.boolean(),
  birthTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
}).refine(
  (data) => data.birthTimeUnknown || !!data.birthTime,
  { message: "birthTime is required when birthTimeUnknown is false", path: ["birthTime"] }
);
```
- **요청 예시**
```json
{
  "consent": true,
  "consentVersion": "privacy-policy-2026-09-11",
  "calendarType": "SOLAR",
  "birthDate": "1996-04-12",
  "birthTimeUnknown": true
}
```
- **성공 응답 예시 (201)**
```json
{
  "fiveElementProfileId": "d1e2f3a4-0000-0000-0000-000000000001",
  "computedElement": "WATER",
  "balance": { "wood": 0.18, "fire": 0.14, "earth": 0.2, "metal": 0.22, "water": 0.26 },
  "integratedStone": {
    "id": "bb22...",
    "slug": "aquamarine",
    "nameKo": "아쿠아마린",
    "nameEn": "Aquamarine"
  },
  "rationale": "물의 기운이 강해 균형을 잡아줄 원석을 통합 추천했어요."
}
```
- **오류 응답**: `VALIDATION_ERROR`(날짜/시간 형식, 미래 날짜), `NOT_FOUND`(Recommendation 없음), `CONFLICT`(이미 오행 프로필이 존재하는 경우 재생성 정책은 `추가 검증 필요`).
- **Rate limit**: 세션당 분당 5회.
- **Idempotency**: 비멱등(최초 1회 생성, 이후 호출은 `CONFLICT` 또는 정책에 따라 갱신, `추가 검증 필요`).
- **개인정보 처리**: `birthDate`/`birthTime`은 즉시 envelope encryption 후 저장, 요청 로그에는 마스킹 처리(값 자체 미기록). 동의는 `ConsentRecord`에 기록.
- **관련 화면**: S06, S07, S08.
- **테스트 케이스**: API-05, E2E-05.

---

## POST /recommendations/{id}/relationship

- **목적**: 관계 유형·목표·상대방 정보를 받아 관계 원석 결과를 생성한다. 나와 상대방의 사주를 함께 비교하는 기능이므로 **두 사람의 생년월일시가 모두 필요**하다(요청자가 이미 오행 분석(S06~S08)을 마쳤다면 나의 생년월일시는 그 결과를 재사용하고 이 요청에서는 생략 가능).
- **인증·소유권**: `Recommendation` 소유자만 호출 가능.
- **Headers**: `Authorization: Bearer <sessionToken|authToken>`
- **Path**: `id` (uuid, Recommendation ID)
- **Body**
```ts
{
  relationshipType: "FAMILY" | "FRIEND" | "ROMANTIC" | "COLLEAGUE" | "OTHER";
  relationshipGoalTagId: string; // uuid
  partnerNickname: string; // 1~20자
  myBirthInfo?: {
    // 이미 오행 분석을 마친 Recommendation이면 생략 가능. 아니라면 필수.
    calendarType: "SOLAR" | "LUNAR";
    birthDate: string;
    isLeapMonth?: boolean;
    birthTimeUnknown: boolean;
    birthTime?: string;
  };
  partnerBirthInfo: {
    // 항상 필수.
    calendarType: "SOLAR" | "LUNAR";
    birthDate: string;
    isLeapMonth?: boolean;
    birthTimeUnknown: boolean;
    birthTime?: string;
  };
}
```
- **Zod Schema**
```ts
const BirthInfoSchema = z.object({
  calendarType: z.enum(["SOLAR", "LUNAR"]),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isLeapMonth: z.boolean().optional(),
  birthTimeUnknown: z.boolean(),
  birthTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
});

const RelationshipRequestSchema = z.object({
  relationshipType: z.enum(["FAMILY", "FRIEND", "ROMANTIC", "COLLEAGUE", "OTHER"]),
  relationshipGoalTagId: z.string().uuid(),
  partnerNickname: z.string().min(1).max(20),
  myBirthInfo: BirthInfoSchema.optional(),
  partnerBirthInfo: BirthInfoSchema,
});
```
- **요청 예시**
```json
{
  "relationshipType": "FRIEND",
  "relationshipGoalTagId": "2f3a4b5c-0000-0000-0000-000000000001",
  "partnerNickname": "민지",
  "myBirthInfo": { "calendarType": "SOLAR", "birthDate": "1996-04-12", "birthTimeUnknown": true },
  "partnerBirthInfo": { "calendarType": "SOLAR", "birthDate": "1998-07-20", "birthTimeUnknown": true }
}
```
- **성공 응답 예시 (201)**
```json
{
  "relationshipAnalysisId": "e1f2a3b4-0000-0000-0000-000000000001",
  "myStone": { "id": "aa11...", "nameKo": "로즈쿼츠", "nameEn": "Rose Quartz", "colorHex": "#F4C2C2", "imageUrl": "/images/jewelry/rose-quartz.png" },
  "partnerStone": { "id": "bb22...", "nameKo": "오팔", "nameEn": "Opal", "colorHex": "#E6E6FA", "imageUrl": "/images/jewelry/opal.png" },
  "weStone": { "id": "cc33...", "nameKo": "시트린", "nameEn": "Citrine", "colorHex": "#E4D00A", "imageUrl": "/images/jewelry/citrine.png" },
  "conversationPrompt": "요즘 서로에게 가장 고마웠던 순간은 언제였나요?",
  "microAction": "이번 주 안에 서로에게 짧은 안부를 전해보세요.",
  "usedFallback": false
}
```
- **오류 응답**: `VALIDATION_ERROR`(별명 길이/형식, `partnerBirthInfo` 누락, 오행 분석 미완료 상태에서 `myBirthInfo` 누락), `NOT_FOUND`(Recommendation 또는 태그 없음).
- **Rate limit**: 세션당 분당 5회.
- **Idempotency**: 비멱등(호출마다 새 `RelationshipAnalysis` 생성, 상대방 `FiveElementProfile`도 매번 새로 계산).
- **개인정보 처리**: `partnerNickname`, `myBirthInfo`/`partnerBirthInfo`는 envelope encryption 저장, 응답/공유/분석 이벤트에는 원문 미노출.
- **우리의 원석 계산**: 나의 소원·감정 태그 + 나와 상대방 각각의 오행 필요 기운(둘 다 항상 존재) + 관계 목표를 함께 반영한다([08-recommendation-engine.md](08-recommendation-engine.md)의 `combinedElementAffinity` 참조).
- **관련 화면**: S09, S10, S11, S12(실제 구현에서는 하나의 클라이언트 컴포넌트 내 단계 전환으로 통합, 실제 구현 참고).
- **테스트 케이스**: API-06, E2E-06.

**실제 구현 참고**: 애초 설계는 상대방 출생정보를 선택 사항으로 두고, 상대방이 별도 초대 링크로 나중에 채워 넣는 비동기 흐름(FR-REL-005/006)을 함께 제공했다. 하지만 상대방 출생정보 없이는 "우리의 원석"이 상대방의 사주를 전혀 반영하지 못해 결과가 일관성 없어 보이는 문제가 있었고, 상대방 정보를 필수로 바꾸면서 초대 링크 흐름 자체가 도달 불가능해져 **초대 링크 기능(FR-REL-005/006)은 제거했다**(docs/13 참조). 상대방과 함께 결과를 보고 싶다면 완성된 결과를 공유 링크([POST /recommendations/{id}/share-links](#post-recommendationsidshare-links))로 전달하는 방식을 사용한다.

---

## POST /recommendations/{id}/feedback

- **목적**: 결과 만족도(1~5점)와 선택적 코멘트를 제출한다.
- **인증·소유권**: `Recommendation` 소유자만 호출 가능.
- **Headers**: `Authorization: Bearer <sessionToken|authToken>`
- **Path**: `id` (uuid)
- **Body**
```ts
{ rating: number; comment?: string; } // rating 1~5, comment 최대 500자
```
- **Zod Schema**
```ts
const FeedbackRequestSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});
```
- **요청 예시**
```json
{ "rating": 5, "comment": "위로가 됐어요" }
```
- **성공 응답 예시 (201)**
```json
{ "id": "f1a2b3c4-0000-0000-0000-000000000001", "rating": 5, "createdAt": "2026-09-11T02:05:00.000Z" }
```
- **오류 응답**: `VALIDATION_ERROR`(범위 밖 rating), `CONFLICT`(이미 피드백이 존재하는 경우, `Feedback.recommendationId` UNIQUE 제약).
- **Rate limit**: 세션당 분당 10회.
- **Idempotency**: 비멱등이나 UNIQUE 제약으로 중복 생성은 `CONFLICT` 처리(재제출은 별도 `PATCH` 없이 Phase 1에서는 1회만 허용, `추가 검증 필요`).
- **개인정보 처리**: `comment`는 자유 텍스트이므로 위기 표현 감지 로직을 동일 적용(`추가 검증 필요`: 적용 범위 확정).
- **관련 화면**: S05.
- **테스트 케이스**: API-07.

---

## POST /recommendations/{id}/share-links

- **목적**: 개인정보가 제거된 공유 링크를 발급한다.
- **인증·소유권**: `Recommendation` 또는 연결된 `RelationshipAnalysis` 소유자만 호출 가능.
- **Headers**: `Authorization: Bearer <sessionToken|authToken>`
- **Path**: `id` (uuid, Recommendation ID)
- **Body**
```ts
{ scope: "basic" | "five-elements" | "relationship"; relationshipAnalysisId?: string; }
```
- **Zod Schema**
```ts
const ShareLinkRequestSchema = z.object({
  scope: z.enum(["basic", "five-elements", "relationship"]),
  relationshipAnalysisId: z.string().uuid().optional(),
});
```
- **요청 예시**
```json
{ "scope": "basic" }
```
- **성공 응답 예시 (201)**
```json
{
  "token": "shr_3f2a1b0c9d8e7f6a...",
  "url": "https://ohgyeol.example.com/share/shr_3f2a1b0c9d8e7f6a...",
  "expiresAt": "2026-10-11T02:00:00.000Z"
}
```
- **오류 응답**: `NOT_FOUND`, `VALIDATION_ERROR`(scope=relationship인데 `relationshipAnalysisId` 누락).
- **Rate limit**: 세션당 분당 10회.
- **Idempotency**: 비멱등(호출마다 새 토큰 발급).
- **개인정보 처리**: 발급 시 원문 토큰은 이 응답에서만 노출되며 DB에는 해시만 저장([06-database-schema.md](06-database-schema.md#공유-토큰-해시-정책)).
- **관련 화면**: S05, S08, S12, S13.
- **테스트 케이스**: API-08, E2E-07.

---

## GET /shares/{token}

- **목적**: 공개 공유 카드를 조회한다.
- **인증·소유권**: 인증 불요(토큰 소지만으로 조회 가능).
- **Headers**: 없음.
- **Path**: `token` (공유 토큰 원문)
- **성공 응답 예시 (200)**
```json
{
  "stone": { "nameKo": "로즈쿼츠", "nameEn": "Rose Quartz", "colorHex": "#E8B4B8", "imageUrl": "https://cdn.example.com/stones/rose-quartz.jpg" },
  "summary": "새로운 시작 앞에서 설렘과 불안이 함께 있는 마음이에요.",
  "scope": "basic"
}
```
- **오류 응답**: `NOT_FOUND`(존재하지 않는 토큰), `410`(만료·철회됨, 별도 코드 `SHARE_EXPIRED`).
- **Rate limit**: IP당 분당 30회.
- **Idempotency**: 멱등(GET), 단 `viewCount` 증가 부수효과 있음.
- **개인정보 처리**: 응답에 생년월일시, 자유 입력, 상대방 별명, 세션/사용자 식별자, 이메일이 포함되지 않는다(allowlist 방식, [12-privacy-security-compliance.md](12-privacy-security-compliance.md#분석-이벤트-allowlist) 준용).
- **관련 화면**: S13.
- **테스트 케이스**: API-09, E2E-07.

---

## DELETE /share-links/{token}

- **목적**: 공유 링크를 철회한다.
- **인증·소유권**: 링크 소유자만 호출 가능.
- **Headers**: `Authorization: Bearer <sessionToken|authToken>`
- **Path**: `token`
- **성공 응답 예시 (204)**: 본문 없음.
- **오류 응답**: `NOT_FOUND`(소유자 불일치 포함), `CONFLICT`(이미 철회됨).
- **Rate limit**: 세션당 분당 10회.
- **Idempotency**: 멱등(이미 철회된 링크에 재호출 시 `CONFLICT` 또는 204 중 정책 확정 필요, `추가 검증 필요` — 본 문서는 `CONFLICT`를 기본값으로 채택).
- **개인정보 처리**: 없음.
- **관련 화면**: S14.
- **테스트 케이스**: API-10.

---

## DELETE /sessions/current

- **목적**: 현재 비회원 세션이 소유한 모든 데이터(추천 결과, 오행 분석, 만족도, 공유 링크, 동의 기록)를 삭제한다. 계정 기능(FR-FIVE-005/006)이 아직 없어, 로그인 없이도 사용자가 자신의 데이터를 지울 수 있도록 `DELETE /me/data`(회원 전용, 아래 참조)의 비회원 버전 역할을 한다. `docs/13-decisions-and-open-questions.md`의 "비회원 세션 삭제 경로 부재" 항목에 대한 실제 구현이다.
- **인증·소유권**: 세션 토큰 필요. 자기 자신의 세션만 삭제 가능(경로 파라미터 없이 `Authorization` 헤더의 토큰으로만 대상을 특정한다).
- **Headers**: `Authorization: Bearer <sessionToken>`
- **Body**: 없음.
- **성공 응답 예시 (204)**: 본문 없음.
- **오류 응답**: `UNAUTHORIZED`(세션 없음/이미 삭제됨), `RATE_LIMITED`.
- **Rate limit**: IP당 분당 5회.
- **Idempotency**: 멱등 — 이미 삭제된 세션으로 재호출하면 `resolveSession`이 해당 토큰을 찾지 못해 `UNAUTHORIZED`를 반환한다(삭제 자체는 내부적으로 멱등하게 구현되어 있다, `src/lib/dataDeletion.ts`).
- **개인정보 처리**: 삭제 순서는 `FiveElementProfile`(생년월일시 암호화 필드 포함)을 먼저 제거한 뒤 `AnonymousSession`을 삭제해 `WishSession`/`Recommendation`/`Feedback`/`ShareLink`/`ConsentRecord`가 cascade로 함께 제거되도록 트랜잭션으로 처리한다. 삭제 후 해당 세션이 발급했던 공유 링크는 즉시 조회 불가(404)해진다.
- **관련 화면**: `/privacy`(S14의 "개인정보 설정" 탭에서 링크로 연결되는 삭제 확인 화면, 원래 화면 인벤토리에는 없었던 실제 구현 추가 항목).
- **테스트 케이스**: `src/lib/dataDeletion.test.ts`, `src/app/api/v1/sessions/current/route.test.ts`, `src/lib/session.test.ts`(만료 세션 즉시 정리).

---

## GET /recommendations

- **목적**: 로그인 없이, 현재 비회원 세션이 소유한 추천 결과 목록을 최신순으로 조회한다(보관함 S14). `docs/13`에서 계정 기능을 만들지 않기로 확정하며 [GET /me/recommendations](#get-merecommendations)(원안) 대신 실제로 구현한 엔드포인트다.
- **인증·소유권**: 세션 토큰 필요. 현재 세션이 소유한 결과만 반환(다른 세션의 결과는 노출되지 않음).
- **Headers**: `Authorization: Bearer <sessionToken>`
- **Query**: `cursor?: string`(이전 페이지의 `nextCursor`), `limit?: number`(기본 20, 최대 50)
- **요청 예시**: `GET /api/v1/recommendations?limit=20`
- **성공 응답 예시 (200)**
```json
{
  "items": [
    {
      "id": "c1d2e3f4-0000-0000-0000-000000000001",
      "stone": { "nameKo": "로즈쿼츠", "nameEn": "Rose Quartz", "colorHex": "#E8B4B8" },
      "createdAt": "2026-09-11T02:00:00.000Z",
      "hasFiveElements": false
    }
  ],
  "nextCursor": null
}
```
- **오류 응답**: `UNAUTHORIZED`.
- **Rate limit**: `추가 검증 필요`(현재 별도 rate limit 미적용, 조회 전용이라 우선순위 낮음).
- **Idempotency**: 멱등(GET).
- **개인정보 처리**: 요약 정보만 포함하며 생년월일시 등 암호화 필드는 절대 포함하지 않는다.
- **관련 화면**: S14(`/library`).
- **테스트 케이스**: `src/app/api/v1/recommendations/route.test.ts`, `e2e/library-flow.spec.ts`.

---

## GET /me/recommendations

> **상태: 미구현 (원안, 참고용).** `docs/13-decisions-and-open-questions.md`에서 계정/로그인 기능(FR-FIVE-005)을 만들지 않기로 확정했다. 대신 로그인 없이 동작하는 [GET /recommendations](#get-recommendations)를 실제로 구현했다. 아래 원안은 향후 계정 기능이 추가될 경우를 위한 참고 설계로 남겨둔다.

- **목적**: 로그인한 회원의 추천 결과 목록을 조회한다.
- **인증·소유권**: 회원 인증 필요.
- **Headers**: `Authorization: Bearer <authToken>`
- **Query**: `cursor?: string`, `limit?: number` (기본 20, 최대 50)
- **Zod Schema**
```ts
const MeRecommendationsQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
```
- **요청 예시**: `GET /api/v1/me/recommendations?limit=20`
- **성공 응답 예시 (200)**
```json
{
  "items": [
    {
      "id": "c1d2e3f4-0000-0000-0000-000000000001",
      "stone": { "nameKo": "로즈쿼츠", "nameEn": "Rose Quartz" },
      "createdAt": "2026-09-11T02:00:00.000Z",
      "hasFiveElements": false,
      "relationshipCount": 0
    }
  ],
  "nextCursor": null
}
```
- **오류 응답**: `UNAUTHORIZED`.
- **Rate limit**: 사용자당 분당 60회.
- **Idempotency**: 멱등(GET).
- **개인정보 처리**: 목록 응답에는 요약 정보만 포함, 암호화 필드는 노출하지 않는다.
- **관련 화면**: S14.
- **테스트 케이스**: API-11, E2E-08.

---

## DELETE /me/data

> **상태: 미구현 (원안, 참고용).** 계정 기능을 만들지 않기로 확정했으므로, 로그인 없이 동일한 목적을 수행하는 [DELETE /sessions/current](#delete-sessionscurrent)를 실제로 구현했다.

- **목적**: 회원 탈퇴 및 연관 데이터 전체 삭제(잊혀질 권리).
- **인증·소유권**: 회원 인증 필요, 본인만 호출 가능.
- **Headers**: `Authorization: Bearer <authToken>`
- **Body**: 없음(확인은 클라이언트 UI 모달에서 수행, `추가 검증 필요`: 서버 측 재확인 절차 — 예: 비밀번호 재입력 필요 여부).
- **성공 응답 예시 (202)**
```json
{ "deletionReceiptId": "9a8b7c6d-0000-0000-0000-000000000001", "status": "PROCESSING" }
```
- **오류 응답**: `UNAUTHORIZED`.
- **Rate limit**: 사용자당 시간당 3회.
- **Idempotency**: 멱등(이미 삭제 처리 중/완료인 경우 동일 영수증 상태 반환).
- **개인정보 처리**: [06-database-schema.md](06-database-schema.md#데이터-삭제-순서)에 정의된 순서로 cascade 삭제 수행, 활성 공유 링크는 즉시 무효화.
- **관련 화면**: S14.
- **테스트 케이스**: API-12, E2E-08.

## Assumptions

- `docs/13-decisions-and-open-questions.md`에서 계정/로그인(FR-FIVE-005)을 만들지 않기로 확정했다. `/auth/*` 엔드포인트는 설계하지 않으며, `GET /me/recommendations`/`DELETE /me/data`는 원안 참고용으로만 남기고 각각 `GET /recommendations`/`DELETE /sessions/current`로 대체 구현했다.
- 세션은 단일 종류(`AnonymousSession`, `sst_` 접두사 토큰)만 존재하며 `Authorization: Bearer` 헤더로 통합 처리한다.

## 추가 검증 필요

이 문서에 없던 아래 항목들은 실제 구현 과정에서 이미 결정되어 해소됐다: 오행 프로필 재생성(재호출 시 `CONFLICT` 409로 거부), 피드백 재제출(`CONFLICT` 409로 거부, 각 `Recommendation`당 1회), `DELETE /share-links/{token}` 재호출(이미 철회된 경우 `CONFLICT` 409), 엔드포인트별 rate limit(각 섹션에 명시된 값이 최종값). 계정 기능은 만들지 않기로 확정되어 `/auth/*` 설계도 더 이상 유효한 항목이 아니다([13-decisions-and-open-questions.md](13-decisions-and-open-questions.md) 참조).

남은 항목은 없다 — 새로운 엔드포인트가 추가될 때마다 이 절을 갱신한다.

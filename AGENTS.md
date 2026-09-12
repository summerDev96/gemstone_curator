# AGENTS.md — 원석 큐레이터 저장소 작업 규칙

이 문서는 Cursor, Codex, Claude Code 등 이 저장소에서 작업하는 모든 코딩 에이전트가 지켜야 할 규칙을 정의한다. 제품/기술 설계의 단일 기준은 [docs/](docs/00-project-overview.md)이며, 코드가 문서와 충돌할 경우 먼저 어느 쪽이 최신인지 확인하고 문서를 갱신한다.

## 작업 전 필수 확인

1. 작업을 시작하기 전 [docs/00-project-overview.md](docs/00-project-overview.md)로 전체 문서 구조를 파악한다.
2. 기능 구현 시 [docs/01-prd.md](docs/01-prd.md)에서 해당 요구사항 ID(`FR-*`/`NFR-*`)를 찾아 수용 기준을 확인한다.
3. 화면 작업 시 [docs/04-screen-specifications.md](docs/04-screen-specifications.md)의 해당 화면 ID(S01~S14) 명세를 확인한다.
4. API 작업 시 [docs/07-api-specification.md](docs/07-api-specification.md)의 요청/응답 스펙을 확인한다.
5. 원석 선정 로직을 다루는 작업은 반드시 [docs/08-recommendation-engine.md](docs/08-recommendation-engine.md)를 먼저 읽는다.
6. LLM 관련 작업은 반드시 [docs/09-ai-prompts-and-safety.md](docs/09-ai-prompts-and-safety.md)의 금지 행위와 안전 규칙을 먼저 읽는다.
7. 개인정보를 다루는 작업(생년월일시, 자유 입력, 상대방 정보 등)은 반드시 [docs/12-privacy-security-compliance.md](docs/12-privacy-security-compliance.md)를 먼저 읽는다.

## 사용자 변경 보존

- 저장소에 이미 존재하는 사용자 작성 코드, 설정, 문서를 임의로 덮어쓰거나 삭제하지 않는다.
- 문서와 충돌하는 기존 구현을 발견하면 먼저 어느 쪽이 최신 의도인지 사용자에게 확인한다(추측으로 한쪽을 삭제하지 않는다).

## Phase 범위 준수

- [docs/11-implementation-roadmap.md](docs/11-implementation-roadmap.md)에 정의된 Phase 1의 9단계가 모두 완료되고 CI 품질 게이트([docs/10-testing-and-acceptance.md](docs/10-testing-and-acceptance.md#ci-품질-게이트))를 통과하기 전에는 Phase 2(오행 분석, 계정/보관함) 또는 Phase 3(관계 원석) 기능을 구현하지 않는다.
- Phase 범위를 벗어나는 작업 요청을 받으면, 먼저 현재 Phase 진행 상태를 확인하고 범위 밖임을 알린다.

## TDD

- 테스트를 먼저 작성하고, 실패를 확인한 뒤, 구현으로 테스트를 통과시킨다.
- [docs/11-implementation-roadmap.md](docs/11-implementation-roadmap.md)의 각 단계별 "TDD 순서"를 따른다.
- 테스트 없이 기능을 완료로 선언하지 않는다(아래 "완료 보고" 참조).

## TypeScript strict

- `tsconfig.json`의 strict 모드를 항상 유지한다. `any` 타입, non-null assertion(`!`) 남용, strict 옵션 완화를 하지 않는다.

## 작은 파일과 명확한 인터페이스

- 하나의 파일/모듈은 하나의 책임만 갖도록 분리한다([docs/11-implementation-roadmap.md](docs/11-implementation-roadmap.md)의 파일 경로 제안 참조).
- 모듈 간 경계는 [docs/08-recommendation-engine.md](docs/08-recommendation-engine.md), [docs/09-ai-prompts-and-safety.md](docs/09-ai-prompts-and-safety.md)에 정의된 TypeScript 인터페이스(`RecommendationEngineInput`/`Result`, `LLMProvider`, `GeneratedRecommendationCopy` 등)를 그대로 구현체의 계약으로 사용한다.

## 실제 Secret 금지

- 실제 API 키, DB 자격증명, 암호화 키, 비밀번호 등 어떤 실제 secret도 코드, 커밋, 문서, 테스트 fixture에 포함하지 않는다.
- 환경변수 이름은 [README.md](README.md#환경-변수-이름)를 따르되 값은 항상 로컬 `.env` 또는 secret manager에서만 주입한다.

## 개인정보 로그 금지

- 생년월일시, 자유 입력 원문, 상대방 별명, 세션/공유/초대 토큰 원문은 로그, 에러 메시지, 분석 이벤트, 테스트 출력 어디에도 평문으로 남기지 않는다([docs/12-privacy-security-compliance.md](docs/12-privacy-security-compliance.md#로그-redaction) 참조).
- 분석 이벤트를 추가할 때는 반드시 [docs/12-privacy-security-compliance.md](docs/12-privacy-security-compliance.md#분석-이벤트-allowlist)의 allowlist를 따른다.

## 결정론적 추천 엔진 유지

- 원석 선정 로직에 난수, 현재 시각 의존 로직, 외부 API 호출을 추가하지 않는다. 동일 입력은 항상 동일 원석을 반환해야 한다([docs/08-recommendation-engine.md](docs/08-recommendation-engine.md#결정론-보장)).
- 가중치나 점수식을 변경할 때는 `rulesetVersion`을 올리고 과거 결과를 소급 변경하지 않는다.

## LLM의 원석 선택 금지

- LLM(또는 어떤 프롬프트 변경)도 원석을 새로 선택하거나 규칙 엔진이 확정한 원석을 변경하도록 만들지 않는다.
- LLM은 확정된 원석 정보에 근거한 설명·위로 카피 생성과 안전 분류만 수행한다([docs/08-recommendation-engine.md](docs/08-recommendation-engine.md#llm과-규칙-엔진의-역할-분리)).

## 의료·심리 진단 및 미래 예언 금지

- 의료·심리 진단, 치료·예방 효과 주장, 미래 예언, 결과 보장, 결정론적 궁합 판정을 생성하는 프롬프트나 카피를 작성하지 않는다([docs/09-ai-prompts-and-safety.md](docs/09-ai-prompts-and-safety.md#ai의-금지-행위) 전체 목록 참조).
- 위기 표현(자해·자살·폭력·학대 암시) 감지 시 일반 원석 추천 대신 안전 안내로 라우팅하는 로직을 절대 우회하지 않는다.

## 테스트 없이 완료 선언 금지

- 관련 단위/통합/E2E 테스트가 작성되고 통과하지 않은 기능을 "완료"로 보고하지 않는다.
- [docs/10-testing-and-acceptance.md](docs/10-testing-and-acceptance.md#traceability-matrix)에서 해당 요구사항 ID에 연결된 테스트를 확인하고, 최소한 그 테스트들을 충족시킨다.

## 작업 완료 시 보고

작업을 완료로 보고할 때는 항상 다음을 포함한다.

1. **변경 파일**: 생성/수정/삭제한 파일 목록
2. **테스트 결과**: 실행한 테스트 명령과 통과/실패 결과(테스트를 실행하지 않았다면 그 사실을 명시)
3. **남은 위험**: 미해결 `추가 검증 필요` 항목, 알려진 제약, 후속 작업 제안

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 원석 큐레이터 (Gemstone Curator)

AI 원석 큐레이터 — "당신의 바람과 기운, 인연을 잇는 원석"

지금 바라는 변화와 마음 상태를 짧은 선택형 흐름으로 입력하면, 결정론적 규칙 엔진이 대표 원석 하나를 정해주고 AI가 위로와 작은 행동을 제안하는 모바일 우선 자기성찰 웹앱입니다. 제품/기술 설계 전체는 [docs/](docs/00-project-overview.md)에서 관리합니다.

## 현재 단계

**Phase 1(MVP) 완료 + Phase 2(오행 분석·공유·보관함, 계정 없이) 구현, Phase 3는 보류.**

- **Phase 1**: 비회원 기본 소원 → 원석 추천 전체 흐름(S01~S05)이 API(`POST /sessions`, `GET /catalog/wishes`, `POST /recommendations/basic`, `GET /recommendations/{id}`, `POST /recommendations/{id}/feedback`)와 함께 동작합니다. 결정론적 추천 엔진, 실제 OpenAI 연동(구조화 출력 + fallback), 이중 안전망(위기 표현 감지), PostgreSQL(Prisma) 저장, 단위/통합/E2E 테스트가 모두 구현되어 있습니다.
- **Phase 2**: 오행 분석(S06~S08), 공유 링크(S13), 보관함·개인정보 설정(S14, `/library`)까지 전부 **계정/로그인 없이** 비회원 세션(브라우저 `localStorage`) 기반으로 구현했습니다. 계정/로그인(FR-FIVE-005)은 사용자가 명시적으로 "로그인 없이 사용" 방향을 선택해 **만들지 않기로 확정**했습니다([13-decisions-and-open-questions.md](docs/13-decisions-and-open-questions.md) 참조). 자기결정 데이터 삭제(`/privacy`, `DELETE /sessions/current`)와 만료 세션 정리(즉시 정리 + `npm run cleanup:sessions` 배치)도 구현되어 있습니다.
- **보류**: Phase 3(관계 원석, S09~S12)는 [AGENTS.md](AGENTS.md)의 Phase 게이팅 원칙에 따라 아직 착수하지 않았습니다.

## 문서 링크

| 문서                                                                     | 내용                                       |
| ------------------------------------------------------------------------ | ------------------------------------------ |
| [00. 프로젝트 개요](docs/00-project-overview.md)                         | 한 문장 정의, Phase 범위, 문서 탐색 허브   |
| [01. PRD](docs/01-prd.md)                                                | 요구사항 ID, 성공 지표, Definition of Done |
| [02. 정보 구조](docs/02-information-architecture.md)                     | 사이트맵, URL 구조, 접근 권한              |
| [03. 사용자 흐름](docs/03-user-flows.md)                                 | 핵심 흐름 Mermaid 다이어그램               |
| [04. 화면 명세](docs/04-screen-specifications.md)                        | S01~S14 상세 명세                          |
| [05. 디자인 시스템](docs/05-design-system.md)                            | 토큰, 컴포넌트, 접근성                     |
| [06. 데이터베이스 스키마](docs/06-database-schema.md)                    | ERD, Prisma 스키마, DDL                    |
| [07. API 명세](docs/07-api-specification.md)                             | REST API 상세                              |
| [08. 추천 엔진](docs/08-recommendation-engine.md)                        | 결정론적 원석 선정 로직                    |
| [09. AI 프롬프트·안전](docs/09-ai-prompts-and-safety.md)                 | LLM 역할, 프롬프트, 안전 규칙              |
| [10. 테스트·수용 기준](docs/10-testing-and-acceptance.md)                | 테스트 전략, traceability matrix           |
| [11. 구현 로드맵](docs/11-implementation-roadmap.md)                     | Phase 1 9단계 작업 순서                    |
| [12. 개인정보·보안·컴플라이언스](docs/12-privacy-security-compliance.md) | 데이터 분류, 암호화, 법률 체크리스트       |
| [13. 결정 사항·미해결 질문](docs/13-decisions-and-open-questions.md)     | 확정 결정, ADR 후보                        |
| [AGENTS.md](AGENTS.md)                                                   | 코딩 에이전트 작업 규칙                    |

## 기술 스택 (실측, `package.json` 기준)

- Next.js App Router `16.3.4` (Turbopack), React `19.2.8`, TypeScript strict mode
- Tailwind CSS v4 — CSS-first `@theme` 토큰(`src/app/globals.css`), `tailwind.config.ts` 없음
- PostgreSQL + Prisma ORM `7.10.0` — Prisma 7부터 `schema.prisma`에 `datasource.url`을 쓸 수 없어 `prisma.config.ts` + `@prisma/adapter-pg`(`pg`) 드라이버 어댑터를 사용([11-implementation-roadmap.md](docs/11-implementation-roadmap.md#실제-구현-참고-phase-1-착수-후-확정된-사항) 참조)
- Zod (요청 검증)
- OpenAI SDK (`openai` 패키지) — `LLMProvider` 인터페이스([09-ai-prompts-and-safety.md](docs/09-ai-prompts-and-safety.md)) 뒤에서 교체 가능하도록 구현, 실제 구현체는 `src/lib/llm/openaiProvider.ts`
- Vitest + React Testing Library (단위/통합 테스트, 기본 실행 환경은 `node`)
- Playwright (E2E 테스트)
- 패키지 매니저: **npm**(저장소의 기존 `package-lock.json`을 그대로 사용하기로 확정, [13-decisions-and-open-questions.md](docs/13-decisions-and-open-questions.md) 갱신)

## 로컬 개발 구조 (실제)

```text
docs/                          # 제품·기술 설계 문서
prisma/                        # schema.prisma, prisma.config.ts, seed.ts, seed-data/*.json
src/app/                       # S01~S08, S13~S14, /privacy 화면
src/app/api/v1/                # sessions, catalog/wishes, recommendations/*, shares/*, share-links/* REST API
scripts/                       # 운영 스크립트 (만료 세션 정리 등)
src/lib/engine/                # 결정론적 추천 엔진 (basic / five-elements 컨텍스트)
src/lib/llm/                   # LLMProvider, OpenAI 구현체, 프롬프트, 검증기, fallback
src/lib/safety/                # 위기 표현 이중 안전망(키워드 + LLM 분류)
src/lib/crypto/                # 세션/공유 토큰 해시, envelope encryption(AES-256-GCM)
src/lib/fiveElements/          # 사주팔자·오행 계산 (lunar-javascript 기반)
src/lib/client/                # 브라우저 세션 부트스트랩, 흐름 상태(sessionStorage)
src/lib/analytics/             # 분석 이벤트 allowlist
src/components/                # 화면별 UI 컴포넌트
e2e/                           # Playwright E2E 스펙
```

## 환경 변수 이름

아래는 [12-privacy-security-compliance.md](docs/12-privacy-security-compliance.md)의 secret 관리 원칙에 따라 이름만 정의하며, 실제 값은 어떤 문서/코드에도 포함하지 않습니다.

| 변수명                         | 용도                                                                                                                                    |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                 | 앱 런타임 PostgreSQL 연결 문자열. 로컬에서는 개발 DB, Vercel Preview/Production에서는 관리형 DB가 제공한 **pooled** URL을 사용합니다. |
| `DATABASE_URL_TEST`            | 테스트용 별도 DB 연결 문자열. Vitest가 테스트 실행 중에만 `DATABASE_URL`로 대체합니다.                                                  |
| `SESSION_TOKEN_PEPPER`         | 세션 토큰 해시 생성용 pepper (임의의 긴 무작위 문자열, 직접 생성)                                                                       |
| `OPENAI_API_KEY`               | OpenAI API 키                                                                                                                           |
| `OPENAI_MODEL`                 | 사용할 OpenAI 모델명(직접 지정, 기본값 없음)                                                                                            |
| `OPENAI_REASONING_EFFORT`      | 추론 모델(GPT-5 계열 등) 사용 시 권장 `minimal`. 생략 가능                                                                              |
| `FORCE_LLM_FALLBACK_FOR_TESTS` | 테스트 전용. `1`로 설정 시 LLM 호출이 항상 실패하도록 강제(fallback 경로 재현). 프로덕션에서는 무시됨                                   |
| `SHADOW_DATABASE_URL`          | 로컬 `prisma migrate diff`/`dev`용 섀도 DB 연결 문자열(`createdb gemstonecurator_shadow`로 생성)                                      |
| `DIRECT_DATABASE_URL`          | 선택 사항. `prisma migrate deploy` 등 CLI migration이 우선 사용할 관리형 DB의 direct URL입니다. 없으면 기존처럼 `DATABASE_URL`을 사용합니다. |
| `ENCRYPTION_KEK`               | 생년월일시 등 민감 필드 envelope encryption용 KEK. base64 인코딩된 32바이트 키(직접 생성, 실제 운영은 KMS 전환 필요 — `추가 검증 필요`) |
| `NEXT_PUBLIC_APP_URL`          | 공유 링크 URL 생성 시 사용(미설정 시 요청 origin으로 대체)                                                                              |

값은 `.env.local`에 직접 채우며(`.env.example`을 복사해서 시작), 절대 커밋하지 않습니다.

`DATABASE_URL`과 `DIRECT_DATABASE_URL`은 서버 전용 secret입니다. 이름에 `NEXT_PUBLIC_` 접두사를 붙이거나 브라우저 코드에서 읽으면 안 됩니다.

## 개발 원칙

- 원석 선정은 항상 [결정론적 규칙 엔진](docs/08-recommendation-engine.md)이 담당하며 LLM은 원석을 선택하거나 변경하지 않습니다.
- 첫 결과(S05)까지는 회원가입이나 생년월일시 입력을 요구하지 않습니다.
- 생년월일시, 자유 입력, 상대방 별명 등 민감 정보는 [12-privacy-security-compliance.md](docs/12-privacy-security-compliance.md)의 암호화·비저장 원칙을 따릅니다.
- Phase 1 완료(CI 품질 게이트 통과) 전에는 Phase 2, Phase 3 기능을 구현하지 않습니다([11-implementation-roadmap.md](docs/11-implementation-roadmap.md)).
- 모든 신규 코드는 TDD로 작성하며 테스트 없이 완료를 선언하지 않습니다.

## 로컬 개발 시작 방법

1. PostgreSQL을 준비합니다 (예: `brew install postgresql@16 && brew services start postgresql@16`), `createdb gemstonecurator_dev`, `createdb gemstonecurator_test`, `createdb gemstonecurator_shadow`.
2. `.env.example`을 참고해 `.env.local`을 만들고 `DATABASE_URL`, `SHADOW_DATABASE_URL`, `SESSION_TOKEN_PEPPER`, `ENCRYPTION_KEK`, `OPENAI_API_KEY`, `OPENAI_MODEL`(필요 시 `OPENAI_REASONING_EFFORT`)을 채웁니다.
3. `npm install`
4. `npm run prisma:migrate` — 스키마 마이그레이션 적용
5. `npm run prisma:seed` — 원석/태그 시드 데이터 적재(`prisma/seed-data/*.json`, 전문가 검수 전 초안)
6. `npm run dev` 로 개발 서버 실행 후 `http://localhost:3000`에서 확인

```bash
npm run dev              # 개발 서버 실행
npm run build             # 프로덕션 빌드
npm run start              # 프로덕션 서버 실행
npm run lint                # ESLint
npm run typecheck            # TypeScript strict 타입 체크
npm run prisma:migrate        # Prisma 마이그레이션 적용
npm run prisma:seed            # 시드 데이터 적재
npm run cleanup:sessions        # 만료된 비회원 세션 일괄 삭제(운영 스케줄러 연동은 추가 검증 필요)
```

## Vercel 관리형 PostgreSQL 배포

이 프로젝트는 `@prisma/adapter-pg`와 Node.js 런타임을 사용합니다. `src/lib/db.ts`는 모듈 import나 `next build` 중에는 DB 클라이언트를 만들지 않고, 실제 Prisma 쿼리가 처음 실행될 때만 `DATABASE_URL`을 읽습니다. 따라서 Vercel 빌드 명령에는 migration이나 seed를 추가하지 마십시오.

1. Vercel Marketplace에서 Neon 등 PostgreSQL 서비스를 프로젝트에 연결하고 Preview와 Production에 사용할 DB/브랜치를 준비합니다. Marketplace 연동이 환경변수를 자동 주입하더라도, 아래 변수명이 프로젝트에 실제로 설정됐는지 확인합니다.
2. Vercel 프로젝트의 **Settings → Environment Variables**에서 Preview와 Production 각각의 `DATABASE_URL`을 서비스가 제공한 **pooled connection URL**로 설정합니다. Neon은 연결 상세에서 **Pooled connection**을 선택하며, 해당 hostname에는 일반적으로 `-pooler`가 포함됩니다. URL은 Vercel UI에만 입력하고 저장소·이슈·로그에 복사하지 않습니다.
3. 선택 사항으로, migration을 실행하는 제한된 로컬/CI 환경에만 같은 DB의 direct connection URL을 `DIRECT_DATABASE_URL`로 주입합니다. `prisma.config.ts`는 이 값을 우선 사용하고, 로컬 환경에서 이 값이 없으면 기존 `DATABASE_URL`을 그대로 사용합니다. `SHADOW_DATABASE_URL`은 로컬 `migrate dev`용이며 Vercel 런타임에는 필요하지 않습니다.
4. 배포 전에 DB 변경을 별도 작업으로 적용합니다. 비밀값을 명령줄 인수나 저장소 파일에 넣지 말고 secret environment에서 주입한 뒤 실행합니다.

   ```bash
   npx prisma migrate deploy
   ```

   `prisma migrate deploy`는 Vercel의 Build Command가 아니라, 권한이 제한된 운영자 또는 CI job에서 명시적으로 실행합니다. `DIRECT_DATABASE_URL`이 있으면 direct URL을, 없으면 `DATABASE_URL`을 사용합니다.

5. 최초 DB 준비 때만 seed를 별도로 실행합니다. `prisma/seed.ts`는 앱 런타임과 마찬가지로 `DATABASE_URL`을 읽습니다. 서비스가 direct URL을 제공하고 사용을 권장하면, 이 일회성 실행 프로세스의 `DATABASE_URL`에 direct URL을 안전하게 주입할 수 있습니다.

   ```bash
   npm run prisma:seed
   ```

   이 명령도 Vercel Build Command에 추가하지 않습니다. 운영 DB에 seed를 재실행하기 전에는 `prisma/seed.ts`의 upsert/비활성화 동작을 검토하십시오.

6. 환경변수를 저장한 뒤 각각 새 Preview 배포와 Production 배포를 생성합니다. Vercel의 함수 로그에 URL, 토큰, 사용자 입력 같은 secret 또는 개인정보를 출력하지 마십시오.

### 배포 후 DB 연결 확인

1. 배포된 사이트에서 새 비회원 세션을 만든 뒤, 브라우저 개발자 도구 또는 HTTP 클라이언트로 `POST /api/v1/sessions`를 호출해 받은 `sessionToken`을 보관합니다. 토큰은 로그·스크린샷·이슈에 남기지 않습니다.
2. 같은 배포 URL에서 `Authorization: Bearer <sessionToken>` 헤더를 넣어 `GET /api/v1/catalog/wishes`를 호출합니다. `wishes`, `emotions`, `relationshipGoals` 배열을 포함한 HTTP 200 응답이면 pooled 런타임 연결과 초기 seed를 함께 확인한 것입니다.
3. 500 응답이면 먼저 Vercel의 해당 환경(Preview 또는 Production)에 `DATABASE_URL`이 있는지, 그것이 pooled URL인지, 그리고 migration·seed가 해당 DB/브랜치에 적용됐는지 확인합니다. `DATABASE_URL 환경변수가 설정되지 않았습니다.` 오류는 런타임 환경변수 미설정을 뜻합니다. 반대로 이 메시지가 아니라 Prisma 또는 PostgreSQL 연결 오류가 첫 쿼리에서 발생하면 URL은 주입됐지만 pooled URL·TLS 옵션·DB/브랜치 접근 권한·서비스 상태를 확인해야 합니다. URL 전체나 credential은 로그에 남기지 않습니다.

Phase 2/3 착수 전에는 [AGENTS.md](AGENTS.md)와 [11. 구현 로드맵](docs/11-implementation-roadmap.md)을 먼저 확인하세요.

## 테스트 명령어

```bash
npm test                 # 단위 + 통합 테스트 (Vitest, 기본은 real Postgres 대상 DATABASE_URL_TEST 사용, LLM은 모킹)
npm run test:watch        # watch 모드
npm run test:e2e           # E2E 테스트 (Playwright, 실행 중인 dev 서버를 재사용하거나 격리된 .next-e2e 빌드로 자체 기동)
RUN_LIVE_LLM_TESTS=1 npm test -- route.live   # 실제 OpenAI API를 호출하는 opt-in 라이브 통합 테스트(기본 실행에서는 스킵)
```

## 보안 주의사항

- 실제 API 키, DB 자격증명, 암호화 키 등 secret은 코드, 문서, 커밋 메시지 어디에도 포함하지 마십시오. 환경변수로만 주입합니다.
- 생년월일시, 자유 입력 원문, 상대방 별명, 세션/공유 토큰 원문은 로그에 기록하지 마십시오([12-privacy-security-compliance.md](docs/12-privacy-security-compliance.md#로그-redaction)).
- 원석 선정 로직을 LLM에 위임하는 변경은 제품 핵심 원칙 위반이므로 허용하지 않습니다.
- 개인정보 관련 기능(오행 분석, 관계 정보)을 구현할 때는 반드시 [12-privacy-security-compliance.md](docs/12-privacy-security-compliance.md)를 먼저 확인하십시오.

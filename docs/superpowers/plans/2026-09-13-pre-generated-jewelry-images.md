# Pre-generated Gemstone Jewelry Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 23 active gemstone specimen photos with a cohesive, pre-generated sterling-silver necklace collection while preserving deterministic recommendations and providing accessible loading fallbacks.

**Architecture:** Generate and review one square static PNG per stone at development time, store it under `public/images/jewelry/`, and keep the existing `Stone.imageUrl` API contract. Enhance the shared `StoneAvatar` so every current consumer gets descriptive alternative text, a visible generated-image disclosure, and a color fallback without adding runtime image generation or changing the recommendation engine.

**Tech Stack:** Next.js 16.3.4 App Router, React 19.2.8, TypeScript strict, `next/image`, Prisma 7 seed JSON, Vitest 5, Testing Library, Playwright, built-in `imagegen`.

**Spec:** `docs/superpowers/specs/2026-09-13-pre-generated-jewelry-images-design.md`

## Global Constraints

- Read `docs/00-project-overview.md`, the relevant sections of `docs/01-prd.md`, `docs/04-screen-specifications.md`, `docs/09-ai-prompts-and-safety.md`, `docs/10-testing-and-acceptance.md`, `docs/11-implementation-roadmap.md`, and `docs/12-privacy-security-compliance.md` before execution.
- Read `node_modules/next/dist/docs/01-app/01-getting-started/12-images.md` before editing `StoneAvatar`.
- Preserve all pre-existing user changes. Before each task, run `git status --short` and `git diff -- <paths>`; never stage a file that was already modified or untracked before this feature unless the user explicitly authorizes it.
- There are exactly 23 active stones in `prisma/seed-data/stones.json`; every slug must have one reviewed PNG.
- Store final assets at `public/images/jewelry/{stone-slug}.png`; do not delete or overwrite `public/images/stones/`.
- Use one built-in image-generation call per stone. Do not use a runtime image API, user data, wish data, emotion data, birth data, relationship data, text, logos, or watermarks.
- Keep the recommendation engine, scoring weights, tie-break rules, `rulesetVersion`, LLM copy pipeline, and API response shape unchanged.
- All necklaces use a coherent 925 sterling-silver bezel and chain, warm ivory backdrop, soft upper-left daylight, centered square composition, and enough safe area for a 128px circular crop.
- The visible disclosure copy is exactly `AI로 생성한 주얼리 예시 이미지이며 실제 판매 상품이 아니에요.`
- The image alternative text is exactly `{원석명} 실버 펜던트 목걸이`.

---

### Task 1: Synchronize the canonical product documentation

**Files:**
- Modify: `docs/01-prd.md`
- Modify: `docs/04-screen-specifications.md`
- Modify: `docs/10-testing-and-acceptance.md`
- Modify: `docs/13-decisions-and-open-questions.md`

**Interfaces:**
- Consumes: approved design in `docs/superpowers/specs/2026-09-13-pre-generated-jewelry-images-design.md`
- Produces: `FR-BASIC-016` and `ASSET-01`, the requirement and test IDs used by later tasks

- [ ] **Step 1: Record the existing user-owned diffs**

Run:

```bash
git status --short -- docs/01-prd.md docs/04-screen-specifications.md docs/10-testing-and-acceptance.md docs/13-decisions-and-open-questions.md
git diff -- docs/01-prd.md docs/04-screen-specifications.md docs/10-testing-and-acceptance.md docs/13-decisions-and-open-questions.md
```

Expected: the first, second, and fourth files may already contain unrelated changes. Preserve every existing hunk.

- [ ] **Step 2: Add the exact Phase 1 requirement**

Add this row after `FR-BASIC-015` in `docs/01-prd.md`:

```markdown
| FR-BASIC-016 | 결과 화면은 추천 원석을 검수된 사전 생성 실버 펜던트 목걸이 이미지로 표시하고, 생성 이미지 및 비판매 상품 안내와 이미지 실패 fallback을 제공한다 | P1 | 1 | S05 | `POST /recommendations/basic`, `GET /recommendations/{id}` | ASSET-01, E2E-01 |
```

Include `FR-BASIC-016` in the Phase 1 scope sentence.

- [ ] **Step 3: Extend S05 without changing its existing flow**

In `docs/04-screen-specifications.md`, change the S05 wireframe label from `[원석 이미지/카드]` to `[원석 목걸이 이미지/카드]`. Add these S05 acceptance criteria after the existing criteria:

```markdown
7. 추천 원석은 원석별로 검수된 사전 생성 실버 펜던트 목걸이 이미지로 표시된다.
8. 이미지 가까이에 "AI로 생성한 주얼리 예시 이미지이며 실제 판매 상품이 아니에요." 안내가 표시된다.
9. 이미지 URL 누락 또는 로딩 실패 시 원석의 `colorHex` 기반 fallback을 표시하되 나머지 결과와 CTA는 계속 이용할 수 있다.
10. 이미지 대체 텍스트는 "{원석명} 실버 펜던트 목걸이" 형식이다.
```

- [ ] **Step 4: Add traceability and the product decision**

Add `ASSET-01` to the test catalog in `docs/10-testing-and-acceptance.md` with the scenario “활성 원석 23종의 seed URL, PNG 파일 존재, 정사각형 크기, slug 일치를 검증한다.” Add this traceability row:

```markdown
| FR-BASIC-016 | S05 | `POST /recommendations/basic`, `GET /recommendations/{id}` | ASSET-01, E2E-01 |
```

Add this decision row to `docs/13-decisions-and-open-questions.md`:

```markdown
| 추천 원석 이미지는 요청마다 생성하지 않고 원석 23종별 실버 펜던트 목걸이 PNG를 사전 생성·검수해 정적 제공한다 | 추천 응답의 속도·비용·시각 일관성을 지키고 추천 엔진의 결정론과 사용자 개인정보 분리를 유지 | 추천마다 실시간 생성(미채택 — 지연·비용·결과 편차·개인정보 전달 위험) |
```

- [ ] **Step 5: Validate documentation consistency**

Run:

```bash
rg -n "FR-BASIC-016|ASSET-01|AI로 생성한 주얼리 예시 이미지" docs/01-prd.md docs/04-screen-specifications.md docs/10-testing-and-acceptance.md docs/13-decisions-and-open-questions.md
git diff --check -- docs/01-prd.md docs/04-screen-specifications.md docs/10-testing-and-acceptance.md docs/13-decisions-and-open-questions.md
```

Expected: all three identifiers/copy checks are present in their intended documents, and `git diff --check` has no output.

- [ ] **Step 6: Commit only when ownership is clean**

If none of these files was dirty in Step 1:

```bash
git add docs/01-prd.md docs/04-screen-specifications.md docs/10-testing-and-acceptance.md docs/13-decisions-and-open-questions.md
git commit -m "docs: specify generated jewelry result images"
```

If any file was already dirty, do not stage or commit the documentation; leave the preserved combined diff for the final report.

---

### Task 2: Define the asset contract with a failing test

**Files:**
- Modify: `prisma/seedSchemas.test.ts`
- Modify later in Task 3: `prisma/seed-data/stones.json`
- Create later in Task 3: `public/images/jewelry/*.png`

**Interfaces:**
- Consumes: `StonesFileSchema.parse(input: unknown)` from `prisma/seedSchemas.ts`
- Produces: ASSET-01 executable contract for 23 `/images/jewelry/{slug}.png` square PNGs

- [ ] **Step 1: Add filesystem imports and a PNG dimension reader**

At the top of `prisma/seedSchemas.test.ts`, extend the imports and add this focused helper below `readJson`:

```ts
import { existsSync, readFileSync } from "node:fs";

function readPngDimensions(filePath: string): { width: number; height: number } {
  const bytes = readFileSync(filePath);
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(bytes.subarray(0, 8)).toEqual(pngSignature);
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}
```

Merge `readFileSync` into the existing import instead of creating a duplicate import.

- [ ] **Step 2: Write the failing ASSET-01 test**

Add this test inside the existing `describe` block:

```ts
it("ASSET-01: 활성 원석마다 slug와 일치하는 정사각형 주얼리 PNG가 있다", () => {
  const parsed = StonesFileSchema.parse(readJson("stones.json"));
  expect(parsed.stones).toHaveLength(23);

  for (const stone of parsed.stones) {
    const expectedUrl = `/images/jewelry/${stone.slug}.png`;
    expect(stone.imageUrl).toBe(expectedUrl);

    const assetPath = path.join(process.cwd(), "public", expectedUrl);
    expect(existsSync(assetPath), `${stone.slug} 이미지가 없습니다`).toBe(true);

    const { width, height } = readPngDimensions(assetPath);
    expect(width, `${stone.slug} 이미지가 정사각형이 아닙니다`).toBe(height);
    expect(width, `${stone.slug} 이미지가 너무 작습니다`).toBeGreaterThanOrEqual(1024);
  }
});
```

- [ ] **Step 3: Run the test and confirm the intended failure**

Run:

```bash
npx vitest run prisma/seedSchemas.test.ts
```

Expected: FAIL because current URLs use `/images/stones/*.jpg` and `public/images/jewelry/` does not yet contain all 23 assets.

- [ ] **Step 4: Do not commit the red state**

Keep the failing test uncommitted until Task 3 supplies every asset and updates the seed URLs.

---

### Task 3: Generate, inspect, and connect the 23 necklace assets

**Files:**
- Create: `public/images/jewelry/rose-quartz.png`
- Create: `public/images/jewelry/amethyst.png`
- Create: `public/images/jewelry/clear-quartz.png`
- Create: `public/images/jewelry/green-aventurine.png`
- Create: `public/images/jewelry/chalcedony.png`
- Create: `public/images/jewelry/larimar.png`
- Create: `public/images/jewelry/aquamarine.png`
- Create: `public/images/jewelry/amazonite.png`
- Create: `public/images/jewelry/turquoise.png`
- Create: `public/images/jewelry/jade.png`
- Create: `public/images/jewelry/jadeite.png`
- Create: `public/images/jewelry/prehnite.png`
- Create: `public/images/jewelry/strawberry-quartz.png`
- Create: `public/images/jewelry/lapis-lazuli.png`
- Create: `public/images/jewelry/garnet.png`
- Create: `public/images/jewelry/emerald.png`
- Create: `public/images/jewelry/pearl.png`
- Create: `public/images/jewelry/ruby.png`
- Create: `public/images/jewelry/peridot.png`
- Create: `public/images/jewelry/sapphire.png`
- Create: `public/images/jewelry/opal.png`
- Create: `public/images/jewelry/topaz.png`
- Create: `public/images/jewelry/onyx.png`
- Modify: `prisma/seed-data/stones.json`
- Test: `prisma/seedSchemas.test.ts`

**Interfaces:**
- Consumes: one stone slug and the visual descriptor table below
- Produces: a reviewed square PNG and seed URL for each of the 23 active stones

- [ ] **Step 1: Load the required image-generation skill and prepare the destination**

Read the current `imagegen` skill completely. Create `public/images/jewelry/` without deleting either existing image directory. Use the built-in image-generation path, not the CLI fallback.

- [ ] **Step 2: Establish Larimar as the collection anchor**

Generate `larimar` first with the shared prompt and its table row. Copy it to `public/images/jewelry/larimar.png`, inspect that local file, and accept it only if it passes every visual criterion. This accepted file becomes a **style/composition reference image**, not an edit target, for the remaining 22 calls.

- [ ] **Step 3: Use this shared prompt for every independent generation call**

Use one call per table row, substituting the exact `Stone` and `Gem appearance` values. For every stone after Larimar, include `public/images/jewelry/larimar.png` as the local style/composition reference and explicitly instruct the model to match only its silver tone, chain style, backdrop, camera angle, scale, and lighting while replacing the gemstone with the requested mineral.

```text
Use case: product-mockup
Asset type: gemstone recommendation result image
Primary request: Create one premium photorealistic necklace product photograph from the same cohesive jewelry collection.
Input images: for stones after Larimar, Image 1 is a style/composition reference only; do not preserve or repeat its Larimar gemstone.
Subject: a single natural-form polished {Stone} centerpiece showing {Gem appearance}, held in a minimal handcrafted 925 sterling-silver setting and attached to a fine silver chain.
Scene/backdrop: warm ivory seamless studio background with subtle pale-stone texture.
Composition/framing: square, centered three-quarter macro view; the entire pendant and enough chain are visible; keep the gemstone inside the central 60% safe area so a circular crop does not cut it off.
Lighting/mood: soft diffused daylight from upper left, controlled silver highlights, gentle grounded shadow, calm refined luxury.
Collection invariants: same silver tone, chain style, backdrop, camera angle, scale, and lighting across all 23 images; natural gemstone character rather than a perfectly identical pendant silhouette.
Constraints: recognizable mineral appearance; one necklace only; no other gemstones; no people; no hands; no packaging; no text; no logo; no watermark.
Avoid: oversaturation, plastic or glass appearance, impossible facets, fantasy glow, clutter, price tags, brand marks.
```

| Slug | Stone | Gem appearance |
|---|---|---|
| `rose-quartz` | Rose Quartz | translucent soft blush pink with milky clouding |
| `amethyst` | Amethyst | natural violet quartz with subtle lighter zoning |
| `clear-quartz` | Clear Quartz | colorless transparency with delicate veil inclusions |
| `green-aventurine` | Green Aventurine | muted leafy green with fine mineral shimmer |
| `chalcedony` | Blue Chalcedony | waxy, softly translucent pale blue with milky depth |
| `larimar` | Larimar | Caribbean sky blue and turquoise with organic cloudy white web patterns |
| `aquamarine` | Aquamarine | transparent pale sky blue with restrained natural inclusions |
| `amazonite` | Amazonite | opaque blue-green with irregular pale feldspar streaks |
| `turquoise` | Turquoise | opaque turquoise blue with restrained natural brown matrix |
| `jade` | Nephrite Jade | deep spinach green, softly translucent and finely mottled |
| `jadeite` | Jadeite | saturated emerald green with luminous translucent mottling |
| `prehnite` | Prehnite | pale apple green, cloudy and softly translucent |
| `strawberry-quartz` | Strawberry Quartz | translucent warm pink with fine red needle-like inclusions |
| `lapis-lazuli` | Lapis Lazuli | deep ultramarine blue with sparse natural golden pyrite flecks |
| `garnet` | Garnet | deep wine red with subtle transparency at thin edges |
| `emerald` | Emerald | rich natural green with believable garden-like inclusions |
| `pearl` | Pearl | naturally round luminous ivory nacre with soft orient; use a simple silver pearl pendant rather than forcing a cabochon shape |
| `ruby` | Ruby | vivid deep red with believable internal inclusions and restrained translucency |
| `peridot` | Peridot | transparent yellow-green to olive-green with natural inclusions |
| `sapphire` | Sapphire | deep royal blue with restrained transparency and natural inclusions |
| `opal` | Opal | milky white body with subtle pastel play-of-color |
| `topaz` | Golden Topaz | transparent warm golden amber with crisp natural depth |
| `onyx` | Black Onyx | glossy opaque black with extremely subtle natural banding |

- [ ] **Step 4: Persist each generated result non-destructively**

After each call returns, copy its generated PNG from the reported `$CODEX_HOME/generated_images/...` path to the exact corresponding `public/images/jewelry/{slug}.png` path. If a destination unexpectedly exists, create a sibling review file and stop for user direction instead of overwriting it.

- [ ] **Step 5: Inspect all 23 images**

Open every final local PNG with `view_image`. For each image verify mineral recognizability, one sterling-silver necklace, consistent collection styling, central circular-crop safety, and absence of every forbidden element. Regenerate only a failed asset with one targeted correction and re-inspect it.

- [ ] **Step 6: Update only the seed image URLs**

In `prisma/seed-data/stones.json`, change each of the 23 `imageUrl` values from `/images/stones/{slug}.jpg` to `/images/jewelry/{slug}.png`. Do not change summaries, descriptions, elements, ordering, or the `_note` except to replace its image-source claim with: `imageUrl은 서비스용으로 사전 생성·검수한 주얼리 예시 이미지이며 실제 판매 상품이 아닙니다.`

- [ ] **Step 7: Run ASSET-01 and schema validation**

Run:

```bash
npx vitest run prisma/seedSchemas.test.ts
```

Expected: all seed schema tests and ASSET-01 PASS; 23 URLs match 23 square PNGs with width at least 1024.

- [ ] **Step 8: Review the seed diff for accidental content changes**

Run:

```bash
git diff --word-diff=plain -- prisma/seed-data/stones.json
git diff --check -- prisma/seed-data/stones.json prisma/seedSchemas.test.ts
```

Expected: feature-owned changes are limited to `_note` and 23 `imageUrl` values. Pre-existing user changes remain byte-for-byte intact.

- [ ] **Step 9: Commit only cleanly owned files**

Always stage the new assets and the clean test file if it was clean at baseline:

```bash
git add public/images/jewelry prisma/seedSchemas.test.ts
```

Stage `prisma/seed-data/stones.json` only if it was clean before execution. If it was already dirty, leave it unstaged and report that constraint. Commit staged feature-owned files only:

```bash
git commit -m "feat: add generated gemstone necklace assets"
```

---

### Task 4: Make the shared image component accessible and resilient

**Files:**
- Create: `src/components/ui/StoneAvatar.test.tsx`
- Modify: `src/components/ui/StoneAvatar.tsx`

**Interfaces:**
- Consumes: existing props `{ imageUrl?: string | null; colorHex: string; alt: string; size?: number }`
- Produces: the same public props; `alt` is treated as the Korean stone name and expanded to `{alt} 실버 펜던트 목걸이`

- [ ] **Step 1: Write the failing component tests**

Create `src/components/ui/StoneAvatar.test.tsx`:

```tsx
// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StoneAvatar } from "./StoneAvatar";

describe("StoneAvatar", () => {
  it("주얼리 대체 텍스트와 생성 이미지 안내를 표시한다", () => {
    render(
      <StoneAvatar
        imageUrl="/images/jewelry/larimar.png"
        colorHex="#4FA8AE"
        alt="라리마"
      />,
    );

    expect(
      screen.getByRole("img", { name: "라리마 실버 펜던트 목걸이" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("AI로 생성한 주얼리 예시 이미지이며 실제 판매 상품이 아니에요."),
    ).toBeInTheDocument();
  });

  it("이미지 로딩 실패 시 색상 fallback으로 전환한다", () => {
    render(
      <StoneAvatar
        imageUrl="/images/jewelry/larimar.png"
        colorHex="#4FA8AE"
        alt="라리마"
      />,
    );

    fireEvent.error(screen.getByRole("img"));

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByTestId("stone-color-fallback")).toHaveStyle({
      backgroundColor: "#4FA8AE",
    });
    expect(
      screen.queryByText("AI로 생성한 주얼리 예시 이미지이며 실제 판매 상품이 아니에요."),
    ).not.toBeInTheDocument();
  });

  it("URL이 없으면 처음부터 색상 fallback만 표시한다", () => {
    render(<StoneAvatar imageUrl={null} colorHex="#4FA8AE" alt="라리마" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByTestId("stone-color-fallback")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests and confirm failure**

Run:

```bash
npx vitest run src/components/ui/StoneAvatar.test.tsx
```

Expected: FAIL because the current component uses the unexpanded alt, has no disclosure, and does not switch on `error`.

- [ ] **Step 3: Implement the minimal shared behavior**

Replace `src/components/ui/StoneAvatar.tsx` with this implementation, retaining the existing public prop contract:

```tsx
"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  imageUrl?: string | null;
  colorHex: string;
  alt: string;
  size?: number;
}

export function StoneAvatar({ imageUrl, colorHex, alt, size = 128 }: Props) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const hasUsableImage = Boolean(imageUrl) && failedImageUrl !== imageUrl;

  return (
    <figure className="flex flex-col items-center gap-2">
      <div
        className="flex items-center justify-center overflow-hidden rounded-full"
        style={{ width: size, height: size, backgroundColor: `${colorHex}33` }}
      >
        {hasUsableImage && imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${alt} 실버 펜던트 목걸이`}
            width={size}
            height={size}
            className="h-full w-full object-cover"
            onError={() => setFailedImageUrl(imageUrl)}
          />
        ) : (
          <div
            aria-hidden="true"
            data-testid="stone-color-fallback"
            className="rounded-full"
            style={{
              width: size * 0.625,
              height: size * 0.625,
              backgroundColor: colorHex,
            }}
          />
        )}
      </div>
      {hasUsableImage ? (
        <figcaption className="max-w-64 text-center text-xs text-text-secondary">
          AI로 생성한 주얼리 예시 이미지이며 실제 판매 상품이 아니에요.
        </figcaption>
      ) : null}
    </figure>
  );
}
```

- [ ] **Step 4: Run focused tests**

Run:

```bash
npx vitest run src/components/ui/StoneAvatar.test.tsx prisma/seedSchemas.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Run strict checks**

Run:

```bash
npm run typecheck
npm run lint
```

Expected: both commands exit 0; no `any`, non-null assertion, or relaxed strict option is introduced.

- [ ] **Step 6: Commit only if the component was not user-owned at baseline**

If `StoneAvatar.tsx` was clean and tracked before execution:

```bash
git add src/components/ui/StoneAvatar.tsx src/components/ui/StoneAvatar.test.tsx
git commit -m "feat: add resilient jewelry image presentation"
```

If it was already modified or untracked, do not stage either file; preserve the combined worktree state and report it at handoff.

---

### Task 5: Lock the result contract in API and browser tests

**Files:**
- Modify: `src/app/api/v1/recommendations/[id]/route.test.ts`
- Modify: `e2e/basic-flow.spec.ts`

**Interfaces:**
- Consumes: `GET /api/v1/recommendations/{id}` and the shared `StoneAvatar`
- Produces: API-04 and E2E-01 regression coverage for the jewelry URL, accessible name, and disclosure

- [ ] **Step 1: Add the API response assertion**

In the existing “소유자는 자신의 결과를 조회할 수 있다” test, after asserting `body.stone.nameKo`, add:

```ts
expect(body.stone.imageUrl).toBe(`/images/jewelry/${body.stone.slug}.png`);
```

If the response currently omits `stone.slug`, first add `expect(body.stone.slug).toBeTruthy()`; do not change the route because it already returns `slug`.

- [ ] **Step 2: Seed the test database and run the focused API test**

Run:

```bash
npm run prisma:seed
npx vitest run 'src/app/api/v1/recommendations/[id]/route.test.ts'
```

Expected: PASS and the returned image URL uses the jewelry path. If the environment lacks `DATABASE_URL_TEST`, report the environment blocker without pointing tests at a production database.

- [ ] **Step 3: Extend E2E-01 with the visible contract**

After the result URL wait in `e2e/basic-flow.spec.ts`, add:

```ts
await expect(
  page.getByRole("img", { name: /실버 펜던트 목걸이$/ }),
).toBeVisible({ timeout: 30_000 });
await expect(
  page.getByText("AI로 생성한 주얼리 예시 이미지이며 실제 판매 상품이 아니에요."),
).toBeVisible();
```

- [ ] **Step 4: Run E2E-01**

Run:

```bash
npx playwright test e2e/basic-flow.spec.ts
```

Expected: PASS at the configured browser viewport with the necklace image and disclosure visible.

- [ ] **Step 5: Commit cleanly owned regression tests**

If both files were clean at baseline:

```bash
git add src/app/api/v1/recommendations/[id]/route.test.ts e2e/basic-flow.spec.ts
git commit -m "test: cover recommendation jewelry images"
```

Otherwise leave pre-existing dirty files unstaged and report them.

---

### Task 6: Perform final visual and quality verification

**Files:**
- Verify: `public/images/jewelry/*.png`
- Verify: all files changed in Tasks 1–5

**Interfaces:**
- Consumes: complete feature worktree
- Produces: evidence for FR-BASIC-016, ASSET-01, E2E-01, TypeScript strict, and the existing CI gate

- [ ] **Step 1: Verify exact asset inventory**

Run:

```bash
find public/images/jewelry -maxdepth 1 -type f -name '*.png' | sort
find public/images/jewelry -maxdepth 1 -type f -name '*.png' | wc -l
```

Expected: the sorted list contains the 23 exact slugs from Task 3 and the count is `23`.

- [ ] **Step 2: Re-open final assets after any regeneration**

Use `view_image` for every file in `public/images/jewelry/`. Confirm the final saved files—not default generated-image copies—meet the visual checklist. Record any remaining stylistic mismatch as unresolved instead of declaring completion.

- [ ] **Step 3: Run the complete automated verification set**

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npx playwright test e2e/basic-flow.spec.ts e2e/keyboard-only.spec.ts e2e/viewport.spec.ts
```

Expected: every command exits 0. The focused E2E set covers the core result, keyboard flow, and mobile layout; if the required test database or browser service is unavailable, report the exact failed command and output.

- [ ] **Step 4: Audit the final diff and protected files**

Run:

```bash
git status --short
git diff --check
git diff --stat
git diff -- prisma/seed-data/stones.json src/components/ui/StoneAvatar.tsx
```

Expected: no whitespace errors, no deleted specimen photos, no recommendation-engine changes, no secret or personal data, and all pre-existing user changes remain present.

- [ ] **Step 5: Report completion using repository policy**

The handoff must list every created/modified/deleted file, every test command with pass/fail status, and remaining risks such as visual assets needing product-owner review or files intentionally left uncommitted to preserve pre-existing changes. Do not call the feature complete if a required test or any of the 23 asset checks fails.

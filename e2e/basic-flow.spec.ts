import { expect, test } from "@playwright/test";
import { waitForCatalogLoaded } from "./helpers";

/**
 * E2E-01: 비회원 사용자가 S01부터 S05까지 완료한다.
 * docs/10-testing-and-acceptance.md#e2e-테스트
 */
test("비회원이 랜딩부터 기본 결과까지 완료한다", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: /내 염원으로 추천받기/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /내 사주로 추천받기/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /관계의 사주로 추천받기/ }),
  ).toBeVisible();

  // 소원/감정만으로 받는 기본 추천(S02~S05)은 메인 화면의 3가지 진입 버튼에는
  // 더 이상 직접 노출되지 않지만(오행/관계 진입에서 내부적으로만 재사용),
  // 경로 자체와 기능은 그대로 유지되므로 URL로 직접 검증한다.
  await page.goto("/wish");
  await waitForCatalogLoaded(page);

  await page.locator("fieldset label").first().click();
  await page.getByRole("button", { name: "다음" }).click();

  await page.waitForURL("**/heart");
  await waitForCatalogLoaded(page);
  await page.locator("fieldset label").first().click();
  await page.getByRole("button", { name: "결과 보기" }).click();

  await page.waitForURL(/\/result\/(?!new)/, { timeout: 30_000 });
  await expect(page.getByText("마음 요약")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("추천 이유")).toBeVisible();
  await expect(page.getByText("위로의 말")).toBeVisible();
  await expect(page.getByText("오늘의 작은 행동")).toBeVisible();
  await expect(page.getByText("이 결과가 도움이 됐나요?")).toBeVisible();
});

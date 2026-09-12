import { expect, test } from "@playwright/test";
import { waitForCatalogLoaded } from "./helpers";

/**
 * E2E-01: 비회원 사용자가 S01부터 S05까지 완료한다.
 * docs/10-testing-and-acceptance.md#e2e-테스트
 */
test("비회원이 랜딩부터 기본 결과까지 완료한다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("지금 시작하기")).toBeVisible();

  await page.getByText("지금 시작하기").click();
  await page.waitForURL("**/wish");
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

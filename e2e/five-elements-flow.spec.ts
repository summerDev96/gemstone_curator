import { expect, test } from "@playwright/test";
import { waitForCatalogLoaded } from "./helpers";

/**
 * E2E-05: 출생시간 미상으로 오행 분석을 완료한다.
 */
test("출생시간 미상으로 오행 분석을 완료한다", async ({ page }) => {
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

  await page.getByText("오행 분석 더 알아보기").click();
  await page.waitForURL("**/five-elements/intro");
  await page.getByText("안내를 읽었으며 동의합니다").click();
  await page.getByRole("button", { name: "동의하고 계속하기" }).click();

  await page.waitForURL("**/five-elements/birth-info");
  await page.getByLabel("연").fill("1990");
  await page.getByLabel("월").fill("6");
  await page.getByLabel("일").fill("15");
  await page.getByText("태어난 시간을 몰라요").click();
  await page.getByRole("button", { name: "오행 결과 보기" }).click();

  await page.waitForURL(/\/five-elements$/, { timeout: 30_000 });
  await expect(page.getByText("오행 균형")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("오행 기반 추천 이유")).toBeVisible();
});

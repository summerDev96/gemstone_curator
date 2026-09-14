import { expect, test } from "@playwright/test";
import { waitForCatalogLoaded } from "./helpers";

/**
 * Phase 3: 관계 원석(S09~S12) 골든 패스 — 나와 상대방의 생년월일시를 모두 입력해 완료한다.
 */
test("나와 상대방의 생년월일시를 모두 입력해 관계 원석 결과를 완료한다", async ({ page }) => {
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

  await page.getByText("관계 원석 알아보기").click();
  await page.waitForURL("**/relationship");
  await page.getByRole("button", { name: "시작하기" }).click();

  await page.getByLabel("상대방을 어떻게 부를까요?").fill("민지");
  await page.waitForSelector('input[name="relationshipGoal"]', { timeout: 15_000 });
  await page.locator('input[name="relationshipGoal"]').first().click();

  await page.getByLabel("나의 생년").fill("1996");
  await page.getByLabel("나의 생월").fill("4");
  await page.getByLabel("나의 생일").fill("12");
  await page.getByLabel("태어난 시간을 몰라요").first().check();

  await page.getByLabel("상대방 생년").fill("1998");
  await page.getByLabel("상대방 생월").fill("7");
  await page.getByLabel("상대방 생일").fill("20");
  await page.getByLabel("태어난 시간을 몰라요").last().check();

  await page.getByRole("button", { name: "우리의 원석 보기" }).click();

  await expect(page.getByText("대화를 시작해보세요")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("오늘의 작은 행동")).toBeVisible();
  await expect(page.getByText("나:")).toBeVisible();
  await expect(page.getByText("상대:")).toBeVisible();
});

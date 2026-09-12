import { expect, test } from "@playwright/test";
import { waitForCatalogLoaded } from "./helpers";

/**
 * 로그인 없이 같은 브라우저(localStorage 세션)에서 보관함을 통해
 * 과거 결과를 다시 볼 수 있는지 확인한다.
 */
test("결과 생성 후 보관함에서 다시 볼 수 있다", async ({ page }) => {
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
  const resultUrl = page.url();

  await page.getByRole("link", { name: "보관함" }).click();
  await page.waitForURL("**/library");
  await expect(page.getByText("아직 저장된 결과가 없어요")).not.toBeVisible();

  const historyLink = page.locator(`a[href="${new URL(resultUrl).pathname}"]`);
  await expect(historyLink).toBeVisible({ timeout: 10_000 });
  await historyLink.click();
  await page.waitForURL(resultUrl);
  await expect(page.getByText("마음 요약")).toBeVisible();
});

test("보관함 개인정보 설정 탭에서 데이터 삭제로 이동할 수 있다", async ({ page }) => {
  await page.goto("/library");
  await page.getByRole("tab", { name: "개인정보 설정" }).click();
  await page.getByRole("link", { name: "내 데이터 삭제" }).click();
  await page.waitForURL("**/privacy");
  await expect(page.getByText("내 데이터 삭제하기")).toBeVisible();
});

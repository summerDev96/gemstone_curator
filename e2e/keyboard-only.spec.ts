import { expect, test } from "@playwright/test";
import { waitForCatalogLoaded } from "./helpers";

/**
 * E2E-02: 키보드만으로 기본 추천(S01~S05)을 완료한다.
 * NFR-A11Y-002. 마우스 클릭 없이 포커스 이동과 키보드 입력만 사용한다.
 */
test("키보드만으로 S01~S05 흐름을 완료한다", async ({ page }) => {
  await page.goto("/");

  const startButton = page.getByRole("button", { name: /시작하는 중|지금 시작하기/ });
  await startButton.focus();
  await page.keyboard.press("Enter");

  await page.waitForURL("**/wish");
  await waitForCatalogLoaded(page);

  const firstWishInput = page.locator("fieldset input[type=radio]").first();
  await firstWishInput.focus();
  await page.keyboard.press("Space");
  await expect(firstWishInput).toBeChecked();

  const nextButton = page.getByRole("button", { name: "다음" });
  await expect(nextButton).toBeEnabled();
  await nextButton.focus();
  await page.keyboard.press("Enter");

  await page.waitForURL("**/heart");
  await waitForCatalogLoaded(page);

  const firstHeartInput = page.locator("fieldset input[type=radio]").first();
  await firstHeartInput.focus();
  await page.keyboard.press("Space");
  await expect(firstHeartInput).toBeChecked();

  const resultButton = page.getByRole("button", { name: "결과 보기" });
  await resultButton.focus();
  await page.keyboard.press("Enter");

  await page.waitForURL(/\/result\/(?!new)/, { timeout: 30_000 });
  await expect(page.getByText("마음 요약")).toBeVisible({ timeout: 30_000 });
});

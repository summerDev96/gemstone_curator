import { expect, test } from "@playwright/test";
import { waitForCatalogLoaded } from "./helpers";

/**
 * E2E-02: 키보드만으로 기본 추천(S01~S05)을 완료한다.
 * NFR-A11Y-002. 마우스 클릭 없이 포커스 이동과 키보드 입력만 사용한다.
 */
test("키보드만으로 S01~S05 흐름을 완료한다", async ({ page }) => {
  await page.goto("/");

  // 메인 화면의 3가지 진입 버튼이 키보드로 포커스 가능한지 확인한다(NFR-A11Y-002).
  const sajuButton = page.getByRole("button", { name: /내 사주로 추천받기/ });
  await sajuButton.focus();
  await expect(sajuButton).toBeFocused();

  // 소원/감정만으로 받는 기본 추천(S02~S05) 경로 자체는 그대로 유지되므로
  // (메인 화면에 더 이상 직접 노출되지 않을 뿐) URL로 이동해 이어서 검증한다.
  await page.goto("/wish");
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

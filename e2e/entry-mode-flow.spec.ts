import { expect, test } from "@playwright/test";

/**
 * 메인 화면의 3가지 추천 방식 분기(내 염원 / 내 사주 / 관계의 사주)를 검증한다.
 */
test.describe("메인 화면 추천 방식 분기", () => {
  test("내 염원으로 추천받기: 염원 선택 후 매핑된 원석 목록을 본다", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /내 염원으로 추천받기/ }).click();
    await page.waitForURL("**/desire");

    await page.getByRole("button", { name: /사랑/ }).click();
    await expect(page.getByText("가장 어울리는 원석")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("heading", { name: /터키석/ })).toBeVisible();
    await expect(page.getByText("마음 요약")).toBeVisible();
    await expect(page.getByText("위로의 말")).toBeVisible();
    await expect(page.getByText("그 외의 원석")).toBeVisible();
  });

  test("내 사주로 추천받기: 소원/감정 선택 없이 바로 생년월일 입력으로 간다", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /내 사주로 추천받기/ }).click();
    await page.waitForURL("**/five-elements/intro", { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /오행/ })).toBeVisible();
  });

  test("관계의 사주로 추천받기: 소원/감정 선택 없이 바로 관계 입력으로 간다", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /관계의 사주로 추천받기/ }).click();
    await page.waitForURL("**/relationship", { timeout: 15_000 });
  });
});

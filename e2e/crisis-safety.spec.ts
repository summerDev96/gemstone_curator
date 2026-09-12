import { expect, test } from "@playwright/test";
import { waitForCatalogLoaded } from "./helpers";

/**
 * E2E-04: 위기 표현 입력 시 일반 결과 대신 안전 안내가 표시된다.
 * docs/03-user-flows.md#7-위기-표현-감지와-안전-안내
 */
test("위기 표현을 입력하면 안전 안내 화면이 표시된다", async ({ page }) => {
  await page.goto("/wish");
  await waitForCatalogLoaded(page);
  await page.locator("fieldset label").first().click();
  await page.getByRole("button", { name: "다음" }).click();

  await page.waitForURL("**/heart");
  await waitForCatalogLoaded(page);
  await page.locator("fieldset label").first().click();
  await page.fill(
    "textarea",
    "요즘 너무 힘들어서 그냥 죽고 싶다는 생각이 들어요",
  );
  await page.getByRole("button", { name: "결과 보기" }).click();

  await expect(page.getByText("지금 많이 힘드셨겠어요")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(/109/)).toBeVisible();
  await expect(page.getByText("마음 요약")).not.toBeVisible();
});

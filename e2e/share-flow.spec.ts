import { expect, test } from "@playwright/test";
import { waitForCatalogLoaded } from "./helpers";

/**
 * E2E-07: 공유 결과에 민감정보가 포함되지 않는다.
 */
test("공유 링크를 생성하고 공개 페이지에서 개인정보 없이 확인한다", async ({
  page,
  context,
}) => {
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

  await page.getByRole("button", { name: "결과 공유하기" }).click();
  const linkLocator = page.getByText(/^http/);
  await expect(linkLocator).toBeVisible({ timeout: 10_000 });
  const linkText = await linkLocator.textContent();
  const url = linkText?.replace("링크가 복사됐어요: ", "").trim();
  expect(url).toBeTruthy();

  // 별도 시크릿 컨텍스트(비회원 세션 없음)로 공개 링크 접근
  const publicPage = await context.newPage();
  await publicPage.goto(url!);
  await expect(publicPage.getByText("나도 원석 추천받기")).toBeVisible({
    timeout: 10_000,
  });

  const html = await publicPage.content();
  for (const forbidden of ["birthDate", "1996-04-12", "sessionToken", "010-"]) {
    expect(html).not.toContain(forbidden);
  }
});

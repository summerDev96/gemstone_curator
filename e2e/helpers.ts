import type { Page } from "@playwright/test";

export async function waitForCatalogLoaded(page: Page) {
  await page.waitForSelector("fieldset label", { timeout: 15_000 });
}

import { expect, test } from "@playwright/test";

/**
 * E2E-09: 320px, 390px, 768px, 1440px에서 가로 스크롤이 없다.
 */
const VIEWPORTS = [
  { name: "320px (최소)", width: 320, height: 700 },
  { name: "390px (기본)", width: 390, height: 844 },
  { name: "768px (태블릿)", width: 768, height: 1024 },
  { name: "1440px (데스크톱)", width: 1440, height: 900 },
];

const PATHS = ["/", "/wish", "/heart"];

for (const viewport of VIEWPORTS) {
  for (const path of PATHS) {
    test(`${viewport.name}에서 ${path} 가로 스크롤 없음`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasHorizontalScroll).toBe(false);
    });
  }
}

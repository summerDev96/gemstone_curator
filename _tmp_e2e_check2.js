const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
  page.on("response", (r) => {
    if (r.url().includes("/api/") && r.status() >= 400) console.log("ERR RESP:", r.status(), r.url());
  });

  await page.goto("http://localhost:3001/");
  await page.getByRole("button", { name: /내 사주로 추천받기/ }).click();
  await page.waitForURL("**/five-elements/intro", { timeout: 15000 });
  await page.getByRole("button", { name: "시작하기" }).click().catch(() => {});
  await page.waitForURL("**/birth-info", { timeout: 15000 });
  await page.getByLabel("생년").fill("1996");
  await page.getByLabel("생월").fill("4");
  await page.getByLabel("생일").fill("12");
  await page.getByLabel("태어난 시간을 몰라요").check();
  await page.getByRole("checkbox", { name: /동의/ }).check().catch(() => {});
  await page.getByRole("button", { name: /결과 보기|다음|제출/ }).click();
  await page.waitForURL(/\/five-elements$/, { timeout: 30000 });
  await page.waitForSelector("text=마음 요약", { timeout: 15000 }).catch(() => {});
  console.log("Landed at:", page.url());
  const text = await page.locator("main").innerText();
  console.log(text.slice(0, 300));

  await browser.close();
})();

const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();

  // 1. Desire flow
  {
    const page = await browser.newPage();
    page.on("pageerror", (e) => console.log("PAGEERROR(desire):", e.message));
    await page.goto("http://localhost:3001/");
    await page.getByRole("button", { name: /내 염원으로 추천받기/ }).click();
    await page.waitForURL("**/desire");
    await page.getByRole("button", { name: /사랑/ }).click();
    await page.waitForSelector("text=이 마음에 어울리는 원석이에요", { timeout: 15000 });
    const names = await page.locator("main").innerText();
    console.log("DESIRE RESULT TEXT:\n", names.slice(0, 400));
    await page.close();
  }

  // 2. Saju direct entry
  {
    const page = await browser.newPage();
    page.on("pageerror", (e) => console.log("PAGEERROR(saju):", e.message));
    page.on("response", (r) => {
      if (r.url().includes("/api/") && r.status() >= 400) console.log("ERR RESP(saju):", r.status(), r.url());
    });
    await page.goto("http://localhost:3001/");
    await page.getByRole("button", { name: /내 사주로 추천받기/ }).click();
    await page.waitForURL("**/five-elements/intro", { timeout: 15000 });
    console.log("SAJU landed at:", page.url());
    await page.close();
  }

  // 3. Relationship direct entry
  {
    const page = await browser.newPage();
    page.on("pageerror", (e) => console.log("PAGEERROR(rel):", e.message));
    page.on("response", (r) => {
      if (r.url().includes("/api/") && r.status() >= 400) console.log("ERR RESP(rel):", r.status(), r.url());
    });
    await page.goto("http://localhost:3001/");
    await page.getByRole("button", { name: /관계의 사주로 추천받기/ }).click();
    await page.waitForURL("**/relationship", { timeout: 15000 });
    console.log("RELATIONSHIP landed at:", page.url());
    await page.close();
  }

  await browser.close();
  console.log("done");
})();

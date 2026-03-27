import { chromium, type Browser, type Page } from "playwright";

const baseUrl = process.env.TIANEZHA_BASE_URL?.trim();
const describeLive = baseUrl ? describe : describe.skip;

describeLive("live site audit", () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage({
      viewport: { height: 900, width: 1440 },
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  it("keeps the deployed homepage aligned with the merged Tianezha shell", async () => {
    await page.goto(baseUrl!, { waitUntil: "networkidle" });
    const text = await page.locator("body").innerText();

    expect(text).toContain("Tianezha");
    expect(text).toContain("BitClaw");
    expect(text).toContain("BolClaw");
    expect(text).toContain("Tianzi");
    expect(text).toContain("Nezha");
    expect(text).toContain("Tianshi");
    expect(text).toContain("GenDelve");
    expect(text).not.toContain("HeartBeat");
  });
});

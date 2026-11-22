import { test, expect } from "@playwright/test";

const VALID_WALLET = "CP6teSg2LUxQsSBBtwZ9xjG2aZjjznhfCvGED9LNgjrJ";

test.describe("Affiliates canonical routing, attribution & responsive UI", () => {
  test("redirects /afiliates and /afiliados with 301 preserving ?ref=", async ({ request }) => {
    for (const legacyPath of ["/afiliates", "/afiliados"]) {
      const res = await request.get(`${legacyPath}?ref=${VALID_WALLET}`, {
        maxRedirects: 0,
      });
      expect(res.status()).toBe(301);
      const location = res.headers()["location"] || "";
      expect(location).toContain("/affiliates");
      expect(location).toContain(`ref=${VALID_WALLET}`);
    }
  });

  test("captures valid ?ref= and rejects invalid ?ref= without overwriting", async ({ page }) => {
    await page.goto(`/affiliates?ref=${VALID_WALLET}`);
    const savedValid = await page.evaluate(() => localStorage.getItem("affiliateRef"));
    expect(savedValid).toContain(VALID_WALLET);

    await page.goto("/affiliates?ref=invalid_wallet_123");
    const afterInvalid = await page.evaluate(() => localStorage.getItem("affiliateRef"));
    expect(afterInvalid).toContain(VALID_WALLET);
  });

  test("has no horizontal scroll on 375px mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/affiliates");
    await expect(page.locator("h1")).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("generates affiliate link after manual wallet validation and confirmation", async ({
    page,
  }) => {
    await page.goto("/affiliates");
    const input = page.locator("#manual-affiliate-wallet");
    await input.fill(VALID_WALLET);
    await input.press("Enter");

    // Confirmation step appears before link is generated
    const confirmBtn = page.getByRole("button", { name: /confirm|confirmar/i });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    const generatedInput = page.locator("#affiliate-link");
    await expect(generatedInput).toBeVisible();
    await expect(generatedInput).toHaveValue(new RegExp(`\\?ref=${VALID_WALLET}$`));
  });
});

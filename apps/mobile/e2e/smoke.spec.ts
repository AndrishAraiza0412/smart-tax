import { expect, test } from "@playwright/test";

test("la app carga y redirige a login con sus campos", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/login/);
  await expect(page.locator("input").first()).toBeVisible();
  await expect(page.locator("input[type=password]")).toBeVisible();
});

import { expect, test } from "@playwright/test";

test("la app carga y redirige a login con sus campos", async ({ page }) => {
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
  page.on("console", (m) => m.type() === "error" && console.log("CONSOLE:", m.text()));
  // Supabase es falso en CI: que responda al instante en vez de colgar
  await page.route("**/mock.supabase.co/**", (r) => r.fulfill({ json: {} }));
  await page.goto("/");
  await expect(page).toHaveURL(/login/);
  await expect(page.locator("input").first()).toBeVisible();
  await expect(page.locator("input[type=password]")).toBeVisible();
});

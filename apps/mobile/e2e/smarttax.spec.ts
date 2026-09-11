import { expect, test } from "@playwright/test";

test("register, timbrar, sync Belvo, and show dashboard data", async ({ page }) => {
  await page.route("**/functions/v1/timbrado", async (route) => route.fulfill({ json: { success: true, uuid: "00000000-0000-0000-0000-000000000001", estado: "timbrado" } }));
  await page.route("**/functions/v1/timbrado/status/**", async (route) => route.fulfill({ json: { estado: "timbrado", xml_url: "https://storage.test/cfdi.xml", pdf_url: "https://storage.test/cfdi.pdf" } }));
  await page.route("**/functions/v1/belvo-webhook", async (route) => route.fulfill({ status: 200, json: { ok: true } }));
  await page.goto("/");
  await page.getByRole("link", { name: /registr/i }).click();
  await page.getByLabel(/email/i).fill(`e2e-${Date.now()}@example.com`);
  await page.getByLabel(/contraseña/i).fill("ValidPassword123!");
  await page.getByRole("button", { name: /registr/i }).click();
  await page.getByRole("link", { name: /gasto manual/i }).click();
  await page.getByLabel(/descripción/i).fill("Servicio profesional");
  await page.getByLabel(/rfc receptor/i).fill("AAA010101AAA");
  await page.getByLabel(/razón social/i).fill("Proveedor SA");
  await page.getByLabel(/código postal/i).fill("01000");
  await page.getByLabel(/total/i).fill("116");
  await page.getByRole("button", { name: /guardar y timbrar/i }).click();
  await expect(page.getByRole("button", { name: /descargar xml/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /descargar pdf/i })).toBeVisible();
  await page.getByRole("link", { name: /dashboard/i }).click();
  await expect(page.getByText("Servicio profesional")).toBeVisible();
});

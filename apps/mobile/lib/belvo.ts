/**
 * Integración con Belvo Sandbox (open banking México).
 *
 * `createLinkToken` genera un token de enlace de un solo uso y `openLink`
 * abre el widget de Belvo en el navegador para conectar cuentas bancarias.
 * Las transacciones llegan después vía webhook a la Edge Function
 * `belvo-webhook`, que las guarda como gastos en borrador.
 * Requiere `BELVO_SECRET_ID` y `BELVO_SECRET_PASSWORD` en el entorno.
 */
import { Linking } from "react-native";

const belvoBaseUrl = "https://sandbox.belvo.com";

type BelvoTokenResponse = { readonly access: string };

/** True when sandbox credentials are present (plain or EXPO_PUBLIC-prefixed). */
export function isBelvoConfigured(): boolean {
  const id = process.env["BELVO_SECRET_ID"] ?? process.env["EXPO_PUBLIC_BELVO_SECRET_ID"];
  const password = process.env["BELVO_SECRET_PASSWORD"] ?? process.env["EXPO_PUBLIC_BELVO_SECRET_PASSWORD"];
  return Boolean(id && password);
}

export async function createLinkToken(): Promise<string> {
  const id = process.env["BELVO_SECRET_ID"] ?? process.env["EXPO_PUBLIC_BELVO_SECRET_ID"];
  const password = process.env["BELVO_SECRET_PASSWORD"] ?? process.env["EXPO_PUBLIC_BELVO_SECRET_PASSWORD"];
  if (!id || !password) throw new Error("Belvo sandbox credentials are not configured");

  const response = await fetch(`${belvoBaseUrl}/api/token/`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id, password, scopes: "read_institutions,write_links" }),
  });
  if (!response.ok) throw new Error(`Belvo token request failed: ${response.status}`);
  const body: unknown = await response.json();
  if (typeof body !== "object" || body === null || !("access" in body) || typeof body.access !== "string") {
    throw new Error("Belvo token response was invalid");
  }
  return body.access;
}

export async function openLink(): Promise<void> {
  const token = await createLinkToken();
  const url = `${belvoBaseUrl}/widget?access_token=${encodeURIComponent(token)}&locale=es&access_mode=single`;
  await Linking.openURL(url);
}

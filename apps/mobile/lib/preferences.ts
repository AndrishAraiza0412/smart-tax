import * as SecureStore from "expo-secure-store";
import { useSyncExternalStore } from "react";

export type Language = "es" | "en";
export type Currency = "MXN" | "USD";

const LANG_KEY = "smarttax-lang";
const CURR_KEY = "smarttax-currency";
const RATE_KEY = "smarttax-usd-rate";
const FALLBACK_USD_PER_MXN = 0.057;

async function getItem(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key).catch(() => null);
}

async function setItem(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value).catch(() => undefined);
}

/**
 * Store en memoria de idioma y moneda. Se hidrata una vez desde SecureStore y
 * avisa a todos los suscriptores al cambiar: tabs, pantalla actual y montos se
 * actualizan al instante (antes solo al volver a enfocar cada pantalla).
 */
export type Prefs = { language: Language; currency: Currency };

let prefs: Prefs = { language: "es", currency: "MXN" };
const listeners = new Set<() => void>();

function update(next: Partial<Prefs>): void {
  prefs = { ...prefs, ...next };
  listeners.forEach((l) => l());
}

export function subscribePrefs(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getPrefs(): Prefs {
  return prefs;
}

void (async () => {
  update({
    language: (await getItem(LANG_KEY)) === "en" ? "en" : "es",
    currency: (await getItem(CURR_KEY)) === "USD" ? "USD" : "MXN",
  });
})();

export async function setLanguage(v: Language): Promise<void> {
  update({ language: v });
  await setItem(LANG_KEY, v);
}

export async function setCurrency(v: Currency): Promise<void> {
  update({ currency: v });
  await setItem(CURR_KEY, v);
}

/** USD por 1 MXN con caché de 24h (sin red usa fijo). */
export async function getUsdPerMxn(): Promise<number> {
  const cached = await getItem(RATE_KEY);
  if (cached) {
    const parts = cached.split(":");
    const rate = Number(parts[0]);
    const ts = Number(parts[1]);
    if (rate > 0 && ts > 0 && Date.now() - ts < 86400000) return rate;
  }
  const res = await fetch("https://open.er-api.com/v6/latest/MXN").catch(() => null);
  if (res) {
    const body = (await res.json().catch(() => null)) as { rates?: { USD?: unknown } } | null;
    const usd = Number(body?.rates?.USD);
    if (usd > 0 && Number.isFinite(usd)) {
      await setItem(RATE_KEY, `${usd}:${Date.now()}`);
      return usd;
    }
  }
  return FALLBACK_USD_PER_MXN;
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(subscribePrefs, getPrefs);
}

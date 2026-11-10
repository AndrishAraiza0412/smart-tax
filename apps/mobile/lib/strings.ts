import { usePrefs } from "./preferences";
import { i18n, type TranslationKeys } from "./i18n";

/** Diccionario es/en. Los catálogos SAT (usos CFDI, regímenes, pagos) quedan en español: son datos oficiales. */
export const strings = i18n.translations as unknown as Record<"es" | "en", TranslationKeys>;

export type Strings = (typeof strings)["es"];

/** Textos en el idioma elegido; se actualiza al instante al cambiar el idioma. */
export function useStrings(): Strings {
  return strings[usePrefs().language];
}

/** "1 comprobantes" -> "1 comprobante": quita la "s" final del sustantivo cuando n es 1. */
export function noun(n: number, plural: string): string {
  return n === 1 ? plural.replace(/s$/, "") : plural;
}

/** Rellena plantillas "Hola {{name}}" con sus valores. */
export function fill(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_m, k: string) => String(params[k] ?? ""));
}

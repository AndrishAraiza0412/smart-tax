/**
 * Reglas fiscales locales (sin API): tipo de persona por RFC, regímenes
 * compatibles y deducibilidad estimada de un gasto según el régimen.
 * Orientativo para el prototipo, no sustituye a un contador.
 */
export type Persona = "fisica" | "moral";

/** RFC de 13 caracteres = persona física, 12 = moral. */
export function tipoPersona(rfc: string | null | undefined): Persona | null {
  const r = (rfc ?? "").trim().toUpperCase();
  if (/^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/.test(r)) return "fisica";
  if (/^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/.test(r)) return "moral";
  return null;
}

/** Aplicabilidad del catálogo c_RegimenFiscal del SAT (solo las claves que usa la app). */
const APLICA: Record<string, readonly Persona[]> = {
  "601": ["moral"], "603": ["moral"], "605": ["fisica"], "606": ["fisica"], "607": ["fisica"],
  "608": ["fisica"], "609": ["moral"], "610": ["fisica", "moral"], "611": ["fisica"], "612": ["fisica"],
  "614": ["fisica"], "616": ["fisica"], "620": ["moral"], "621": ["fisica"], "622": ["fisica", "moral"],
  "626": ["fisica", "moral"],
};

/** Regímenes válidos para el tipo de persona; sin RFC válido se muestran todos. */
export function regimenesPara(persona: Persona | null, todos: readonly string[]): string[] {
  return persona ? todos.filter((r) => APLICA[r]?.includes(persona) ?? true) : [...todos];
}

export function regimenCompatible(regimen: string | null | undefined, persona: Persona | null): boolean {
  if (!regimen || !persona) return true;
  return APLICA[regimen]?.includes(persona) ?? true;
}

export type Deducibilidad = { deducible: boolean | null; razon: string };

const PERSONALES = new Set(["Salud", "Educación"]);
const DE_NEGOCIO = new Set(["Oficina", "Transporte", "Servicios", "Salud", "Educación"]);
// Regímenes de personas físicas sin actividad empresarial: solo deducciones personales.
const SIN_ACTIVIDAD = new Set(["605", "607", "608", "611", "614"]);
// Regímenes con actividad (física o moral) que deducen gastos estrictamente indispensables.
const CON_ACTIVIDAD = new Set(["601", "603", "606", "610", "612", "620", "621", "622"]);

/**
 * Deducibilidad estimada. `deducible: null` = depende (se respeta la sugerencia de la IA).
 * ponytail: reglas gruesas por categoría; afinar por concepto/uso CFDI si se vuelve producto.
 */
export function deducibilidad(regimen: string | null | undefined, categoria: string, persona: Persona | null): Deducibilidad {
  if (!regimen) return { deducible: null, razon: "" };
  if (regimen === "616") return { deducible: false, razon: "Sin obligaciones fiscales: no hay deducciones." };
  if (regimen === "626" && persona !== "moral") {
    return { deducible: false, razon: "En RESICO persona física se paga sobre ingresos: los gastos no son deducibles." };
  }
  if (SIN_ACTIVIDAD.has(regimen)) {
    return PERSONALES.has(categoria)
      ? { deducible: true, razon: "Deducción personal en tu declaración anual." }
      : { deducible: false, razon: "En tu régimen solo son deducibles gastos personales (salud, colegiaturas)." };
  }
  if (CON_ACTIVIDAD.has(regimen) || regimen === "626") {
    if (DE_NEGOCIO.has(categoria)) return { deducible: true, razon: "Gasto indispensable para tu actividad: pide factura." };
    if (categoria === "Entretenimiento") return { deducible: false, razon: "Los gastos de entretenimiento no son deducibles." };
    if (categoria === "Alimentación") return { deducible: false, razon: "Consumos en restaurante solo son deducibles como viáticos fuera de tu ciudad." };
  }
  return { deducible: null, razon: "" };
}

/** Combina la sugerencia de la IA con la regla del régimen: si el régimen es concluyente, manda la regla. */
export function ajustarSugerencia(
  ai: { facturable: boolean; razon: string },
  perfil: { rfc: string | null; regimen: string | null },
  categoria: string,
): { facturable: boolean; razon: string } {
  const rule = deducibilidad(perfil.regimen, categoria, tipoPersona(perfil.rfc));
  return rule.deducible === null ? ai : { facturable: rule.deducible, razon: rule.razon };
}

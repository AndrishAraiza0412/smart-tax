import { supabase } from "./supabase";

export type Plan = "gratis" | "pro" | "negocios";
export type Feature = "unlimited" | "aiScan" | "aiAdvisor" | "cfdiImport" | "cards";

/** Gastos por mes permitidos en el plan Gratis. */
export const FREE_MONTHLY_LIMIT = 10;

/** Única fuente de verdad de qué incluye cada plan. */
const FEATURES: Record<Plan, readonly Feature[]> = {
  gratis: [],
  pro: ["unlimited", "aiScan", "aiAdvisor", "cfdiImport", "cards"],
  negocios: ["unlimited", "aiScan", "aiAdvisor", "cfdiImport", "cards"],
};

export function can(plan: Plan, feature: Feature): boolean {
  return FEATURES[plan].includes(feature);
}

function asPlan(v: unknown): Plan {
  return v === "pro" || v === "negocios" ? v : "gratis";
}

/** Plan del usuario actual; sin sesión o sin red se trata como Gratis. */
export async function getMyPlan(): Promise<Plan> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "gratis";
    const { data } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
    return asPlan(data?.plan);
  } catch {
    return "gratis";
  }
}

export async function saveMyPlan(plan: Plan): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sin sesión");
  const { error } = await supabase.from("profiles").update({ plan }).eq("id", user.id);
  if (error) throw new Error(error.message);
}

/** Lanza si el plan Gratis ya llegó a su límite de gastos del mes. */
export async function assertCanAddGasto(): Promise<void> {
  if (can(await getMyPlan(), "unlimited")) return;
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString("en-CA");
  const { count } = await supabase.from("gastos").select("id", { count: "exact", head: true }).gte("fecha", first);
  if ((count ?? 0) >= FREE_MONTHLY_LIMIT) {
    throw new Error(`Llegaste al límite de ${FREE_MONTHLY_LIMIT} gastos del mes del plan Gratis. Pasa a Pro IA para gastos ilimitados.`);
  }
}

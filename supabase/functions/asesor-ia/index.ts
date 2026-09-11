import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/**
 * Edge Function `asesor-ia`: chat fiscal con IA (POST { question }).
 *
 * Flujo: valida el JWT del usuario → lee sus últimos 20 gastos y su perfil
 * fiscal con service_role → los inyecta como contexto en el prompt → llama
 * a Gemini (`gemini-3.1-flash-lite`) → devuelve { answer }.
 * Requiere el secreto `GEMINI_API_KEY`. Sin clave responde 503 y la app
 * usa sus respuestas locales de respaldo.
 */

const json = (body: unknown, status = 200): Response => Response.json(body, { status });
const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

type Gasto = { monto: number | string; fecha: string; descripcion: string; cfdi_estado: string | null; categoria: string | null };

const SYSTEM = `Eres el asesor fiscal con IA de SmartTax, app mexicana de gastos y facturación.
Hablas español, tono claro y breve (máximo 120 palabras). Temas: deducciones ISR, CFDI 4.0,
usos de CFDI, regímenes fiscales SAT, IVA 16%, métodos de pago PUE/PPD.
Si preguntan algo fuera de impuestos mexicanos, redirige amablemente al tema fiscal.
Nunca inventes leyes: si no estás seguro, dilo y sugiere consultar a un contador.`;

export async function buildPrompt(question: string, userId: string): Promise<string> {
  const { data: gastos } = await supabase.from("gastos").select("monto,fecha,descripcion,cfdi_estado,categoria").eq("user_id", userId).order("fecha", { ascending: false }).limit(20);
  const rows = (gastos ?? []) as Gasto[];
  const total = rows.reduce((s, g) => s + Number(g.monto), 0);
  const { data: profile } = await supabase.from("profiles").select("rfc,regimen_fiscal,razon_social").eq("id", userId).single();
  const recent = rows.slice(0, 5).map((g) => `${g.fecha} ${g.descripcion} $${Number(g.monto).toFixed(2)} (${g.cfdi_estado ?? "pendiente"})`).join("\n");
  return `${SYSTEM}\n\nContexto del usuario:\n- RFC: ${profile?.rfc ?? "sin registrar"} | Régimen: ${profile?.regimen_fiscal ?? "sin registrar"}\n- Gastos registrados: ${rows.length}, total: $${total.toFixed(2)}\n- Recientes:\n${recent || "(sin gastos)"}\n\nPregunta: ${question}`;
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Missing authorization" }, 401);
  const { data: { user }, error: authError } = await supabase.auth.getUser(authorization.slice(7));
  if (authError || !user) return json({ error: "Invalid authorization" }, 401);

  let body: unknown;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const question = typeof body === "object" && body !== null && "question" in body && typeof body.question === "string" ? body.question.trim() : "";
  if (!question) return json({ error: "Missing question" }, 400);

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return json({ error: "AI not configured" }, 503);

  const prompt = await buildPrompt(question, user.id);
  const gemini = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 300, temperature: 0.4 } }),
  });
  if (!gemini.ok) return json({ error: "AI provider failed" }, 502);
  const result: unknown = await gemini.json();
  const answer = typeof result === "object" && result !== null && "candidates" in result && Array.isArray(result.candidates)
    ? result.candidates.map((c: unknown) => typeof c === "object" && c !== null && "content" in c && typeof c.content === "object" && c.content !== null && "parts" in c.content && Array.isArray(c.content.parts) ? c.content.parts.map((p: unknown) => typeof p === "object" && p !== null && "text" in p ? String(p.text) : "").join("") : "").join("")
    : "";
  if (!answer) return json({ error: "Empty AI response" }, 502);
  return json({ answer });
});

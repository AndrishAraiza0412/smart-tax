import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/**
 * Edge Function `asesor-ia`: chat fiscal + detección de facturable (POST { action, ... }).
 *
 * Acciones:
 * - chat: { question } → respuesta del asesor fiscal
 * - detect_facturable: { descripcion, categoria } → { facturable: boolean, confidence: number, razon: string }
 *
 * Requiere el secreto `GEMINI_API_KEY`. Sin clave responde 503.
 */

const json = (body: unknown, status = 200): Response => Response.json(body, { status });
const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

const SYSTEM_CHAT = `Eres el asesor fiscal con IA de SmartTax, app mexicana de gastos y facturación.
Hablas español, tono claro y breve (máximo 120 palabras). Temas: deducciones ISR, CFDI 4.0,
usos de CFDI, regímenes fiscales SAT, IVA 16%, métodos de pago PUE/PPD.
Si preguntan algo fuera de impuestos mexicanos, redirige amablemente al tema fiscal.
Nunca inventes leyes: si no estás seguro, dilo y sugiere consultar a un contador.`;

const SYSTEM_FACTURABLE = `Eres un experto fiscal mexicano que determina si un gasto es facturable (deducible ISR ante el SAT).
Responde SOLO en JSON: { "facturable": boolean, "confidence": number (0-100), "razon": "explicación breve en español" }.

CRITERIOS PARA SER FACTURABLE (deducible ISR):
- Gasto ESTRICTAMENTE INDISPENSABLE para la actividad económica del contribuyente
- Tiene comprobante fiscal válido (CFDI 4.0) con RFC del emisor y receptor correctos
- Pagado mediante medios electrónicos (transferencia, tarjeta, cheque nominativo) - NO efectivo
- IVA acreditado correctamente (16% o 8% frontera)
- Relacionado DIRECTAMENTE con la actividad empresarial/profesional que genera ingresos

NO FACTURABLE (NO deducible ISR) - CATEGORÍAS COMPLETAS:
- SERVICIOS BÁSICOS DE VIVIENDA: luz, agua, gas, internet, teléfono fijo/móvil (son gastos de vivienda, no de actividad económica, salvo home office con constancia)
- APUESTAS Y JUEGOS DE AZAR: casinos, loterías, apuestas deportivas, bingo, máquinas tragamonedas
- GASTOS PERSONALES Y FAMILIARES: comida familiar, ropa casual, entretenimiento personal (cine, streaming, videojuegos), cortes de pelo, gimnasio personal
- COMBUSTIBLE PARA USO PERSONAL: gasolina para auto particular, no vehicular de la empresa
- MULTAS, SANCIONES E INTERESES MORATORIOS: tránsito, fiscales, aduanales
- GASTOS DE REPRESENTACIÓN EXCESIVOS: sin comprobante, sin relación clara con cliente/prospecto
- DONATIVOS SIN COMPROBANTE: donaciones sin recibo deducible autorizado
- GASTOS MÉDICOS PERSONALES: consultas, medicinas para uso personal (no de empleados)
- EDUCACIÓN PERSONAL: cursos, maestrías, certificaciones no relacionadas con la actividad actual
- VIÁTICOS Y VIAJES PERSONALES: vacaciones, viajes de placer

EJEMPLOS CLAROS:
- "Almuerzo con cliente en restaurante" + categoria "Alimentación" → facturable: true (gasto de representación CON CLIENTE)
- "Compra de laptop para trabajo" + categoria "Oficina" → facturable: true (herramienta de trabajo indispensable)
- "Cena familiar en restaurante" + categoria "Alimentación" → facturable: false (gasto personal familiar)
- "Recarga de gasolina para auto personal" + categoria "Transporte" → facturable: false (uso personal)
- "Pago de luz de la CASA" + categoria "Servicios" → facturable: false (servicio básico de vivienda)
- "Pago de luz de la OFICINA" + categoria "Servicios" → facturable: true (servicio indispensable para operación)
- "Apuestas en casino" + categoria "Entretenimiento" → facturable: false (juegos de azar NO deducibles)
- "Suscripción Netflix" + categoria "Entretenimiento" → facturable: false (entretenimiento personal)
- "Compra de ropa casual" + categoria "Otros" → facturable: false (gasto personal)
- "Multa de tránsito" + categoria "Otros" → facturable: false (sanción NO deducible)
- "Gasolina para auto de reparto" + categoria "Transporte" → facturable: true (vehículo de la empresa)
- "Compra de materia prima" + categoria "Otros" → facturable: true (insumo indispensable para producción)`;

async function buildChatPrompt(question: string, userId: string): Promise<string> {
  const { data: gastos } = await supabase.from("gastos").select("monto,fecha,descripcion,cfdi_estado,categoria").eq("user_id", userId).order("fecha", { ascending: false }).limit(20);
  const rows = (gastos ?? []) as { monto: number | string; fecha: string; descripcion: string; cfdi_estado: string | null; categoria: string | null }[];
  const total = rows.reduce((s, g) => s + Number(g.monto), 0);
  const { data: profile } = await supabase.from("profiles").select("rfc,regimen_fiscal,razon_social").eq("id", userId).single();
  const recent = rows.slice(0, 5).map((g) => `${g.fecha} ${g.descripcion} $${Number(g.monto).toFixed(2)} (${g.cfdi_estado ?? "pendiente"})`).join("\n");
  return `${SYSTEM_CHAT}\n\nContexto del usuario:\n- RFC: ${profile?.rfc ?? "sin registrar"} | Régimen: ${profile?.regimen_fiscal ?? "sin registrar"}\n- Gastos registrados: ${rows.length}, total: $${total.toFixed(2)}\n- Recientes:\n${recent || "(sin gastos)"}\n\nPregunta: ${question}`;
}

async function detectFacturable(descripcion: string, categoria: string): Promise<{ facturable: boolean; confidence: number; razon: string }> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("AI not configured");

  const prompt = `${SYSTEM_FACTURABLE}\n\nAnaliza este gasto:\n- Descripción: "${descripcion}"\n- Categoría: "${categoria}"\n\nResponde SOLO con el JSON.`;

  const gemini = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 200, temperature: 0.2 } }),
  });
  if (!gemini.ok) throw new Error("AI provider failed");
  const result: unknown = await gemini.json();
  const text = typeof result === "object" && result !== null && "candidates" in result && Array.isArray(result.candidates)
    ? result.candidates.map((c: unknown) => typeof c === "object" && c !== null && "content" in c && typeof c.content === "object" && c.content !== null && "parts" in c.content && Array.isArray(c.content.parts) ? c.content.parts.map((p: unknown) => typeof p === "object" && p !== null && "text" in p ? String(p.text) : "").join("") : "").join("")
    : "";
  if (!text) throw new Error("Empty AI response");
  try {
    const parsed = JSON.parse(text);
    return { facturable: Boolean(parsed.facturable), confidence: Number(parsed.confidence) ?? 80, razon: String(parsed.razon ?? "Análisis automático") };
  } catch {
    // Fallback heurístico si el JSON falla
    const lower = descripcion.toLowerCase();
    const personal = ["familiar", "personal", "cine", "cine", "netflix", "spotify", "ropa casual", "supermercado familiar", "cena familiar", "almuerzo familiar"];
    const esPersonal = personal.some(p => lower.includes(p));
    return { facturable: !esPersonal, confidence: 70, razon: esPersonal ? "Detectado como gasto personal por palabras clave" : "Análisis heurístico: parece gasto de actividad económica" };
  }
}

const json = (body: unknown, status = 200): Response => Response.json(body, { status });
const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Missing authorization" }, 401);
  const { data: { user }, error: authError } = await supabase.auth.getUser(authorization.slice(7));
  if (authError || !user) return json({ error: "Invalid authorization" }, 401);

  let body: unknown;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const action = typeof body === "object" && body !== null && "action" in body ? String(body.action) : "chat";

  if (action === "detect_facturable") {
    const descripcion = typeof body === "object" && body !== null && "descripcion" in body ? String(body.descripcion) : "";
    const categoria = typeof body === "object" && body !== null && "categoria" in body ? String(body.categoria) : "";
    if (!descripcion || !categoria) return json({ error: "Missing descripcion or categoria" }, 400);
    try {
      const result = await detectFacturable(descripcion, categoria);
      return json(result);
    } catch (e) {
      return json({ error: "AI detection failed", detail: String(e) }, 502);
    }
  }

  // Default: chat
  const question = typeof body === "object" && body !== null && "question" in body && typeof body.question === "string" ? body.question.trim() : "";
  if (!question) return json({ error: "Missing question" }, 400);

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return json({ error: "AI not configured" }, 503);

  const prompt = await buildChatPrompt(question, user.id);
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
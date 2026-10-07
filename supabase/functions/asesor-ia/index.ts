const json = (body: unknown, status = 200): Response =>
  Response.json(body, { status, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,apikey,content-type" } });

const NO_FACTURABLE = ["casa", "hogar", "vivienda", "familiar", "personal", "casino", "apuesta", "netflix", "spotify", "cine", "multa", "sancion", "sanción", "propina en efectivo", "gimnasio personal", "donativo"];

function fallbackFacturable(descripcion: string, categoria: string): { facturable: boolean; razon: string } {
  const lower = `${descripcion} ${categoria}`.toLowerCase();
  const hit = NO_FACTURABLE.find((p) => lower.includes(p));
  if (hit) return { facturable: false, razon: `Gasto personal / no deducible ("${hit}"). Art. 28 LISR: solo lo estrictamente indispensable.` };
  return { facturable: true, razon: "Parece estrictamente indispensable para la actividad. Confirma CFDI PUE + pago electrónico." };
}

type Turn = { role: "user" | "model"; parts: { text: string }[] };
type GeminiOpts = { system?: string; history?: Turn[]; temperature?: number; maxOutputTokens?: number };

async function callGemini(apiKey: string, model: string, prompt: string, imageBase64?: string, mime = "image/jpeg", opts: GeminiOpts = {}): Promise<string> {
  const parts: unknown[] = [{ text: prompt }];
  if (imageBase64) parts.push({ inline_data: { mime_type: mime, data: imageBase64 } });
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...(opts.system ? { systemInstruction: { parts: [{ text: opts.system }] } } : {}),
      contents: [...(opts.history ?? []), { role: "user", parts }],
      generationConfig: { temperature: opts.temperature ?? 0.2, maxOutputTokens: opts.maxOutputTokens ?? 800 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const body = await res.json();
  const text = body?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  return text;
}

async function rest<T>(path: string, authorization: string, apikey: string): Promise<T[]> {
  const base = Deno.env.get("SUPABASE_URL");
  if (!base) return [];
  try {
    const res = await fetch(`${base}/rest/v1/${path}`, { headers: { authorization, apikey } });
    return res.ok ? ((await res.json()) as T[]) : [];
  } catch {
    return [];
  }
}

type GastoRow = { monto: number | string; fecha: string; descripcion: string; categoria: string | null; facturable: boolean };

async function userContext(authorization: string, apikey: string): Promise<string> {
  const [profiles, gastos] = await Promise.all([
    rest<{ rfc: string | null; regimen_fiscal: string | null }>("profiles?select=rfc,regimen_fiscal&limit=1", authorization, apikey),
    rest<GastoRow>("gastos?select=monto,fecha,descripcion,categoria,facturable&order=fecha.desc&limit=40", authorization, apikey),
  ]);
  const month = new Date().toISOString().slice(0, 7);
  const delMes = gastos.filter((g) => g.fecha.startsWith(month));
  const sum = (rows: GastoRow[]): string => rows.reduce((s, g) => s + Number(g.monto), 0).toFixed(2);
  const p = profiles[0];
  const recientes = gastos.slice(0, 10)
    .map((g) => `- ${g.fecha} · ${g.descripcion} · $${Number(g.monto).toFixed(2)} · ${g.categoria ?? "Sin categoría"} · ${g.facturable ? "facturable" : "no facturable"}`)
    .join("\n");
  return [
    `RFC: ${p?.rfc ?? "no capturado"}; régimen fiscal (clave SAT): ${p?.regimen_fiscal ?? "no capturado"}.`,
    `Mes actual (${month}): ${delMes.length} gasto(s), total $${sum(delMes)} MXN, facturable $${sum(delMes.filter((g) => g.facturable))} MXN.`,
    `Gastos registrados en total (últimos 40): ${gastos.length}.`,
    recientes ? `Gastos recientes:\n${recientes}` : "Aún no tiene gastos registrados.",
  ].join("\n");
}

function chatSystemPrompt(context: string, lang: string): string {
  const idioma = lang === "en" ? "Responde en inglés natural y cercano." : "Responde en español natural de México y tutea a la persona.";
  return `Eres el asesor fiscal de SmartTax: un contador mexicano con experiencia, cálido y directo, que habla como un amigo que sabe mucho de impuestos, no como un manual del SAT.

Cómo hablas:
- ${idioma}
- Primero conecta con lo que la persona pregunta o le preocupa (una frase breve y natural, sin exagerar ni repetir su pregunta), luego explica.
- Respuestas cortas: 2 a 4 frases. Usa listas solo si te piden pasos o comparaciones.
- Explica con palabras sencillas y ejemplos de su vida diaria; si usas un término técnico (PUE, CFDI, uso G03), acláralo en pocas palabras.
- Cuando sea relevante, usa sus datos reales de abajo (montos, gastos concretos). Nunca inventes cifras, artículos de ley ni gastos que no estén ahí.
- Cierra con un siguiente paso concreto dentro de la app o con una pregunta para entender mejor su caso. No cierres siempre igual.
- Si algo depende de su situación o no estás seguro, dilo con honestidad; sugiere consultar a un contador solo en casos realmente complejos.
- Nada de saludos repetidos en cada mensaje, ni frases de robot como "Como modelo de lenguaje" o "¡Excelente pregunta!". Sin markdown con asteriscos ni encabezados.
- Si te preguntan algo fuera de impuestos o finanzas personales, redirige con amabilidad.

Datos actuales de la persona (privados, úsalos con tacto):
${context}`;
}

function extractJson(text: string): Record<string, unknown> | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]) as Record<string, unknown>; } catch { return null; }
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") return json({ ok: true });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Missing authorization" }, 401);

  let body: unknown;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const get = (k: string): string => (typeof body === "object" && body !== null && k in body ? String((body as Record<string, unknown>)[k] ?? "") : "");
  const action = get("action") || "chat";

  const apiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
  const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.0-flash";

  if (action === "detect_facturable") {
    const descripcion = get("descripcion");
    const categoria = get("categoria");
    if (!descripcion || !categoria) return json({ error: "Missing descripcion or categoria" }, 400);
    if (!apiKey) { const f = fallbackFacturable(descripcion, categoria); return json({ ...f, confidence: 60, source: "keywords" }); }
    try {
      const prompt = `Eres asesor fiscal México (LISR Art. 27-28, CFDI 4.0). Un gasto es facturable/deducible solo si: 1) estrictamente indispensable para la actividad, 2) amparado con CFDI PUE vigente, 3) pagado por medio electrónico (no efectivo), 4) no es personal/familiar, multa, donativo ni entretenimiento puro. Responde SOLO JSON: {"facturable": boolean, "razon": "máx 20 palabras"}. Gasto: "${descripcion}" Categoría: "${categoria}".`;
      const parsed = extractJson(await callGemini(apiKey, model, prompt));
      if (typeof parsed?.["facturable"] === "boolean") {
        return json({ facturable: parsed["facturable"], razon: String(parsed["razon"] ?? ""), confidence: 85, source: "gemini" });
      }
    } catch { /* cae a fallback */ }
    const f = fallbackFacturable(descripcion, categoria);
    return json({ ...f, confidence: 60, source: "keywords-fallback" });
  }

  if (action === "analyze_ticket") {
    const imageBase64 = get("imageBase64") || get("image");
    if (!imageBase64) return json({ error: "Missing imageBase64" }, 400);
    if (!apiKey) return json({ error: "IA no configurada (GEMINI_API_KEY). Sube foto y captura manual.", fallback: true }, 503);
    try {
      const prompt = `Lee este ticket/factura mexicano. Responde SOLO JSON sin markdown: {"descripcion": "comercio + concepto corto", "monto": 0.00, "fecha": "YYYY-MM-DD", "categoria": "una de: Alimentación, Transporte, Servicios, Salud, Oficina, Educación, Entretenimiento, Otros", "facturable": boolean, "razon": "por qué es/no es deducible, máx 20 palabras"}. Si no ves un campo, estima con lo visible. Deducible solo si indispensable + CFDI posible + pago electrónico.`;
      const parsed = extractJson(await callGemini(apiKey, model, prompt, imageBase64, get("mimeType") || "image/jpeg"));
      if (!parsed) return json({ error: "No se pudo leer el ticket. Intenta con mejor luz." }, 422);
      return json({
        descripcion: String(parsed["descripcion"] ?? "Compra detectada"),
        monto: Number(parsed["monto"] ?? 0),
        fecha: String(parsed["fecha"] ?? new Date().toISOString().slice(0, 10)),
        categoria: String(parsed["categoria"] ?? "Otros"),
        facturable: Boolean(parsed["facturable"] ?? true),
        razon: String(parsed["razon"] ?? ""),
        confidence: 85,
        source: "gemini-vision",
      });
    } catch (e) {
      return json({ error: e instanceof Error ? e.message : "Error IA", fallback: true }, 502);
    }
  }

  if (action === "chat") {
    const question = get("question").trim().slice(0, 1000);
    if (!question) return json({ error: "Missing question" }, 400);
    if (!apiKey) return json({ error: "IA no configurada (GEMINI_API_KEY)", fallback: true }, 503);
    const rawHistory = (body as { history?: unknown }).history;
    const history: Turn[] = (Array.isArray(rawHistory) ? rawHistory : [])
      .filter((m): m is { from: string; text: string } => typeof m?.text === "string" && (m?.from === "user" || m?.from === "bot"))
      .slice(-6)
      .map((m) => ({ role: m.from === "user" ? "user" : "model", parts: [{ text: m.text.slice(0, 1000) }] }));
    while (history[0]?.role === "model") history.shift();
    try {
      const context = await userContext(authorization, request.headers.get("apikey") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "");
      const answer = (await callGemini(apiKey, model, question, undefined, undefined, {
        system: chatSystemPrompt(context, get("lang")),
        history,
        temperature: 0.7,
        maxOutputTokens: 500,
      })).trim();
      if (!answer) return json({ error: "Respuesta vacía", fallback: true }, 502);
      return json({ answer, source: "gemini" });
    } catch (e) {
      return json({ error: e instanceof Error ? e.message : "Error IA", fallback: true }, 502);
    }
  }

  return json({ error: "Action not supported" }, 400);
});
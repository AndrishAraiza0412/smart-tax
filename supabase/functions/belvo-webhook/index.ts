import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const json = (body: unknown, status = 200): Response => Response.json(body, { status });
const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

type Transaction = { readonly id?: string; readonly amount?: number; readonly value_date?: string; readonly description?: string; readonly merchant?: string; readonly link?: string; readonly user_id?: string };
type EventBody = { readonly event_type?: string; readonly user_id?: string; readonly link_id?: string; readonly data?: unknown };

const verify = async (payload: string, signature: string, secret: string): Promise<boolean> => {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { hash: "SHA-256", name: "HMAC" }, false, ["verify"]);
  const bytes = new Uint8Array(signature.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? []);
  return crypto.subtle.verify("HMAC", key, bytes, new TextEncoder().encode(payload));
};

const category = (description: string): string => {
  const value = description.toLowerCase();
  if (/uber|didi|gasolin|pemex|combustible/.test(value)) return "Transporte";
  if (/rappi|uber eats|restaurante|comida|oxxo/.test(value)) return "Alimentos";
  if (/luz|agua|telmex|internet|cfe/.test(value)) return "Servicios";
  return "Otros";
};

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const secret = Deno.env.get("BELVO_WEBHOOK_SECRET");
  const signature = request.headers.get("x-belvo-signature");
  const payload = await request.text();
  if (!secret || !signature || !(await verify(payload, signature, secret))) return json({ error: "Invalid signature" }, 401);

  let body: EventBody;
  try {
    const parsed: unknown = JSON.parse(payload);
    if (typeof parsed !== "object" || parsed === null) return json({ error: "Invalid event" }, 400);
    if (!("event_type" in parsed) && !("data" in parsed)) return json({ error: "Invalid event" }, 400);
    body = parsed;
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  if (body.event_type !== "transactions.created") return json({ ok: true, ignored: true });
  const transactions = Array.isArray(body.data) ? body.data : [body.data];
  const rows = transactions.filter((item): item is Transaction => typeof item === "object" && item !== null).map((transaction) => {
    const description = transaction.description ?? transaction.merchant ?? "Gasto bancario";
    return { user_id: transaction.user_id ?? body.user_id, monto: Math.abs(transaction.amount ?? 0), fecha: transaction.value_date, descripcion: description, rfc_receptor: "XAXX010101000", codigo_postal: null, uso_cfdi: "G03", metodo_pago: "PUE", forma_pago: "03", belvo_link_id: transaction.link ?? body.link_id, belvo_transaction_id: transaction.id, es_automatico: true, cfdi_estado: "borrador", categoria: category(description) };
  }).filter((row) => row.user_id && row.fecha && row.belvo_transaction_id);
  if (rows.length === 0) return json({ ok: true, created: 0 });
  const { error } = await supabase.from("gastos").upsert(rows, { onConflict: "belvo_transaction_id" });
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true, created: rows.length });
});

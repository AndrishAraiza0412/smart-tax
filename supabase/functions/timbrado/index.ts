import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { GastoManualSchema } from "@smarttax/shared/validation";

import { buildCFDI40XML } from "./cfdi40.ts";

type FacturaResponse = { readonly uuid?: string; readonly serie?: string; readonly folio?: string; readonly xml_timbrado?: string; readonly data?: FacturaResponse };
type TimbradoStatus = { readonly estado: string; readonly xml_url?: string; readonly pdf_url?: string };

const json = (body: unknown, status = 200): Response => Response.json(body, { status });
const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

const facturaToken = async (): Promise<string> => {
  const configured = Deno.env.get("FACTURACOM_API_TOKEN");
  if (configured) return configured;
  const response = await fetch(`${Deno.env.get("FACTURACOM_API_URL") ?? "https://staging.factura.com/api"}/auth`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: Deno.env.get("FACTURACOM_USERNAME"), password: Deno.env.get("FACTURACOM_PASSWORD"), test_mode: true }) });
  if (!response.ok) throw new Error(`Factura.com auth failed: ${response.status}`);
  const body: unknown = await response.json();
  if (typeof body !== "object" || body === null || !("token" in body) || typeof body.token !== "string") throw new Error("Factura.com auth returned no token");
  return body.token;
};

const pdf = (uuid: string, gasto: { descripcion: string; total: number }): Uint8Array => {
  const text = `CFDI ${uuid} | ${gasto.descripcion} | Total: ${gasto.total.toFixed(2)}`.replace(/[()\\]/g, " ");
  const objects = [`1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj`, `2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj`, `3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj`, `4 0 obj<</Length ${text.length + 44}>>stream\nBT /F1 12 Tf 36 740 Td (${text}) Tj ET\nendstream endobj`, `5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj`];
  let output = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const object of objects) { offsets.push(output.length); output += `${object}\n`; }
  const xref = output.length;
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(output);
};

const signedStatus = async (uuid: string, userId: string): Promise<TimbradoStatus | null> => {
  const { data, error } = await supabase.from("gastos").select("user_id,cfdi_estado,cfdi_xml,cfdi_pdf_url").eq("cfdi_uuid", uuid).eq("user_id", userId).single();
  if (error || !data) return null;
  const paths = { xml: data.cfdi_xml ? `${data.user_id}/${uuid}.xml` : null, pdf: data.cfdi_pdf_url };
  const signed = await Promise.all([paths.xml ? supabase.storage.from("cfdi-files").createSignedUrl(paths.xml, 3600) : Promise.resolve({ data: null }), paths.pdf ? supabase.storage.from("cfdi-files").createSignedUrl(paths.pdf, 3600) : Promise.resolve({ data: null })]);
  return { estado: data.cfdi_estado ?? "error", ...(signed[0].data?.signedUrl ? { xml_url: signed[0].data.signedUrl } : {}), ...(signed[1].data?.signedUrl ? { pdf_url: signed[1].data.signedUrl } : {}) };
};

Deno.serve(async (request: Request): Promise<Response> => {
  const route = new URL(request.url).pathname.split("/").filter(Boolean);
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Missing authorization" }, 401);
  const { data: { user }, error: authError } = await supabase.auth.getUser(authorization.slice(7));
  if (authError || !user) return json({ error: "Invalid authorization" }, 401);
  const uuid = route.at(-1);
  if (request.method === "GET" && route.at(-2) === "status" && uuid) return json(await signedStatus(uuid, user.id) ?? { estado: "error" }, 200);
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let body: unknown;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const parsed = GastoManualSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Invalid request", details: parsed.error.flatten() }, 400);
  try {
    const { data: profile, error: profileError } = await supabase.from("profiles").select("rfc, regimen_fiscal, razon_social").eq("id", user.id).single();
    if (profileError || !profile?.rfc || !profile.regimen_fiscal || !profile.razon_social) return json({ error: "Fiscal profile incomplete" }, 422);
    const xml = buildCFDI40XML(parsed.data, profile.rfc, profile.regimen_fiscal);
    const token = await facturaToken();
    const response = await fetch(`${Deno.env.get("FACTURACOM_API_URL") ?? "https://staging.factura.com/api"}/cfdi/timbrar`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ xml, test_mode: true }) });
    const result: FacturaResponse = await response.json();
    if (!response.ok || !result.uuid) return json({ success: false, estado: "error", error: result }, 502);
    const timbradoXml = result.xml_timbrado ?? xml;
    const xmlPath = `${user.id}/${result.uuid}.xml`; const pdfPath = `${user.id}/${result.uuid}.pdf`;
    const xmlUpload = await supabase.storage.from("cfdi-files").upload(xmlPath, new TextEncoder().encode(timbradoXml), { contentType: "application/xml", upsert: true });
    const pdfUpload = await supabase.storage.from("cfdi-files").upload(pdfPath, pdf(result.uuid, parsed.data), { contentType: "application/pdf", upsert: true });
    if (xmlUpload.error || pdfUpload.error) return json({ success: false, estado: "error", error: xmlUpload.error?.message ?? pdfUpload.error?.message }, 500);
    const { error: saveError } = await supabase.from("gastos").upsert({ user_id: user.id, monto: parsed.data.total, fecha: parsed.data.fecha, descripcion: parsed.data.descripcion, rfc_receptor: parsed.data.rfcProveedor, codigo_postal: parsed.data.codigoPostal, uso_cfdi: parsed.data.usoCFDI, metodo_pago: parsed.data.metodoPago, forma_pago: parsed.data.formaPago, es_automatico: parsed.data.esAutomatico, cfdi_uuid: result.uuid, cfdi_serie: result.serie ?? "G", cfdi_folio: result.folio ?? parsed.data.fecha.replaceAll("-", ""), cfdi_xml: timbradoXml, cfdi_pdf_url: pdfPath, cfdi_estado: "timbrado", timbrado_response: result });
    if (saveError) return json({ success: false, estado: "error", error: saveError.message }, 500);
    return json({ success: true, uuid: result.uuid, estado: "timbrado" });
  } catch (error) {
    return json({ success: false, estado: "error", error: error instanceof Error ? error.message : "Timbrado failed" }, 502);
  }
});

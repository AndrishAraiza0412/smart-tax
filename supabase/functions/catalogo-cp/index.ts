import { CPSchema } from "@smarttax/shared/validation";

const json = (body: unknown, status = 200): Response =>
  Response.json(body, { status });

Deno.serve((request: Request): Response => {
  if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);

  const codigo = new URL(request.url).pathname.match(/\/cp\/([^/]+)\/?$/)?.[1] ?? "";
  const parsed = CPSchema.safeParse(codigo);
  if (!parsed.success) return json({ error: "Invalid postal code" }, 400);

  return json({ ok: true, message: "Catálogo CP skeleton", codigo: parsed.data });
});

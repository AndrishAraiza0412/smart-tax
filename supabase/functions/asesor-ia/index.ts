const json = (body: unknown, status = 200): Response => Response.json(body, { status });

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Missing authorization" }, 401);
  
  let body: unknown;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const action = typeof body === "object" && body !== null && "action" in body ? String(body.action) : "chat";

  if (action === "detect_facturable") {
    const descripcion = typeof body === "object" && body !== null && "descripcion" in body ? String(body.descripcion) : "";
    const categoria = typeof body === "object" && body !== null && "categoria" in body ? String(body.categoria) : "";
    if (!descripcion || !categoria) return json({ error: "Missing descripcion or categoria" }, 400);
    
    const lower = descripcion.toLowerCase();
    const noFacturable = ["casa", "hogar", "vivienda", "familiar", "personal", "casino", "apuesta", "netflix", "spotify", "cine", "multa", "sanción", "gimnasio personal", "educación personal", "donativo"];
    const esNoFacturable = noFacturable.some(p => descripcion.toLowerCase().includes(p));
    
    return json({ 
      facturable: !esNoFacturable, 
      confidence: 70, 
      razon: esNoFacturable ? "Detectado como no facturable por palabras clave" : "Parece gasto de actividad económica" 
    });
  }

  return json({ error: "Action not supported" }, 400);
});
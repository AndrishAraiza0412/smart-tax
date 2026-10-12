/**
 * Lectura de CFDI (XML 3.3/4.0) que el comercio emite al usuario, y validación
 * de su estatus con el servicio público y gratuito del SAT. La app no timbra:
 * eso lo hace el emisor con su PAC.
 */
export type Cfdi = {
  version: string;
  uuid: string;
  fecha: string; // AAAA-MM-DD
  total: number;
  emisorRfc: string;
  emisorNombre: string;
  receptorRfc: string;
  usoCfdi: string;
};

function attr(xml: string, tag: string, name: string): string {
  const el = new RegExp(`<(?:\\w+:)?${tag}\\b[^>]*>`).exec(xml)?.[0] ?? "";
  return new RegExp(`\\b${name}="([^"]*)"`).exec(el)?.[1] ?? "";
}

/** Extrae los datos clave del XML. Lanza si no es un CFDI timbrado. */
export function parseCfdi(xml: string): Cfdi {
  const uuid = attr(xml, "TimbreFiscalDigital", "UUID");
  const total = Number(attr(xml, "Comprobante", "Total"));
  if (!/<(?:\w+:)?Comprobante\b/.test(xml)) throw new Error("El archivo no es un CFDI.");
  if (!uuid) throw new Error("El CFDI no tiene timbre fiscal (UUID).");
  if (!(total >= 0)) throw new Error("El CFDI no tiene un total válido.");
  return {
    version: attr(xml, "Comprobante", "Version"),
    uuid: uuid.toUpperCase(),
    fecha: attr(xml, "Comprobante", "Fecha").slice(0, 10),
    total,
    emisorRfc: attr(xml, "Emisor", "Rfc").toUpperCase(),
    emisorNombre: attr(xml, "Emisor", "Nombre") || attr(xml, "Emisor", "Rfc"),
    receptorRfc: attr(xml, "Receptor", "Rfc").toUpperCase(),
    usoCfdi: attr(xml, "Receptor", "UsoCFDI"),
  };
}

export type EstadoSat = "vigente" | "cancelado" | "no_encontrado" | "sin_conexion";

/** Consulta el estatus del CFDI en el SAT (ConsultaCFDIService, sin credenciales). */
export async function validarEnSat(c: Pick<Cfdi, "emisorRfc" | "receptorRfc" | "total" | "uuid">): Promise<EstadoSat> {
  const expresion = `?re=${c.emisorRfc}&rr=${c.receptorRfc}&tt=${c.total.toFixed(6)}&id=${c.uuid}`;
  const body = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/"><soap:Body><tem:Consulta><tem:expresionImpresa><![CDATA[${expresion}]]></tem:expresionImpresa></tem:Consulta></soap:Body></soap:Envelope>`;
  try {
    const res = await fetch("https://consultaqr.facturaelectronica.sat.gob.mx/ConsultaCFDIService.svc", {
      method: "POST",
      headers: { "Content-Type": "text/xml; charset=utf-8", SOAPAction: "http://tempuri.org/IConsultaCFDIService/Consulta" },
      body,
    });
    const text = await res.text();
    const estado = /<(?:\w+:)?Estado>([^<]*)</.exec(text)?.[1] ?? "";
    if (/vigente/i.test(estado)) return "vigente";
    if (/cancelado/i.test(estado)) return "cancelado";
    return "no_encontrado";
  } catch {
    return "sin_conexion";
  }
}

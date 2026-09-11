import type { z } from "zod";

import type { GastoManualSchema } from "@smarttax/shared/validation";

type Gasto = z.infer<typeof GastoManualSchema>;

const xmlEscape = (value: string): string =>
  value.replace(/[<>&'"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character] ?? character);

const money = (value: number): string => value.toFixed(2);

export function buildCFDI40XML(gasto: Gasto, emisorRFC: string, emisorRegimen: string): string {
  const fecha = `${gasto.fecha}T00:00:00`;
  const ivaRate = gasto.subtotal > 0 ? gasto.iva / gasto.subtotal : 0.16;
  return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd http://www.sat.gob.mx/TimbreFiscalDigital http://www.sat.gob.mx/sitio_internet/cfd/TimbreFiscalDigital/TimbreFiscalDigitalv11.xsd" Version="4.0" Serie="G" Folio="${xmlEscape(gasto.fecha.replaceAll("-", ""))}" Fecha="${fecha}" SubTotal="${money(gasto.subtotal)}" Moneda="${xmlEscape(gasto.moneda)}" Total="${money(gasto.total)}" TipoDeComprobante="I" Exportacion="01" LugarExpedicion="00000" MetodoPago="${gasto.metodoPago}" FormaPago="${gasto.formaPago}">
  <cfdi:Emisor Rfc="${xmlEscape(emisorRFC)}" Nombre="EMISOR" RegimenFiscal="${xmlEscape(emisorRegimen)}"/>
  <cfdi:Receptor Rfc="${xmlEscape(gasto.rfcProveedor)}" Nombre="${xmlEscape(gasto.razonSocialProveedor)}" DomicilioFiscalReceptor="${gasto.codigoPostal}" RegimenFiscalReceptor="${gasto.regimenFiscal}" UsoCFDI="${gasto.usoCFDI}"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="84111506" Cantidad="1" ClaveUnidad="E48" Descripcion="${xmlEscape(gasto.descripcion)}" ValorUnitario="${money(gasto.subtotal)}" Importe="${money(gasto.subtotal)}" ObjetoImp="02">
      <cfdi:Impuestos><cfdi:Traslados><cfdi:Traslado Base="${money(gasto.subtotal)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="${ivaRate.toFixed(6)}" Importe="${money(gasto.iva)}"/></cfdi:Traslados></cfdi:Impuestos>
    </cfdi:Concepto>
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="${money(gasto.iva)}"><cfdi:Traslados><cfdi:Traslado Base="${money(gasto.subtotal)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="${ivaRate.toFixed(6)}" Importe="${money(gasto.iva)}"/></cfdi:Traslados></cfdi:Impuestos>
  <cfdi:Complemento><tfd:TimbreFiscalDigital Version="1.1" UUID="" FechaTimbrado="" RfcProvCertif="" SelloCFD="" NoCertificadoSAT="" SelloSAT=""/></cfdi:Complemento>
</cfdi:Comprobante>`;
}

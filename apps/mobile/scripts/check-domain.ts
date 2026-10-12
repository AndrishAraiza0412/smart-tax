// Self-check de reglas de dominio: npx tsx scripts/check-domain.ts
import assert from "node:assert/strict";
import { brandOf, luhn, parseTestCard, randomPurchase } from "../lib/cards";
import { parseCfdi } from "../lib/cfdi";
import { ajustarSugerencia, deducibilidad, regimenCompatible, regimenesPara, tipoPersona } from "../lib/fiscal";

// Tarjetas
assert.ok(luhn("4242424242424242"));
assert.ok(!luhn("4242424242424241"));
assert.equal(brandOf("5555555555554444"), "Mastercard");
const now = new Date(2026, 9, 5);
assert.deepEqual(parseTestCard({ number: "4242 4242 4242 4242", expiry: "12/29", holder: "ana" }, now), { brand: "Visa", last4: "4242", holder: "ANA", exp_month: 12, exp_year: 2029 });
assert.throws(() => parseTestCard({ number: "4111111111111111", expiry: "12/29", holder: "x" }, now), /prueba/);
assert.throws(() => parseTestCard({ number: "4242424242424242", expiry: "09/26", holder: "x" }, now), /vencida/);
assert.throws(() => parseTestCard({ number: "4242424242424242", expiry: "13/29", holder: "x" }, now), /Vencimiento/);
const p = randomPurchase(() => 0);
assert.equal(p.descripcion, "Oxxo");
assert.equal(p.monto, 40);

// CFDI
const xml = `<?xml version="1.0"?><cfdi:Comprobante Version="4.0" Fecha="2026-10-01T10:20:00" Total="1160.00" xmlns:cfdi="x">
<cfdi:Emisor Rfc="EKU9003173C9" Nombre="ESCUELA KEMPER URGATE"/><cfdi:Receptor Rfc="xiqb891116qe4" UsoCFDI="G03"/>
<cfdi:Complemento><tfd:TimbreFiscalDigital UUID="ab12cd34-0000-4000-8000-1234567890ab"/></cfdi:Complemento></cfdi:Comprobante>`;
assert.deepEqual(parseCfdi(xml), {
  version: "4.0", uuid: "AB12CD34-0000-4000-8000-1234567890AB", fecha: "2026-10-01", total: 1160,
  emisorRfc: "EKU9003173C9", emisorNombre: "ESCUELA KEMPER URGATE", receptorRfc: "XIQB891116QE4", usoCfdi: "G03",
});
assert.throws(() => parseCfdi("<factura/>"), /no es un CFDI/);
assert.throws(() => parseCfdi(xml.replace(/UUID="[^"]*"/, "")), /UUID/);

// Fiscal
assert.equal(tipoPersona("XIQB891116QE4"), "fisica");
assert.equal(tipoPersona("EKU9003173C9"), "moral");
assert.equal(tipoPersona("123"), null);
assert.deepEqual(regimenesPara("moral", ["601", "605", "626"]), ["601", "626"]);
assert.ok(!regimenCompatible("605", "moral"));
assert.equal(deducibilidad("626", "Oficina", "fisica").deducible, false);
assert.equal(deducibilidad("626", "Oficina", "moral").deducible, true);
assert.equal(deducibilidad("605", "Salud", "fisica").deducible, true);
assert.equal(deducibilidad("605", "Oficina", "fisica").deducible, false);
assert.equal(deducibilidad("612", "Entretenimiento", "fisica").deducible, false);
assert.equal(deducibilidad("612", "Otros", "fisica").deducible, null);
assert.equal(deducibilidad(null, "Oficina", null).deducible, null);

const ai = { facturable: true, razon: "IA" };
assert.equal(ajustarSugerencia(ai, { rfc: "XIQB891116QE4", regimen: "626" }, "Oficina").facturable, false);
assert.deepEqual(ajustarSugerencia(ai, { rfc: "XIQB891116QE4", regimen: "612" }, "Otros"), ai);

console.log("check-domain: ok");

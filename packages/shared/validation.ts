/**
 * Esquemas Zod del dominio fiscal (RFC, régimen, uso CFDI, gasto manual).
 * Se comparten entre la app móvil (formularios) y las Edge Functions.
 */
import { z } from "zod";

import {
  formasPago,
  metodosPago,
  regimenesFiscales,
  tiposRelacion,
  usosCFDI,
} from "./constants/sat-catalogs.js";

export const RFCSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, "RFC inválido");

export const CPSchema = z
  .string()
  .regex(/^\d{5}$/, "El código postal debe tener 5 dígitos")
  .refine((cp: string) => cp !== "99999", "Código postal no encontrado");

export const UsoCFDISchema = z.enum(usosCFDI);
export const RegimenFiscalSchema = z.enum(regimenesFiscales);
export const MetodoPagoSchema = z.enum(metodosPago);
export const FormaPagoSchema = z.enum(formasPago);
export const TipoRelacionSchema = z.enum(tiposRelacion);

export const GastoManualSchema = z.object({
  descripcion: z.string().trim().min(1),
  fecha: z.string().date(),
  rfcProveedor: RFCSchema,
  razonSocialProveedor: z.string().trim().min(1),
  codigoPostal: CPSchema,
  regimenFiscal: RegimenFiscalSchema,
  usoCFDI: UsoCFDISchema,
  metodoPago: MetodoPagoSchema,
  formaPago: FormaPagoSchema,
  subtotal: z.number().nonnegative(),
  iva: z.number().nonnegative(),
  total: z.number().positive(),
  moneda: z.string().length(3).toUpperCase().default("MXN"),
  tipoRelacion: TipoRelacionSchema.optional(),
  uuidRelacionado: z.string().uuid().optional(),
  esAutomatico: z.boolean().default(false),
});

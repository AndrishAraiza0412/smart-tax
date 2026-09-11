import type { z } from "zod";
import type { FormaPagoSchema, GastoManualSchema, CPSchema, MetodoPagoSchema, RegimenFiscalSchema, RFCSchema, TipoRelacionSchema, UsoCFDISchema } from "../validation.js";
export type RFC = z.infer<typeof RFCSchema>;
export type CP = z.infer<typeof CPSchema>;
export type UsoCFDI = z.infer<typeof UsoCFDISchema>;
export type RegimenFiscal = z.infer<typeof RegimenFiscalSchema>;
export type MetodoPago = z.infer<typeof MetodoPagoSchema>;
export type FormaPago = z.infer<typeof FormaPagoSchema>;
export type TipoRelacion = z.infer<typeof TipoRelacionSchema>;
export type GastoManual = z.infer<typeof GastoManualSchema>;
//# sourceMappingURL=index.d.ts.map
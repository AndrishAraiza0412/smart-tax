import { supabase } from "../lib/supabase";
import { useState } from "react";
import type { GastoManual } from "@smarttax/shared";

/**
 * Timbrado CFDI 4.0 vía Edge Function `timbrado`.
 *
 * `timbrar` envía el gasto validado y devuelve el UUID; `pollTimbrado`
 * consulta `timbrado/status/:uuid` cada 2s (máx. 30 intentos) hasta un
 * estado final (`timbrado`/`cancelado`/`error`) con URLs firmadas de XML/PDF.
 */
export function useCFDI() {
  const [polling, setPolling] = useState(false);
  const timbrar = async (gasto: GastoManual) => {
    const { data, error } = await supabase.functions.invoke("timbrado", { body: gasto });
    if (error) throw error;
    return data as { success: boolean; uuid?: string; estado?: string; error?: string };
  };
  const pollTimbrado = async (uuid: string) => {
    setPolling(true);
    try {
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const { data, error } = await supabase.functions.invoke(`timbrado/status/${uuid}`, { method: "GET" });
        if (error) throw error;
        const status = data as { estado: string; xml_url?: string; pdf_url?: string };
        if (["timbrado", "cancelado", "error"].includes(status.estado)) return status;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      throw new Error("El timbrado tardó demasiado");
    } finally { setPolling(false); }
  };
  return { timbrar, pollTimbrado, polling };
}

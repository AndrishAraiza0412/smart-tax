import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { supabase } from "../lib/supabase";

/** RFC y régimen del perfil (se relee al enfocar la pantalla). */
export function useFiscalProfile(): { rfc: string | null; regimen: string | null } {
  const [perfil, setPerfil] = useState<{ rfc: string | null; regimen: string | null }>({ rfc: null, regimen: null });
  useFocusEffect(useCallback(() => {
    void (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from("profiles").select("rfc,regimen_fiscal").eq("id", user.id).single();
        setPerfil({ rfc: (data?.rfc as string | null) ?? null, regimen: (data?.regimen_fiscal as string | null) ?? null });
      } catch {
        // sin red: sin ajuste por régimen
      }
    })();
  }, []));
  return perfil;
}

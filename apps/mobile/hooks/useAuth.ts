import { useEffect, useState } from "react";
import { useRouter, useSegments } from "expo-router";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "../lib/supabase";

/**
 * Guardia de sesión global. Debe montarse una sola vez en el layout raíz.
 *
 * - Restaura la sesión guardada y escucha cambios de autenticación.
 * - Con sesión activa dentro de `(auth)` → redirige a `/(app)`.
 * - Sin sesión fuera de `(auth)` → redirige a `/(auth)/login`.
 */
export function useAuth(): Readonly<{ session: Session | null; loading: boolean }> {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    }).catch(() => {
      // Sin red: se queda sin sesión y el guardián manda a login
      setSession(null);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === "(auth)";
    if (session && inAuth) router.replace("/(app)");
    if (!session && !inAuth) router.replace("/(auth)/login");
  }, [loading, router, segments, session]);

  return { session, loading };
}

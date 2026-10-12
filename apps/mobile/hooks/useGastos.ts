import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { assertCanAddGasto } from "../lib/plan";

export type Gasto = { id: string; descripcion: string; monto: number; fecha: string; facturable: boolean; categoria?: string | null; payment_methods?: { last4: string } | null };
type Filters = { from?: string | undefined; to?: string | undefined; facturable?: boolean | undefined; categoria?: string | undefined };

/**
 * Lee los gastos del usuario autenticado con paginación de 20 y filtros
 * opcionales (rango de fechas, facturación, categoría).
 * RLS en Supabase garantiza que cada usuario solo ve sus propias filas.
 */
export function useGastos(filters: Filters = {}) {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const load = useCallback(async (nextPage = 0, refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      let query = supabase.from("gastos").select("id,descripcion,monto,fecha,facturable,categoria,payment_methods(last4)").order("fecha", { ascending: false }).range(nextPage * 20, nextPage * 20 + 19);
      if (filters.from) query = query.gte("fecha", filters.from);
      if (filters.to) query = query.lte("fecha", filters.to);
      if (filters.facturable !== undefined) query = query.eq("facturable", filters.facturable);
      if (filters.categoria) query = query.eq("categoria", filters.categoria);
      const result = await query;
      if (result.error) setError(result.error.message); else { const rows = (result.data ?? []) as unknown as Gasto[]; setGastos(nextPage ? (current) => [...current, ...rows] : rows); setHasMore(rows.length === 20); setPage(nextPage); }
    } catch (e) {
      // Sin red o backend pausado: se muestra error en UI en vez de crashear
      setError(e instanceof Error ? e.message : "No se pudieron cargar los gastos");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [filters.from, filters.to, filters.facturable, filters.categoria]);
  useEffect(() => { void load(); }, [load]);
  const refresh = useCallback(() => load(0, true), [load]);
  const loadMore = useCallback(() => { if (hasMore && !loading) void load(page + 1); }, [hasMore, loading, load, page]);
  return { gastos, loading, refreshing, error, hasMore, refresh, loadMore };
}

/**
 * Inserta un gasto para el usuario actual. Usa la REST API directamente
 * con el access token del usuario para evitar problemas de RLS con el cliente anon.
 */
export async function insertGasto(payload: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Usuario no autenticado - sin sesión");
  if (!session.user) throw new Error("Usuario no autenticado - sin usuario");
  await assertCanAddGasto();

  const supabaseUrl = process.env["EXPO_PUBLIC_SUPABASE_URL"];
  const anonKey = process.env["EXPO_PUBLIC_SUPABASE_ANON_KEY"];
  if (!supabaseUrl || !anonKey) throw new Error("Configuración Supabase faltante");

  const res = await fetch(`${supabaseUrl}/rest/v1/gastos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${session.access_token}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify({ ...payload, user_id: session.user.id }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Error desconocido" }));
    throw new Error(err.message || `Error ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  return data[0];
}

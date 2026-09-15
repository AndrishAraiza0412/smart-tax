import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export type Gasto = { id: string; descripcion: string; monto: number; fecha: string; facturable: boolean; categoria?: string | null };
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
    let query = supabase.from("gastos").select("id,descripcion,monto,fecha,facturable,categoria").order("fecha", { ascending: false }).range(nextPage * 20, nextPage * 20 + 19);
    if (filters.from) query = query.gte("fecha", filters.from);
    if (filters.to) query = query.lte("fecha", filters.to);
    if (filters.facturable !== undefined) query = query.eq("facturable", filters.facturable);
    if (filters.categoria) query = query.eq("categoria", filters.categoria);
    const result = await query;
    if (result.error) setError(result.error.message); else { const rows = (result.data ?? []) as Gasto[]; setGastos(nextPage ? (current) => [...current, ...rows] : rows); setHasMore(rows.length === 20); setPage(nextPage); }
    setLoading(false); setRefreshing(false);
  }, [filters.from, filters.to, filters.facturable, filters.categoria]);
  useEffect(() => { void load(); }, [load]);
  return { gastos, loading, refreshing, error, hasMore, refresh: () => load(0, true), loadMore: () => hasMore && !loading ? load(page + 1) : undefined };
}

/**
 * Inserta un gasto para el usuario actual. La columna `user_id` debe venir
 * del backend/llamador; las políticas RLS validan la propiedad.
 */
export async function insertGasto(payload: Record<string, unknown>) {
  const { data, error } = await supabase.from("gastos").insert(payload).select().single();
  if (error) throw error;
  return data;
}

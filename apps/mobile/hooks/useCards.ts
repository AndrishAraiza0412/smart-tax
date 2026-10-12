import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { parseTestCard, type CardInput } from "../lib/cards";
import { supabase } from "../lib/supabase";

export type Card = { id: string; brand: string; last4: string; holder: string; exp_month: number; exp_year: number };

/** Tarjetas de prueba del usuario (solo marca y últimos 4). */
export function useCards(): { cards: Card[]; loading: boolean; add: (input: CardInput) => Promise<Card>; remove: (id: string) => Promise<void> } {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      const { data } = await supabase.from("payment_methods").select("id,brand,last4,holder,exp_month,exp_year").order("created_at");
      setCards((data ?? []) as Card[]);
    } catch {
      // Sin red: se conserva la lista actual
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const add = async (input: CardInput): Promise<Card> => {
    const card = parseTestCard(input);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sin sesión");
    const { data, error } = await supabase.from("payment_methods").insert({ ...card, user_id: user.id }).select("id,brand,last4,holder,exp_month,exp_year").single();
    if (error) throw new Error(error.message);
    setCards((c) => [...c, data as Card]);
    return data as Card;
  };

  const remove = async (id: string): Promise<void> => {
    const { error } = await supabase.from("payment_methods").delete().eq("id", id);
    if (error) throw new Error(error.message);
    setCards((c) => c.filter((x) => x.id !== id));
  };

  return { cards, loading, add, remove };
}

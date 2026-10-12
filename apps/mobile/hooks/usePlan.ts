import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { can, getMyPlan, saveMyPlan, type Feature, type Plan } from "../lib/plan";

/** Plan del usuario (se relee al enfocar la pantalla) y sus permisos. */
export function usePlan(): { plan: Plan; loading: boolean; can: (f: Feature) => boolean; setPlan: (p: Plan) => Promise<void> } {
  const [plan, setPlanState] = useState<Plan>("gratis");
  const [loading, setLoading] = useState(true);
  useFocusEffect(useCallback(() => {
    void getMyPlan().then((p) => { setPlanState(p); setLoading(false); });
  }, []));
  const setPlan = async (p: Plan): Promise<void> => {
    await saveMyPlan(p);
    setPlanState(p);
  };
  return { plan, loading, can: (f) => can(plan, f), setPlan };
}

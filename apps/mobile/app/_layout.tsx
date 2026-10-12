import "../global.css";

import { Stack } from "expo-router";
import { useEffect } from "react";

import { useAuth } from "../hooks/useAuth";
import { initPerformance } from "../lib/performance";

// why-did-you-render desactivado: envuelve Pressable (memo) y rompe sus Animated.Value
// ("Transform with key of scale must be a number"). Para depurar re-renders, reactivar a mano.

/** Layout raíz: monta el guardia de sesión y apila (auth)/(app) sin headers nativos. */
export default function RootLayout(): React.JSX.Element {
  useAuth();
  
  useEffect(() => {
    initPerformance();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
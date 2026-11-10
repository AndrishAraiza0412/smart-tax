import "../global.css";
import "../lib/alert-web";

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import { Platform } from "react-native";

import { useAuth } from "../hooks/useAuth";
import { initPerformance } from "../lib/performance";

// why-did-you-render desactivado: envuelve Pressable (memo) y rompe sus Animated.Value
// ("Transform with key of scale must be a number"). Para depurar re-renders, reactivar a mano.

/** Layout raíz: monta el guardia de sesión y apila (auth)/(app) sin headers nativos. */
export default function RootLayout(): React.JSX.Element {
  useAuth();
  const { colorScheme, setColorScheme } = useColorScheme();

  // Web: la clase `dark` no sigue al sistema; se fija explícitamente y se recuerda la elección.
  useEffect(() => {
    if (Platform.OS !== "web") return;
    try {
      const saved = localStorage.getItem("smarttax-theme");
      setColorScheme(saved === "dark" || saved === "light" ? saved : (colorScheme ?? "light"));
    } catch {
      setColorScheme(colorScheme ?? "light");
    }
  }, []);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    try { localStorage.setItem("smarttax-theme", colorScheme ?? "light"); } catch { /* sin storage */ }
  }, [colorScheme]);

  useEffect(() => {
    initPerformance();
  }, []);

  // El fondo por defecto de react-navigation (#f2f2f2) asomaba a los lados de la columna en escritorio.
  const base = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const theme = { ...base, colors: { ...base.colors, background: colorScheme === "dark" ? "#0B0F19" : "#F8FAFC" } };
  return (
    <ThemeProvider value={theme}>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}

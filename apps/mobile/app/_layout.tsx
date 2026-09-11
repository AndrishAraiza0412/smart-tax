import "../global.css";

import { Stack } from "expo-router";

import { useAuth } from "../hooks/useAuth";

/** Layout raíz: monta el guardia de sesión y apila (auth)/(app) sin headers nativos. */
export default function RootLayout(): React.JSX.Element {
  useAuth();
  return <Stack screenOptions={{ headerShown: false }} />;
}

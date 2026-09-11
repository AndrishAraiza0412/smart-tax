import { Stack } from "expo-router";

/** Grupo de autenticación: login, registro y recuperación sin header nativo. */
export default function AuthLayout(): React.JSX.Element {
  return <Stack screenOptions={{ headerShown: false }} />;
}

import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

import { supabase } from "./supabase";

const KEY = "smarttax-biometric-session";

type StoredSession = { access_token: string; refresh_token: string };

/** true si el dispositivo tiene biometría con huellas/caras registradas. */
export async function biometricSupported(): Promise<boolean> {
  const [hardware, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hardware && enrolled;
}

/** true si hay una sesión guardada para desbloqueo biométrico. */
export async function hasStoredSession(): Promise<boolean> {
  return (await SecureStore.getItemAsync(KEY)) !== null;
}

/** Guarda la sesión actual (best-effort) para futuros desbloqueos con biometría. */
export async function saveSessionForBiometrics(): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session?.access_token || !session?.refresh_token) return;
    const stored: StoredSession = { access_token: session.access_token, refresh_token: session.refresh_token };
    await SecureStore.setItemAsync(KEY, JSON.stringify(stored));
  } catch {
    // best-effort: sin sesión guardada el login normal sigue funcionando
  }
}

/** Borra la sesión guardada (llamar al cerrar sesión). */
export async function clearStoredSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // ya estaba limpia
  }
}

export type BiometricResult = "ok" | "no-session" | "cancelled" | "unavailable";

const ATTEMPT_TIMEOUT_MS = 30000;

function timeoutFail(): Promise<BiometricResult> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error("Tiempo agotado. Intenta de nuevo.")), ATTEMPT_TIMEOUT_MS));
}

/** Pide biometría y restaura la sesión guardada (nunca se cuelga: expira a los 30s). */
export async function signInWithBiometrics(): Promise<BiometricResult> {
  return await Promise.race([attemptBiometrics(), timeoutFail()]);
}

async function attemptBiometrics(): Promise<BiometricResult> {
  if (!(await biometricSupported())) return "unavailable";
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) return "no-session";
  const auth = await LocalAuthentication.authenticateAsync({
    promptMessage: "Desbloquea SmartTax",
    disableDeviceFallback: true,
  });
  if (!auth.success) return "cancelled";
  let stored: StoredSession;
  try {
    stored = JSON.parse(raw) as StoredSession;
  } catch {
    await clearStoredSession();
    return "no-session";
  }
  // ponytail: setSession refresca el access_token solo con el refresh_token
  const { error } = await supabase.auth.setSession(stored);
  if (error) {
    await clearStoredSession();
    return "no-session";
  }
  return "ok";
}

import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import * as AppleAuthentication from "expo-apple-authentication";

import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri({ scheme: "smarttax", path: "auth/callback" });

const CANCEL_CODES = new Set(["SIGN_IN_CANCELLED", "ERR_REQUEST_CANCELED"]);

function isCancel(e: unknown): boolean {
  const code = (e as { code?: string })?.code ?? "";
  return CANCEL_CODES.has(code);
}

/** Detecta "módulo nativo ausente" (Expo Go) para caer al OAuth por navegador. */
function isNativeUnavailable(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /turbomodule|native binary|could not be found|not available|unavailable/i.test(msg);
}

type GoogleModule = typeof import("@react-native-google-signin/google-signin");

// ponytail: import dinámico — el estático tumba Expo Go al evaluar el TurboModule ausente
async function loadGoogleSignin(): Promise<GoogleModule["GoogleSignin"]> {
  const mod: GoogleModule = await import("@react-native-google-signin/google-signin");
  return mod.GoogleSignin;
}

let googleConfigured = false;

async function ensureGoogleConfigured(): Promise<GoogleModule["GoogleSignin"]> {
  const GoogleSignin = await loadGoogleSignin();
  if (!googleConfigured) {
    GoogleSignin.configure({
      webClientId: process.env["EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID"],
      iosClientId: process.env["EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID"],
    });
    googleConfigured = true;
  }
  return GoogleSignin;
}

/** Crea la fila en profiles si el usuario aún no tiene (vale para social y email). Nunca lanza. */
export async function ensureProfile(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("profiles").select("id").eq("id", user.id).single();
    if (data) return;
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const name = [meta["full_name"], meta["name"]].find((v): v is string => typeof v === "string" && v.length > 0) ?? "";
    await supabase.from("profiles").insert({ id: user.id, razon_social: name || null });
  } catch {
    // best-effort: el perfil se reintentará en el próximo login
  }
}

/** Fallback web OAuth (Expo Go, Android-Apple, nativo no configurado). */
async function signInWithOAuthBrowser(provider: "apple" | "google"): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw new Error("Sin URL de autorización");
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") return;
  const code = new URL(result.url).searchParams.get("code");
  if (!code) throw new Error("Sin código de autorización");
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
}

/** Apple: nativo en iOS (dev build), navegador en el resto o si falta el módulo. */
/** Traduce "proveedor no habilitado" de Supabase a un mensaje entendible. */
function friendly(provider: "Apple" | "Google", e: unknown): Error {
  const msg = e instanceof Error ? e.message : String(e);
  if (/provider is not enabled|unsupported provider|missing oauth|client_id/i.test(msg)) {
    return new Error(`El inicio con ${provider} aún no está configurado en Supabase (Authentication → Providers → ${provider}).`);
  }
  return e instanceof Error ? e : new Error(msg);
}

export async function signInWithApple(): Promise<void> {
  try {
    await signInWithAppleRaw();
  } catch (e) {
    throw friendly("Apple", e);
  }
}

export async function signInWithGoogle(): Promise<void> {
  try {
    await signInWithGoogleRaw();
  } catch (e) {
    throw friendly("Google", e);
  }
}

async function signInWithAppleRaw(): Promise<void> {
  if (Platform.OS === "ios") {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
      });
      if (!credential.identityToken) throw new Error("Apple no devolvió identityToken");
      const { error } = await supabase.auth.signInWithIdToken({ provider: "apple", token: credential.identityToken });
      if (error) throw error;
      if (credential.fullName) {
        const name = [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(" ");
        if (name) await supabase.auth.updateUser({ data: { full_name: name } });
      }
    } catch (e) {
      if (isCancel(e)) return;
      if (!isNativeUnavailable(e)) throw e;
      await signInWithOAuthBrowser("apple");
    }
  } else {
    await signInWithOAuthBrowser("apple");
  }
  await ensureProfile();
}

/** Google: nativo con fallback a navegador (Expo Go o sin Client IDs). */
async function signInWithGoogleRaw(): Promise<void> {
  try {
    const GoogleSignin = await ensureGoogleConfigured();
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    const idToken = response.data?.idToken ?? null;
    if (!idToken) {
      await signInWithOAuthBrowser("google");
    } else {
      const { error } = await supabase.auth.signInWithIdToken({ provider: "google", token: idToken });
      if (error) throw error;
    }
  } catch (e) {
    if (isCancel(e)) return;
    if (!isNativeUnavailable(e)) throw e;
    await signInWithOAuthBrowser("google");
  }
  await ensureProfile();
}

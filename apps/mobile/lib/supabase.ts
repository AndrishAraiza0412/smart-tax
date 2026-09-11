/**
 * Cliente Supabase compartido por toda la app móvil.
 *
 * Lee la URL y la clave pública desde `apps/mobile/.env.local`
 * (`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
 * El polyfill de URL es necesario porque Hermes (React Native) no
 * implementa el estándar WHATWG URL completo que exige supabase-js.
 */
import "react-native-url-polyfill/auto";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env["EXPO_PUBLIC_SUPABASE_URL"] ?? "https://placeholder.supabase.co";
const supabaseAnonKey = process.env["EXPO_PUBLIC_SUPABASE_ANON_KEY"] ?? "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

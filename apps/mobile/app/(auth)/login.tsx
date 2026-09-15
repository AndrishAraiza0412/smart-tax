import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as LocalAuthentication from "expo-local-authentication";
import { Feather, FontAwesome, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { z } from "zod";

import { Button } from "../../components/ui/button";
import { ThemeToggle } from "../../components/ui/theme-toggle";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { supabase } from "../../lib/supabase";

/**
 * Inicio de sesión con email/contraseña (Supabase Auth), Face ID nativo y
 * accesos sociales (Apple/Google OAuth). Al autenticar redirige a `/(app)`.
 */
const LoginSchema = z.object({ email: z.string().trim().email("Correo inválido"), password: z.string().min(1, "Ingresa tu contraseña") });
type LoginValues = z.infer<typeof LoginSchema>;

export default function LoginScreen(): React.JSX.Element {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({ resolver: zodResolver(LoginSchema), defaultValues: { email: "", password: "" } });

  const submit = async (values: LoginValues): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) Alert.alert("No pudimos iniciar sesión", error.message);
    else router.replace("/(app)");
  };

  const faceId = async (): Promise<void> => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !enrolled) { Alert.alert("Biometría no disponible", "Configura Face ID en tu iPhone para usarlo."); return; }
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: "Ingresa a Smart Tax", fallbackLabel: "Usar contraseña" });
    if (!result.success) return;
    // FaceID successful - sign in with stored credentials or use a secure approach
    // For now, we'll alert the user to use email/password since we don't store credentials
    Alert.alert("Face ID verificado", "Tu identidad ha sido verificada. Por seguridad, ingresa tu correo y contraseña para completar el inicio de sesión.");
  };

  const socialLogin = async (provider: "apple" | "google"): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${process.env['EXPO_PUBLIC_SUPABASE_URL']}/auth/callback`,
        },
      });
      if (error) throw error;
      if (data.url) {
        // In Expo, we need to open the OAuth URL in a browser
        const { openAuthSessionAsync } = await import("expo-web-browser");
        const result = await openAuthSessionAsync(data.url, `${process.env['EXPO_PUBLIC_SUPABASE_URL']}/auth/callback`);
        if (result.type === "success") {
          router.replace("/(app)");
        }
      }
    } catch (error) {
      Alert.alert("Error en login social", error instanceof Error ? error.message : "No se pudo iniciar sesión con " + provider);
    }
  };

  return <ScrollView className="flex-1 bg-canvas dark:bg-night" contentContainerClassName="pb-8">
    <LinearGradient colors={["#1D3BBF", "#2547E8"]} className="rounded-b-[28px] px-5 pb-16">
      <SafeAreaView edges={["top"]}>
        <View className="mt-2 flex-row items-center justify-between">
          <View className="rounded-full bg-white/20 px-3 py-1.5"><Text className="text-[11px] font-bold tracking-wider text-white">GASTOS & FACTURACIÓN IA</Text></View>
          <ThemeToggle />
        </View>
        <View className="mt-6 items-center">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-white">
            <MaterialCommunityIcons name="receipt-text" size={32} color="#2547E8" />
            <View className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-secondary"><Feather name="check" size={12} color="#fff" /></View>
          </View>
          <Text className="mt-4 font-sans text-[22px] font-bold text-white">Bienvenido de nuevo</Text>
          <Text className="mt-2 px-6 text-center font-sans text-sm text-white/75">Gestiona tus gastos, comprobantes y deducciones fiscales en tiempo real con IA.</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>

    <View className="mx-5 -mt-10 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-nightcard">
      <View className="flex-row items-center justify-between">
        <Label>Correo electrónico</Label>
        <View className="rounded-full bg-slate-100 px-2 py-0.5"><Text className="text-[10px] font-semibold text-muted dark:text-slate-400">Requerido</Text></View>
      </View>
      <View className="relative mt-1.5">
        <View className="absolute bottom-0 left-3 top-0 z-10 justify-center"><Feather name="mail" size={16} color="#94A3B8" /></View>
        <Controller control={control} name="email" render={({ field }) => <Input autoCapitalize="none" keyboardType="email-address" placeholder="ejemplo@correo.com" className="pl-10" onChangeText={field.onChange} onBlur={field.onBlur} value={field.value} />} />
      </View>
      {errors.email && <Text className="mb-2 mt-1 text-sm text-red-600">{errors.email.message}</Text>}

      <View className="mt-4 flex-row items-center justify-between">
        <Label>Contraseña</Label>
        <Link className="text-xs font-semibold text-primary" href="/(auth)/recover">¿Olvidaste tu contraseña?</Link>
      </View>
      <View className="relative mt-1.5">
        <View className="absolute bottom-0 left-3 top-0 z-10 justify-center"><Feather name="lock" size={16} color="#94A3B8" /></View>
        <Controller control={control} name="password" render={({ field }) => <Input secureTextEntry={!showPassword} placeholder="••••••••••" className="pl-10 pr-10" onChangeText={field.onChange} onBlur={field.onBlur} value={field.value} />} />
        <Pressable className="absolute bottom-0 right-3 top-0 justify-center" onPress={() => setShowPassword((v) => !v)}><Feather name={showPassword ? "eye-off" : "eye"} size={16} color="#94A3B8" /></Pressable>
      </View>
      {errors.password && <Text className="mb-2 mt-1 text-sm text-red-600">{errors.password.message}</Text>}

      <Button className="mt-5 rounded-xl" disabled={isSubmitting} onPress={() => void handleSubmit(submit)()}>{isSubmitting ? "Entrando…" : "Iniciar sesión  →"}</Button>
      <Pressable className="mt-3 min-h-11 flex-row items-center justify-center rounded-xl bg-skyTint" onPress={() => void faceId()}><Ionicons name="scan-outline" size={16} color="#2547E8" /><Text className="ml-2 font-sans text-sm font-semibold text-primary">Ingresar con Face ID</Text></Pressable>

      <View className="my-5 flex-row items-center">
        <View className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        <Text className="mx-3 text-[11px] font-semibold tracking-wider text-faint">O CONTINÚA CON</Text>
        <View className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
      </View>
      <View className="flex-row gap-3">
        <Pressable className="min-h-11 flex-1 flex-row items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5" onPress={() => socialLogin("apple")}><FontAwesome name="apple" size={18} color="#0F172A" /><Text className="ml-2 font-sans text-sm font-semibold text-ink dark:text-white">Apple</Text></Pressable>
        <Pressable className="min-h-11 flex-1 flex-row items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5" onPress={() => socialLogin("google")}><FontAwesome name="google" size={16} color="#DB4437" /><Text className="ml-2 font-sans text-sm font-semibold text-ink dark:text-white">Google</Text></Pressable>
      </View>

      <View className="mt-5 flex-row justify-center"><Text className="font-sans text-sm text-muted dark:text-slate-400">¿No tienes una cuenta? </Text><Link className="font-sans text-sm font-semibold text-primary" href="/(auth)/register">Regístrate gratis →</Link></View>
    </View>

    <View className="mx-5 mt-4 flex-row items-start rounded-xl border border-emeraldBorder bg-emeraldTint p-3">
      <Feather name="check-circle" size={16} color="#059669" />
      <Text className="ml-2 flex-1 font-sans text-xs leading-4 text-emeraldText">Constitución fiscal inteligente y descarga automática de facturas SAT.</Text>
    </View>
  </ScrollView>;
}
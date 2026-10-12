import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, ScrollView, Text, View } from "react-native";
import { Icon } from "../../components/ui/icon";
import { z } from "zod";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card } from "../../components/ui/card";
import { PressableComponent } from "../../components/ui/pressable";
import { AuthHeader } from "../../components/auth-header";
import { supabase } from "../../lib/supabase";
import { ensureProfile, signInWithApple, signInWithGoogle } from "../../lib/social-auth";
import { useStrings } from "../../lib/strings";

/**
 * Inicio de sesión con email/contraseña (Supabase Auth) y accesos sociales (Apple/Google OAuth). Al autenticar redirige a `/(app)`.
 */
const LoginSchema = z.object({ email: z.string().trim().email("Correo inválido"), password: z.string().min(1, "Ingresa tu contraseña") });
type LoginValues = z.infer<typeof LoginSchema>;

export default function LoginScreen(): React.JSX.Element {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const t = useStrings();
  const { control, handleSubmit, formState: { isSubmitting, isValid } } = useForm<LoginValues>({
    mode: "onTouched",
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const submit = async (values: LoginValues): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithPassword(values);
      if (error) Alert.alert(t.login.loginFail, error.message);
      else {
        await ensureProfile();
        router.replace("/(app)");
      }
    } catch (error) {
      Alert.alert(t.login.loginFail, error instanceof Error ? error.message : "Intenta de nuevo");
    }
  };

  const socialLogin = async (provider: "apple" | "google"): Promise<void> => {
    try {
      if (provider === "apple") await signInWithApple();
      else await signInWithGoogle();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.replace("/(app)");
    } catch (error) {
      Alert.alert(t.login.socialFail, error instanceof Error ? error.message : "No se pudo iniciar sesión con " + provider);
    }
  };

  return (
    <ScrollView className="flex-1 bg-canvas dark:bg-night" contentContainerClassName="pb-8">
      <AuthHeader icon="wallet" badge={t.login.badge} title={t.login.welcome} desc={t.login.welcomeDesc} />

      <Card elevation="elevated" className="mx-5 -mt-3 p-5">
        <View className="flex-row items-center justify-between">
          <Label>{t.login.email}</Label>
          <View className="rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5">
            <Text className="text-[10px] font-semibold text-muted dark:text-slate-400">{t.login.required}</Text>
          </View>
        </View>
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <Input
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder={t.login.emailPh}
              error={fieldState.error?.message}
              valid={fieldState.isTouched && !fieldState.invalid && field.value !== ""}
              leftIcon="mail"
              containerClassName="mt-1.5"
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              value={field.value}
            />
          )}
        />

        <View className="mt-4 flex-row items-center justify-between">
          <Label>{t.login.password}</Label>
          <Link href="/(auth)/recover" asChild>
            <Text accessibilityRole="link" className="font-sans text-xs font-semibold text-primary dark:text-cobalt">{t.login.forgot}</Text>
          </Link>
        </View>
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <Input
              secureTextEntry={!showPassword}
              placeholder={t.login.passPh}
              error={fieldState.error?.message}
              valid={fieldState.isTouched && !fieldState.invalid && field.value !== ""}
              leftIcon="lock"
              containerClassName="mt-1.5"
              rightElement={
                <PressableComponent variant="none" haptic="none" onPress={() => setShowPassword((v) => !v)}>
                  <Icon name={showPassword ? "eye-off" : "eye"} size={16} color="#94A3B8" />
                </PressableComponent>
              }
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              value={field.value}
            />
          )}
        />

        <Button size="lg" fullWidth className="mt-6" disabled={!isValid || isSubmitting} isLoading={isSubmitting} onPress={() => void handleSubmit(submit)()}>
          {isSubmitting ? t.login.entering : t.login.submit}
        </Button>

        <View className="my-5 flex-row items-center">
          <View className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          <Text className="mx-3 text-[11px] font-semibold tracking-wider text-faint">{t.login.divider}</Text>
          <View className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        </View>
        <View className="flex-row gap-3">
          <PressableComponent variant="both" haptic="light" onPress={() => socialLogin("apple")} className="min-h-12 flex-1 flex-row items-center justify-center rounded-xl border border-border bg-transparent active:opacity-70 dark:border-stroke">
            <Icon name="apple" size={18} color="inverse" />
            <Text className="ml-2 font-sans text-sm font-semibold text-ink dark:text-white">Apple</Text>
          </PressableComponent>
          <PressableComponent variant="both" haptic="light" onPress={() => socialLogin("google")} className="min-h-12 flex-1 flex-row items-center justify-center rounded-xl border border-border bg-transparent active:opacity-70 dark:border-stroke">
            <Icon name="google" size={18} color="#DB4437" />
            <Text className="ml-2 font-sans text-sm font-semibold text-ink dark:text-white">Google</Text>
          </PressableComponent>
        </View>

        <View className="mt-5 flex-row justify-center">
          <Text className="font-sans text-sm text-muted dark:text-slate-400">{t.login.noAccount}</Text>
          <Link href="/(auth)/register" asChild>
            <Text accessibilityRole="link" className="font-sans text-sm font-semibold text-primary dark:text-cobalt">{t.login.register}</Text>
          </Link>
        </View>
      </Card>

      <View className="mx-5 mt-4 flex-row items-start rounded-xl border border-emeraldBorder bg-emeraldTint p-3 dark:border-[rgba(16,185,129,0.3)] dark:bg-[rgba(16,185,129,0.12)]">
        <Icon name="check-circle" size={16} color="#059669" />
        <Text className="ml-2 flex-1 font-sans text-xs leading-4 text-emeraldText dark:text-mint">
          Constitución fiscal inteligente y descarga automática de facturas SAT.
        </Text>
      </View>
    </ScrollView>
  );
}
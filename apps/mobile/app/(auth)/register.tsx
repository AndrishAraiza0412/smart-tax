import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, ScrollView, Text, View } from "react-native";
import { Icon } from "../../components/ui/icon";
import { z } from "zod";
import { regimenesFiscales, RFCSchema, RegimenFiscalSchema } from "@smarttax/shared";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import { Card } from "../../components/ui/card";
import { PressableComponent } from "../../components/ui/pressable";
import { AuthHeader } from "../../components/auth-header";
import { supabase } from "../../lib/supabase";
import { ensureProfile, signInWithApple, signInWithGoogle } from "../../lib/social-auth";
import { useStrings } from "../../lib/strings";
import { regimenCompatible, regimenesPara, tipoPersona } from "../../lib/fiscal";

/**
 * Registro con email/contraseña (RFC y régimen opcionales). Crea el
 * usuario en Supabase Auth y su fila en `profiles`; con autoconfirmación
 * entra directo, si no pide confirmar el correo.
 */
const OptionalRFC = z.string().trim()
  .refine((v) => v === "" || RFCSchema.safeParse(v).success, "RFC inválido")
  .transform((v) => (v === "" ? undefined : v.toUpperCase()));
const OptionalRegimen = z.string().trim()
  .refine((v) => v === "" || (regimenesFiscales as readonly string[]).includes(v), "Régimen inválido")
  .transform((v) => (v === "" ? undefined : v));
void RegimenFiscalSchema;

const RegisterSchema = z.object({
  nombre: z.string().trim().min(1, "Ingresa tu nombre"),
  email: z.string().trim().email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  RFC: OptionalRFC,
  regimen_fiscal: OptionalRegimen,
}).refine((v) => regimenCompatible(v.regimen_fiscal, tipoPersona(v.RFC)), {
  path: ["regimen_fiscal"],
  message: "Ese régimen no aplica a tu tipo de persona (RFC de 13 = física, 12 = moral)",
});
type RegisterValues = z.infer<typeof RegisterSchema>;

export default function RegisterScreen(): React.JSX.Element {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { control, handleSubmit, watch, formState: { errors, isSubmitting, isValid } } = useForm<RegisterValues>({
    mode: "onTouched",
    resolver: zodResolver(RegisterSchema),
    defaultValues: { nombre: "", email: "", password: "", RFC: "", regimen_fiscal: "" },
  });
  const t = useStrings();
  const submit = async (values: RegisterValues) => {
    let data;
    try {
      const res = await supabase.auth.signUp({ email: values.email, password: values.password });
      if (res.error) {
        Alert.alert(t.register.failT, res.error.message);
        return;
      }
      data = res.data;
    } catch (error) {
      Alert.alert(t.register.failT, error instanceof Error ? error.message : "Intenta de nuevo");
      return;
    }
    if (data.user && data.session) {
      const profile = await supabase.from("profiles").insert({
        id: data.user.id,
        razon_social: values.nombre,
        rfc: values.RFC ?? null,
        regimen_fiscal: values.regimen_fiscal ?? null,
      });
      if (profile.error) {
        Alert.alert(t.register.profileFail, profile.error.message);
        return;
      }
      await ensureProfile();
      Alert.alert(t.register.okT, t.register.okSession);
      router.replace("/(app)");
      return;
    }
    Alert.alert(t.register.okT, t.register.okConfirm);
    router.replace("/(auth)/login");
  };
  const socialSignup = async (provider: "apple" | "google"): Promise<void> => {
    try {
      if (provider === "apple") await signInWithApple();
      else await signInWithGoogle();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.replace("/(app)");
    } catch (error) {
      Alert.alert(t.login.socialFail, error instanceof Error ? error.message : "No se pudo continuar con " + provider);
    }
  };
  const fieldError = (message: string | undefined): React.JSX.Element | null =>
    message ? <Text className="mb-2 mt-1 text-sm text-red-600">{message}</Text> : null;
  return (
    <ScrollView className="flex-1 bg-canvas dark:bg-night" contentContainerClassName="pb-8">
      <AuthHeader icon="user-plus" badge={t.register.badge} title={t.register.title} desc={t.register.desc} />

      <Card elevation="elevated" className="mx-5 -mt-3 p-5">
        <PressableComponent variant="both" haptic="light" onPress={() => void socialSignup("apple")} className="min-h-12 flex-row items-center justify-center rounded-xl border border-border bg-transparent active:opacity-70 dark:border-stroke">
          <Icon name="apple" size={18} color="inverse" />
          <Text className="ml-2 font-sans text-sm font-semibold text-ink dark:text-white">{t.register.withApple}</Text>
        </PressableComponent>
        <PressableComponent variant="both" haptic="light" onPress={() => void socialSignup("google")} className="mt-3 min-h-12 flex-row items-center justify-center rounded-xl border border-border bg-transparent active:opacity-70 dark:border-stroke">
          <Icon name="google" size={18} color="#DB4437" />
          <Text className="ml-2 font-sans text-sm font-semibold text-ink dark:text-white">{t.register.withGoogle}</Text>
        </PressableComponent>

        <View className="my-5 flex-row items-center">
          <View className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          <Text className="mx-3 font-sans text-[11px] font-semibold tracking-wider text-faint">{t.register.divider}</Text>
          <View className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        </View>

        <Label>{t.register.name}</Label>
        <Controller
          control={control}
          name="nombre"
          render={({ field, fieldState }) => (
            <Input error={fieldState.error?.message} valid={fieldState.isTouched && !fieldState.invalid && field.value !== ""} onBlur={field.onBlur} placeholder="Tu nombre" leftIcon="user" containerClassName="mt-1.5" onChangeText={field.onChange} value={field.value} />
          )}
        />

        <View className="mt-4">
          <Label>{t.register.email}</Label>
        </View>
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <Input
              error={fieldState.error?.message}
              valid={fieldState.isTouched && !fieldState.invalid && (field.value ?? "") !== ""}
              onBlur={field.onBlur}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="ejemplo@correo.com"
              leftIcon="mail"
              containerClassName="mt-1.5"
              onChangeText={field.onChange}
              value={field.value}
            />
          )}
        />

        <View className="mt-4">
          <Label>{t.register.pass}</Label>
        </View>
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <Input
              error={fieldState.error?.message}
              valid={fieldState.isTouched && !fieldState.invalid && (field.value ?? "") !== ""}
              onBlur={field.onBlur}
              secureTextEntry={!showPassword}
              placeholder="Mínimo 8 caracteres"
              leftIcon="lock"
              containerClassName="mt-1.5"
              rightElement={
                <PressableComponent variant="none" haptic="none" onPress={() => setShowPassword((v) => !v)}>
                  <Icon name={showPassword ? "eye-off" : "eye"} size={16} color="#94A3B8" />
                </PressableComponent>
              }
              onChangeText={field.onChange}
              value={field.value}
            />
          )}
        />

        <View className="mt-4 flex-row items-baseline gap-1.5">
          <Label>{t.register.rfc}</Label>
          <Text className="font-sans text-xs text-faint">{t.register.optional}</Text>
        </View>
        <Controller
          control={control}
          name="RFC"
          render={({ field, fieldState }) => (
            <Input
              error={fieldState.error?.message}
              valid={fieldState.isTouched && !fieldState.invalid && (field.value ?? "") !== ""}
              onBlur={field.onBlur}
              autoCapitalize="characters"
              placeholder={t.register.rfcPh}
              leftIcon="file-text"
              containerClassName="mt-1.5"
              onChangeText={field.onChange}
              value={field.value ?? ""}
            />
          )}
        />

        <View className="mt-4 flex-row items-baseline gap-1.5">
          <Label>{t.register.regimen}</Label>
          <Text className="font-sans text-xs text-faint">{t.register.optional}</Text>
        </View>
        <Controller
          control={control}
          name="regimen_fiscal"
          render={({ field }) => (
            <Select
              options={regimenesPara(tipoPersona(watch("RFC")), regimenesFiscales).map((regimen) => ({ value: regimen, label: regimen }))}
              value={field.value ?? ""}
              onChange={field.onChange}
              placeholder={t.register.regimenPh}
            />
          )}
        />
        {fieldError(errors.regimen_fiscal?.message)}

        <Button size="lg" fullWidth className="mt-6" disabled={!isValid || isSubmitting} isLoading={isSubmitting} onPress={() => void handleSubmit(submit)()}>
          {isSubmitting ? t.register.creating : t.register.submit}
        </Button>
        <View className="mt-5 flex-row justify-center">
          <Text className="font-sans text-sm text-muted dark:text-slate-400">{t.register.footer}</Text>
          <Link href="/(auth)/login" asChild>
            <Text accessibilityRole="link" className="font-sans text-sm font-semibold text-primary dark:text-cobalt">{t.register.login}</Text>
          </Link>
        </View>
      </Card>
    </ScrollView>
  );
}
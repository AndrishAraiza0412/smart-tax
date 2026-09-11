import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { z } from "zod";

import { Button } from "../../components/ui/button";
import { ThemeToggle } from "../../components/ui/theme-toggle";
import { Input } from "../../components/ui/input";
import { supabase } from "../../lib/supabase";

/** Recupera la contraseña vía `resetPasswordForEmail` (enlace al correo). */
const RecoverSchema = z.object({ email: z.string().trim().email("Correo inválido") });
type RecoverValues = z.infer<typeof RecoverSchema>;

export default function RecoverScreen(): React.JSX.Element {
  const router = useRouter();
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<RecoverValues>({ resolver: zodResolver(RecoverSchema), defaultValues: { email: "" } });
  const submit = async ({ email }: RecoverValues): Promise<void> => { const { error } = await supabase.auth.resetPasswordForEmail(email); if (error) Alert.alert("No pudimos enviar el correo", error.message); else Alert.alert("Correo enviado", "Revisa tu bandeja para restablecer tu contraseña."); };
  return <ScrollView className="flex-1 bg-canvas dark:bg-night" contentContainerClassName="pb-8">
    <SafeAreaView edges={["top"]}>
      <View className="mt-2 flex-row items-center justify-between px-5">
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-white" onPress={() => router.back()}><Feather name="arrow-left" size={18} color="#0F172A" /></Pressable>
        <View className="flex-row items-center rounded-full bg-skyTint px-3 py-1.5"><View className="h-1.5 w-1.5 rounded-full bg-primary" /><Text className="ml-1.5 text-[11px] font-bold tracking-wider text-primary">SEGURIDAD & ACCESO</Text></View>
        <ThemeToggle />
      </View>

      <View className="mt-6 items-center px-8">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-skyTint">
          <Feather name="shield" size={30} color="#2547E8" />
          <View className="absolute -bottom-0.5 -right-0.5 h-5 w-5 items-center justify-center rounded-full bg-secondary"><Feather name="zap" size={10} color="#fff" /></View>
        </View>
        <Text className="mt-4 font-sans text-[22px] font-bold text-ink dark:text-white">Recuperar contraseña</Text>
        <Text className="mt-2 text-center font-sans text-sm leading-5 text-muted dark:text-slate-400">Ingresa tu correo o teléfono vinculado y te enviaremos un token seguro de 6 dígitos para validar tu identidad fiscal.</Text>
      </View>

      <View className="mx-5 mt-6 flex-row rounded-xl bg-slate-100 dark:bg-white/10 p-1">
        <View className="flex-1 flex-row items-center justify-center rounded-lg bg-white py-2.5 shadow-sm"><Feather name="mail" size={14} color="#2547E8" /><Text className="ml-1.5 font-sans text-sm font-semibold text-primary">Por Correo</Text></View>
        <View className="flex-1 flex-row items-center justify-center py-2.5"><Feather name="message-square" size={14} color="#94A3B8" /><Text className="ml-1.5 font-sans text-sm font-medium text-muted dark:text-slate-400">SMS / WhatsApp</Text></View>
      </View>

      <View className="mx-5 mt-5">
        <Text className="text-[11px] font-bold tracking-wider text-muted dark:text-slate-400">CORREO ELECTRÓNICO REGISTRADO</Text>
        <View className="relative mt-1.5">
          <View className="absolute bottom-0 left-3 top-0 z-10 justify-center"><Feather name="at-sign" size={16} color="#94A3B8" /></View>
          <Controller control={control} name="email" render={({ field }) => <Input autoCapitalize="none" keyboardType="email-address" placeholder="ejemplo@correo.com" className="border-slate-200 bg-white dark:border-white/10 dark:bg-nightcard pl-10" onChangeText={field.onChange} value={field.value} />} />
        </View>
        {errors.email && <Text className="mb-2 mt-1 text-sm text-red-600">{errors.email.message}</Text>}
        <View className="mt-1.5 flex-row items-center"><Feather name="check-circle" size={12} color="#94A3B8" /><Text className="ml-1.5 font-sans text-xs text-faint">Conectado con el padrón de autenticación fiscal</Text></View>
      </View>

      <Button className="mx-5 mt-5 rounded-xl" disabled={isSubmitting} onPress={() => void handleSubmit(submit)()}>{isSubmitting ? "Enviando…" : "Enviar instrucciones  ✈"} </Button>

      <View className="mx-5 mt-4 rounded-[20px] border border-slate-200 bg-white dark:border-white/10 dark:bg-nightcard p-4">
        <View className="flex-row items-start">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-skyTint"><Feather name="clock" size={14} color="#2547E8" /></View>
          <View className="ml-3 flex-1">
            <Text className="font-sans text-sm font-semibold text-ink dark:text-white">¿No recibiste el código?</Text>
            <Text className="mt-0.5 font-sans text-xs leading-4 text-muted dark:text-slate-400">Verifica tu bandeja de spam o solicita reenvío en <Text className="font-bold text-primary">00:43</Text></Text>
          </View>
        </View>
      </View>

      <View className="mx-5 mt-4 flex-row items-center justify-center gap-4">
        <View className="flex-row items-center"><Feather name="lock" size={12} color="#94A3B8" /><Text className="ml-1 font-sans text-[11px] text-faint">Cifrado bancario AES-256</Text></View>
        <Text className="font-sans text-[11px] text-faint">SAT · CFDI 4.0</Text>
      </View>

      <View className="mt-5 flex-row justify-center"><Text className="font-sans text-sm text-muted dark:text-slate-400">¿Recordaste tu clave? </Text><Link className="font-sans text-sm font-semibold text-primary" href="/(auth)/login">Iniciar sesión ›</Link></View>
    </SafeAreaView>
  </ScrollView>;
}

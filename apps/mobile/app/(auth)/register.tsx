import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { z } from "zod";
import { GastoManualSchema, regimenesFiscales, RFCSchema, RegimenFiscalSchema } from "@smarttax/shared";

import { Button } from "../../components/ui/button";
import { ThemeToggle } from "../../components/ui/theme-toggle";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import { supabase } from "../../lib/supabase";

/**
 * Registro con datos fiscales (RFC + régimen del catálogo SAT). Crea el
 * usuario en Supabase Auth y su fila en `profiles`; con autoconfirmación
 * entra directo, si no pide confirmar el correo.
 */
const RegisterSchema = z.object({ nombre: z.string().trim().min(1, "Ingresa tu nombre"), email: z.string().trim().email("Correo inválido"), password: z.string().min(8, "Mínimo 8 caracteres"), RFC: RFCSchema, regimen_fiscal: RegimenFiscalSchema });
type RegisterValues = z.infer<typeof RegisterSchema>;
void GastoManualSchema;

export default function RegisterScreen(): React.JSX.Element {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterValues>({ resolver: zodResolver(RegisterSchema), defaultValues: { nombre: "", email: "", password: "", RFC: "", regimen_fiscal: regimenesFiscales[0] } });
  const submit = async (values: RegisterValues): Promise<void> => {
    const { data, error } = await supabase.auth.signUp({ email: values.email, password: values.password });
    if (error) { Alert.alert("No pudimos crear tu cuenta", error.message); return; }
    if (data.user) {
      const profile = await supabase.from("profiles").insert({ id: data.user.id, razon_social: values.nombre, rfc: values.RFC, regimen_fiscal: values.regimen_fiscal });
      if (profile.error) { Alert.alert("No pudimos guardar tu perfil", profile.error.message); return; }
    }
    Alert.alert("Cuenta creada", data.session ? "Bienvenido a Smart Tax" : "Revisa tu correo para confirmar tu cuenta");
    if (data.session) router.replace("/(app)");
  };
  const fieldError = (message: string | undefined): React.JSX.Element | null => message ? <Text className="mb-2 mt-1 text-sm text-red-600">{message}</Text> : null;
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
          <Text className="mt-4 font-sans text-[22px] font-bold text-white">Crea tu cuenta</Text>
          <Text className="mt-2 px-6 text-center font-sans text-sm text-white/75">Tus datos fiscales, en un solo lugar.</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>

    <View className="mx-5 -mt-10 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-nightcard">
      <Label>Nombre o razón social</Label>
      <View className="relative mt-1.5">
        <View className="absolute bottom-0 left-3 top-0 z-10 justify-center"><Feather name="user" size={16} color="#94A3B8" /></View>
        <Controller control={control} name="nombre" render={({ field }) => <Input placeholder="Tu nombre" className="pl-10" onChangeText={field.onChange} value={field.value} />} />
      </View>
      {fieldError(errors.nombre?.message)}

      <View className="mt-4"><Label>Correo electrónico</Label></View>
      <View className="relative mt-1.5">
        <View className="absolute bottom-0 left-3 top-0 z-10 justify-center"><Feather name="mail" size={16} color="#94A3B8" /></View>
        <Controller control={control} name="email" render={({ field }) => <Input autoCapitalize="none" keyboardType="email-address" placeholder="ejemplo@correo.com" className="pl-10" onChangeText={field.onChange} value={field.value} />} />
      </View>
      {fieldError(errors.email?.message)}

      <View className="mt-4"><Label>Contraseña</Label></View>
      <View className="relative mt-1.5">
        <View className="absolute bottom-0 left-3 top-0 z-10 justify-center"><Feather name="lock" size={16} color="#94A3B8" /></View>
        <Controller control={control} name="password" render={({ field }) => <Input secureTextEntry={!showPassword} placeholder="Mínimo 8 caracteres" className="pl-10 pr-10" onChangeText={field.onChange} value={field.value} />} />
        <Pressable className="absolute bottom-0 right-3 top-0 justify-center" onPress={() => setShowPassword((v) => !v)}><Feather name={showPassword ? "eye-off" : "eye"} size={16} color="#94A3B8" /></Pressable>
      </View>
      {fieldError(errors.password?.message)}

      <View className="mt-4"><Label>RFC</Label></View>
      <View className="relative mt-1.5">
        <View className="absolute bottom-0 left-3 top-0 z-10 justify-center"><Feather name="file-text" size={16} color="#94A3B8" /></View>
        <Controller control={control} name="RFC" render={({ field }) => <Input autoCapitalize="characters" placeholder="XAXX010101000" className="pl-10" onChangeText={field.onChange} value={field.value} />} />
      </View>
      {fieldError(errors.RFC?.message)}

      <View className="mt-4"><Label>Régimen fiscal</Label></View>
      <View className="mt-1.5 rounded-md border border-slate-300 dark:border-white/10">
        <Controller control={control} name="regimen_fiscal" render={({ field }) => <Select selectedValue={field.value} onValueChange={field.onChange}>{regimenesFiscales.map((regimen) => <Select.Item key={regimen} label={regimen} value={regimen} />)}</Select>} />
      </View>
      {fieldError(errors.regimen_fiscal?.message)}

      <Button className="mt-5 rounded-xl" disabled={isSubmitting} onPress={() => void handleSubmit(submit)()}>{isSubmitting ? "Creando…" : "Crear cuenta  →"}</Button>
      <View className="mt-5 flex-row justify-center"><Text className="font-sans text-sm text-muted dark:text-slate-400">¿Ya tienes cuenta? </Text><Link className="font-sans text-sm font-semibold text-primary" href="/(auth)/login">Inicia sesión</Link></View>
    </View>
  </ScrollView>;
}

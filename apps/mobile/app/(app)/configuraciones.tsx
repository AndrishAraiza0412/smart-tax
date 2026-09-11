import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useColorScheme } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { supabase } from "../../lib/supabase";
import { openLink } from "../../lib/belvo";
import { Link, useRouter } from "expo-router";

/**
 * Configuración: perfil fiscal (RFC/régimen desde `profiles`), apariencia
 * (tema claro/oscuro real), preferencias, interruptores de IA, seguridad,
 * conexión bancaria Belvo y cierre de sesión.
 */
function Row({ icon, label, value, onPress }: { icon: string; label: string; value?: string; onPress?: () => void }): React.JSX.Element {
  return <Pressable className="flex-row items-center py-3" onPress={onPress}>
    <View className="h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/10"><Feather name={icon as never} size={18} color="#2547E8" /></View>
    <Text className="ml-3 flex-1 font-sans text-[15px] text-ink dark:text-white">{label}</Text>
    {value && <Text className="mr-2 font-sans text-sm text-muted dark:text-slate-400">{value}</Text>}
    <Feather name="chevron-right" size={18} color="#94A3B8" />
  </Pressable>;
}

function ToggleRow({ icon, label, value, onChange }: { icon: string; label: string; value: boolean; onChange: (v: boolean) => void }): React.JSX.Element {
  return <View className="flex-row items-center py-3">
    <View className="h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/10"><Feather name={icon as never} size={18} color="#2547E8" /></View>
    <Text className="ml-3 flex-1 font-sans text-[15px] text-ink dark:text-white">{label}</Text>
    <Switch value={value} onValueChange={onChange} trackColor={{ true: "#2547E8" }} />
  </View>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return <View className="mx-5 mt-4 rounded-[20px] border border-slate-200 bg-white dark:border-white/10 dark:bg-nightcard px-4 py-2">
    <Text className="pb-1 pt-2 text-[11px] font-bold tracking-widest text-muted dark:text-slate-400">{title}</Text>
    {children}
  </View>;
}

export default function Configuraciones(): React.JSX.Element {
  const router = useRouter();
  const [rfc, setRfc] = useState(""); const [regimen, setRegimen] = useState(""); const [email, setEmail] = useState("");
  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      const { data } = await supabase.from("profiles").select("rfc,regimen_fiscal").eq("id", user.id).single();
      if (data) { setRfc((data.rfc as string | null) ?? ""); setRegimen((data.regimen_fiscal as string | null) ?? ""); }
    })();
  }, []);
  const [autoDetect, setAutoDetect] = useState(true); const [autoDownload, setAutoDownload] = useState(true); const [biometria, setBiometria] = useState(true);
  const { colorScheme, setColorScheme } = useColorScheme();
  const dark = colorScheme === "dark";
  const save = async () => { const { data: { user } } = await supabase.auth.getUser(); if (!user) return; const { error } = await supabase.from("profiles").update({ rfc, regimen_fiscal: regimen }).eq("id", user.id); Alert.alert(error ? "No se pudo guardar" : "Perfil actualizado", error?.message); };
  const logout = async () => { await supabase.auth.signOut(); router.replace("/(auth)/login"); };
  return <ScrollView className="flex-1 bg-canvas dark:bg-night" contentContainerClassName="pb-8">
    <SafeAreaView edges={["top"]}>
      <View className="mt-2 flex-row items-center justify-between px-5">
        <Text className="font-sans text-[22px] font-bold text-ink dark:text-white">Configuración</Text>
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-white"><Feather name="settings" size={18} color="#0F172A" /></Pressable>
      </View>

      <View className="mx-5 mt-4 flex-row items-center rounded-[20px] border border-slate-200 bg-white dark:border-white/10 dark:bg-nightcard p-4">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-primary"><Text className="font-sans text-lg font-bold text-white">CM</Text></View>
        <View className="ml-3 flex-1">
          <Text className="font-sans text-[15px] font-semibold text-ink dark:text-white">Mi perfil fiscal</Text>
          <Text className="mt-0.5 font-sans text-xs text-muted dark:text-slate-400">{email || "Cargando…"}</Text>
        </View>
        <Feather name="chevron-right" size={18} color="#94A3B8" />
      </View>

      <LinearGradient colors={["#1D3BBF", "#2547E8"]} className="mx-5 mt-4 rounded-[20px] p-5">
        <Text className="font-sans text-lg font-bold text-white">Pasa a Plan Pro IA</Text>
        <Text className="mt-1 font-sans text-[13px] text-white/75">Timbrado ilimitado y escaneo con inteligencia artificial.</Text>
        <Link href="/(app)/planes" asChild><Pressable className="mt-3 items-center rounded-xl bg-white py-3"><Text className="font-sans text-sm font-bold text-primary">Ver Planes y Facturación ›</Text></Pressable></Link>
      </LinearGradient>

      <Section title="PERFIL FISCAL">
        <View className="py-2">
          <Label>RFC</Label>
          <Input value={rfc} onChangeText={setRfc} autoCapitalize="characters" placeholder="XAXX010101000" />
          <View className="mt-3"><Label>Régimen fiscal</Label></View>
          <Input value={regimen} onChangeText={setRegimen} placeholder="601" keyboardType="number-pad" />
          <Button className="mb-2 mt-3 rounded-xl" onPress={() => void save()}>Guardar cambios</Button>
        </View>
      </Section>

      <Section title="APARIENCIA">
        <ToggleRow icon="moon" label="Tema oscuro" value={dark} onChange={(v) => setColorScheme(v ? "dark" : "light")} />
      </Section>

      <Section title="PREFERENCIAS">
        <Row icon="globe" label="Idioma" value="Español" />
        <Row icon="dollar-sign" label="Tipo de Moneda" value="MXN $" />
        <Row icon="clock" label="Zona Horaria" value="GMT-06 CDMX" />
      </Section>

      <Section title="INTELIGENCIA ARTIFICIAL">
        <ToggleRow icon="zap" label="Auto-detección de gastos" value={autoDetect} onChange={setAutoDetect} />
        <ToggleRow icon="download" label="Descarga de facturas" value={autoDownload} onChange={setAutoDownload} />
        <Row icon="award" label="Certificados Digitales" value="E-firma" />
        <ToggleRow icon="smartphone" label="Biometría (Face ID)" value={biometria} onChange={setBiometria} />
      </Section>

      <Section title="SEGURIDAD & ACCESO">
        <Row icon="lock" label="Cambiar contraseña" />
      </Section>

      <Section title="SOPORTE & LEGAL">
        <Row icon="help-circle" label="Preguntas frecuentes" />
        <Row icon="file-text" label="Términos del servicio" />
      </Section>

      <View className="mx-5 mt-4 rounded-[20px] border border-slate-200 bg-white dark:border-white/10 dark:bg-nightcard p-4">
        <Text className="mb-2 text-[11px] font-bold tracking-widest text-muted dark:text-slate-400">CONEXIONES BANCARIAS</Text>
        <Button accessibilityLabel="Conectar banco" className="rounded-xl" onPress={() => void openLink()}>Conectar banco</Button>
      </View>

      <Pressable className="mx-5 mt-4 items-center rounded-[20px] border border-roseBorder bg-white py-4" onPress={() => void logout()}>
        <Text className="font-sans text-[15px] font-semibold text-roseText">Cerrar Sesión</Text>
      </Pressable>
      <Text className="mt-4 text-center font-sans text-xs text-faint">SmartTax v1.0.0</Text>
    </SafeAreaView>
  </ScrollView>;
}

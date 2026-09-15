import { useState, useEffect } from "react";
import { Alert, Image, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { insertGasto } from "../../hooks/useGastos";
import { supabase } from "../../lib/supabase";

type Extracted = { descripcion: string; monto: string; fecha: string; categoria: string };

export default function Escanear(): React.JSX.Element {
  const router = useRouter();
  const [photo, setPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [detectingFacturable, setDetectingFacturable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<Extracted | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<{ facturable: boolean; razon: string } | null>(null);

  const pick = async (camera: boolean): Promise<void> => {
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permiso necesario", camera ? "Permite el acceso a la cámara en Ajustes para tomar fotos de tus comprobantes." : "Permite el acceso a tus fotos en Ajustes para elegir comprobantes.", [
        { text: "Abrir Ajustes", onPress: () => void Linking.openSettings() },
        { text: "Cancelar", style: "cancel" },
      ]);
      return;
    }
    const result = camera ? await ImagePicker.launchCameraAsync({ quality: 0.7 }) : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) { setPhoto(result.assets[0].uri); setData(null); setAiSuggestion(null); }
  };

  const analyze = async (): Promise<void> => {
    setAnalyzing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setAnalyzing(false);
    setData({ descripcion: "Compra detectada", monto: "385.00", fecha: new Date().toISOString().slice(0, 10), categoria: "Alimentación" });
  };

  // Auto-detect facturable when data is extracted
  useEffect(() => {
    if (!data || !data.descripcion || !data.categoria) return;
    const timer = setTimeout(async () => {
      setDetectingFacturable(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch(`${process.env['EXPO_PUBLIC_SUPABASE_URL']}/functions/v1/asesor-ia`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'] ?? "",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: "detect_facturable", descripcion: data.descripcion, categoria: data.categoria }),
        });
        if (res.ok) {
          const result = await res.json();
          setAiSuggestion({ facturable: result.facturable, razon: result.razon });
        }
      } catch {
        // Silencioso
      } finally {
        setDetectingFacturable(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [data]);

  const save = async (): Promise<void> => {
    if (!data) return;
    setSaving(true);
    try {
      const facturable = aiSuggestion?.facturable ?? true;
      await insertGasto({ descripcion: data.descripcion, fecha: data.fecha, monto: Number(data.monto), categoria: data.categoria, facturable, es_automatico: true, cfdi_estado: facturable ? "facturable" : "no_facturable" });
      Alert.alert("Gasto guardado", `Se creó desde tu comprobante escaneado. ${facturable ? "Marcado como facturable" : "Marcado como no facturable"}.`);
      router.replace("/(app)/mis-gastos");
    } catch (error) { Alert.alert("No se pudo guardar", error instanceof Error ? error.message : "Intenta de nuevo"); }
    setSaving(false);
  };

  return <ScrollView className="flex-1 bg-canvas dark:bg-night" contentContainerClassName="pb-8">
    <SafeAreaView edges={["top"]}>
      <View className="mt-2 px-5">
        <Text className="font-sans text-[22px] font-bold text-ink dark:text-white">Escanear comprobante</Text>
        <Text className="mt-1 font-sans text-[13px] text-muted dark:text-slate-400">La IA extrae monto, fecha, comercio y detecta si es facturable</Text>
      </View>

      <LinearGradient colors={["#1D3BBF", "#2547E8"]} className="mx-5 mt-4 items-center rounded-[20px] p-6">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-white/20"><Feather name="camera" size={30} color="#fff" /></View>
        <Text className="mt-3 text-center font-sans text-[15px] font-semibold text-white">Fotografía tu ticket o factura</Text>
        <Text className="mt-1 text-center font-sans text-[13px] text-white/75">Extracción automática de datos fiscales</Text>
      </LinearGradient>

      <View className="mx-5 mt-4 flex-row gap-3">
        <Pressable className="flex-1 flex-row items-center justify-center rounded-xl bg-primary py-3.5" onPress={() => void pick(true)}>
          <Feather name="camera" size={16} color="#fff" /><Text className="ml-2 font-sans text-sm font-semibold text-white">Tomar foto</Text>
        </Pressable>
        <Pressable className="flex-1 flex-row items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-nightcard py-3.5" onPress={() => void pick(false)}>
          <Feather name="image" size={16} color="#2547E8" /><Text className="ml-2 font-sans text-sm font-semibold text-primary">Galería</Text>
        </Pressable>
      </View>

      {photo && <View className="mx-5 mt-4 overflow-hidden rounded-[20px] border border-slate-200 bg-white dark:border-white/10 dark:bg-nightcard">
        <Image source={{ uri: photo }} className="h-56 w-full" resizeMode="cover" />
        <View className="p-4">
          {!data ? <Button className="rounded-xl" disabled={analyzing} onPress={() => void analyze()}>{analyzing ? "Analizando con IA…" : "Analizar con IA"}</Button>
          : <View>
            <Label>Comercio detectado</Label>
            <Input className="mt-1.5" value={data.descripcion} onChangeText={(v) => setData({ ...data, descripcion: v })} />
            <View className="mt-3 flex-row gap-3">
              <View className="flex-1"><Label>Monto</Label><Input className="mt-1.5" keyboardType="decimal-pad" value={data.monto} onChangeText={(v) => setData({ ...data, monto: v })} /></View>
              <View className="flex-1"><Label>Fecha</Label><Input className="mt-1.5" value={data.fecha} onChangeText={(v) => setData({ ...data, fecha: v })} /></View>
            </View>
            <View className="mt-3"><Label>Categoría</Label>
              <View className="mt-1.5 rounded-md border border-slate-300 bg-white dark:border-white/10 dark:bg-white/5">
                <select defaultValue={data.categoria} onChange={(e) => setData({ ...data, categoria: e.target.value })} className="w-full bg-transparent py-2 px-3 text-ink dark:text-white">
                  <option value="Alimentación">Alimentación</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Servicios">Servicios</option>
                  <option value="Salud">Salud</option>
                  <option value="Oficina">Oficina</option>
                  <option value="Educación">Educación</option>
                  <option value="Entretenimiento">Entretenimiento</option>
                  <option value="Otros">Otros</option>
                </select>
              </View>
            </View>
            {aiSuggestion && <View className="mt-3 p-3 rounded-lg bg-skyTint border border-skyBorder"><Text className="font-sans text-xs text-skyText">🤖 IA sugiere: <Text className="font-semibold">{aiSuggestion.facturable ? "Facturable" : "No facturable"}</Text> — {aiSuggestion.razon}</Text>{detectingFacturable && <Text className="font-sans text-xs text-skyText mt-1">Analizando facturabilidad…</Text>}</View>}
            <Button className="mt-4 rounded-xl bg-secondary" disabled={saving} onPress={() => void save()}>{saving ? "Guardando…" : "Guardar gasto"}</Button>
            <Pressable className="mt-3 items-center" onPress={() => void analyze()}><Text className="font-sans text-sm font-semibold text-primary">Re-analizar</Text></Pressable>
          </View>}
        </View>
      </View>}
    </SafeAreaView>
  </ScrollView>;
}
import { useState } from "react";
import { Alert, Image, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { insertGasto } from "../../hooks/useGastos";

/**
 * Escaneo de comprobantes: foto o galería (expo-image-picker, con permiso
 * explícito), análisis IA simulado con campos editables y guardado real
 * en `gastos` como borrador automático. Redirige a Mis gastos al guardar.
 */
type Extracted = { descripcion: string; monto: string; fecha: string };

export default function Escanear(): React.JSX.Element {
  const router = useRouter();
  const [photo, setPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<Extracted | null>(null);

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
    if (!result.canceled && result.assets[0]) { setPhoto(result.assets[0].uri); setData(null); }
  };

  const analyze = async (): Promise<void> => {
    setAnalyzing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setAnalyzing(false);
    setData({ descripcion: "Compra detectada", monto: "385.00", fecha: new Date().toISOString().slice(0, 10) });
  };

  const save = async (): Promise<void> => {
    if (!data) return;
    setSaving(true);
    try {
      await insertGasto({ descripcion: data.descripcion, fecha: data.fecha, monto: Number(data.monto), uso_cfdi: "G03", metodo_pago: "PUE", forma_pago: "99", es_automatico: true, cfdi_estado: "borrador", categoria: "Otros" });
      Alert.alert("Gasto guardado", "Se creó desde tu comprobante escaneado.");
      router.replace("/(app)/mis-gastos");
    } catch (error) { Alert.alert("No se pudo guardar", error instanceof Error ? error.message : "Intenta de nuevo"); }
    setSaving(false);
  };

  return <ScrollView className="flex-1 bg-canvas dark:bg-night" contentContainerClassName="pb-8">
    <SafeAreaView edges={["top"]}>
      <View className="mt-2 px-5">
        <Text className="font-sans text-[22px] font-bold text-ink dark:text-white">Escanear comprobante</Text>
        <Text className="mt-1 font-sans text-[13px] text-muted dark:text-slate-400">La IA extrae monto, fecha y comercio de tu ticket</Text>
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
            <Button className="mt-4 rounded-xl bg-secondary" disabled={saving} onPress={() => void save()}>{saving ? "Guardando…" : "Guardar gasto"}</Button>
            <Pressable className="mt-3 items-center" onPress={() => void analyze()}><Text className="font-sans text-sm font-semibold text-primary">Re-analizar</Text></Pressable>
          </View>}
        </View>
      </View>}
    </SafeAreaView>
  </ScrollView>;
}

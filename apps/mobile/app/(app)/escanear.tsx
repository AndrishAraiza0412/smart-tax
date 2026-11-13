import { useState, useEffect } from "react";
import { Alert, Image, Linking, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HeroGradient } from "../../components/hero-gradient";
import { AiSuggestion } from "../../components/ai-suggestion";
import { Icon } from "../../components/ui/icon";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { usosCFDI } from "@smarttax/shared";
import { Link, useRouter } from "expo-router";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { CategoryGrid } from "../../components/ui/category-grid";
import { Switch } from "../../components/ui/switch";
import { Card } from "../../components/ui/card";
import { PressableComponent } from "../../components/ui/pressable";
import { insertGasto } from "../../hooks/useGastos";
import { supabase } from "../../lib/supabase";
import { fill, useStrings } from "../../lib/strings";
import { ajustarSugerencia } from "../../lib/fiscal";
import { parseCfdi, validarEnSat } from "../../lib/cfdi";
import { usePlan } from "../../hooks/usePlan";
import { useFiscalProfile } from "../../hooks/useFiscalProfile";

type Item = { nombre: string; precio: string; categoria: string };
type Extracted = { descripcion: string; monto: string; fecha: string; categoria: string; items: Item[] };
const CATEGORIAS = ["Alimentación", "Transporte", "Servicios", "Salud", "Oficina", "Educación", "Entretenimiento", "Otros"] as const;

// Un ticket se lee bien a ~1280 px; la foto completa solo hace lenta la subida y la lectura de la IA.
const shrink = async (uri: string): Promise<{ uri: string; base64: string | null }> => {
  const ctx = ImageManipulator.manipulate(uri);
  ctx.resize({ width: 1280 });
  const img = await (await ctx.renderAsync()).saveAsync({ format: SaveFormat.JPEG, compress: 0.6, base64: true });
  return { uri: img.uri, base64: img.base64 ?? null };
};

export default function Escanear(): React.JSX.Element {
  const router = useRouter();
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [detectingFacturable, setDetectingFacturable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<Extracted | null>(null);
  const [facturable, setFacturable] = useState(true);
  const [dudosos, setDudosos] = useState<string[]>([]);
  const t = useStrings();
  const [aiSuggestion, setAiSuggestion] = useState<{ facturable: boolean; razon: string } | null>(null);
  const { can } = usePlan();
  const perfil = useFiscalProfile();

  const upsell = (message: string): void => {
    Alert.alert(t.pro.upsellT, message, [
      { text: t.pro.cancel, style: "cancel" },
      { text: t.pro.seePlans, onPress: () => router.push("/(app)/planes") },
    ]);
  };

  const importXml = async (asset: DocumentPicker.DocumentPickerAsset): Promise<void> => {
    if (!can("cfdiImport")) return upsell(t.pro.upsellXml);
    try {
      const xml = await (await fetch(asset.uri)).text();
      const cfdi = parseCfdi(xml);
      const estado = await validarEnSat(cfdi);
      const mine = (perfil.rfc ?? "").toUpperCase();
      const otherRfc = mine !== "" && cfdi.receptorRfc !== mine;
      const facturable = estado !== "cancelado" && !otherRfc;
      await insertGasto({
        descripcion: cfdi.emisorNombre,
        monto: cfdi.total,
        fecha: cfdi.fecha || new Date().toLocaleDateString("en-CA"),
        categoria: "Otros",
        facturable,
        es_automatico: true,
        rfc_receptor: cfdi.receptorRfc || null,
        uso_cfdi: (usosCFDI as readonly string[]).includes(cfdi.usoCfdi) ? cfdi.usoCfdi : null,
        cfdi_uuid: cfdi.uuid,
        cfdi_xml: xml,
        cfdi_estado: `cfdi_${estado}`,
      });
      const lines = [
        `${cfdi.emisorNombre} · $${cfdi.total.toFixed(2)}`,
        `UUID ${cfdi.uuid}`,
        `${t.pro.xmlEstado}: ${t.pro[estado]}`,
        otherRfc ? fill(t.pro.xmlOtherRfc, { rr: cfdi.receptorRfc, mine }) : "",
      ].filter(Boolean);
      Alert.alert(t.pro.xmlT, lines.join("\n"));
      router.replace("/(app)/mis-gastos");
    } catch (e) {
      Alert.alert(t.pro.xmlFail, e instanceof Error ? e.message : "Intenta de nuevo");
    }
  };

  // Archivos: una imagen entra al flujo normal de escaneo; un XML se importa como CFDI.
  const pickFile = async (): Promise<void> => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: ["image/*", "text/xml", "application/xml"], copyToCacheDirectory: true });
      const asset = picked.canceled ? null : picked.assets[0];
      if (!asset) return;
      if (asset.mimeType?.includes("xml") || asset.name.toLowerCase().endsWith(".xml")) return await importXml(asset);
      const img = await shrink(asset.uri);
      setPhoto(img.uri);
      setPhotoBase64(img.base64);
      setData(null);
      setDudosos([]);
      setAiSuggestion(null);
      setFacturable(true);
    } catch (error) {
      Alert.alert(t.scan.netFail, error instanceof Error ? error.message : "Intenta de nuevo");
    }
  };

  const upload = (): void => {
    Alert.alert(t.scan.uploadFrom, undefined, [
      { text: t.scan.fromGallery, onPress: () => void pick(false) },
      { text: t.scan.fromFiles, onPress: () => void pickFile() },
      { text: t.scan.cancel, style: "cancel" },
    ]);
  };

  const pick = async (camera: boolean): Promise<void> => {
    try {
      const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(t.scan.permTitle, camera ? t.scan.permCam : t.scan.permLib, [
          { text: t.scan.settings, onPress: () => { Linking.openSettings().catch(() => undefined); } },
          { text: t.scan.cancel, style: "cancel" },
        ]);
        return;
      }
      const result = camera
        ? await ImagePicker.launchCameraAsync({ quality: 1, exif: false })
        : await ImagePicker.launchImageLibraryAsync({ quality: 1, exif: false });
      if (!result.canceled && result.assets[0]) {
        const img = await shrink(result.assets[0].uri);
        setPhoto(img.uri);
        setPhotoBase64(img.base64);
        setData(null);
        setDudosos([]);
        setAiSuggestion(null);
        setFacturable(true);
      }
    } catch (error) {
      Alert.alert(t.scan.netFail, error instanceof Error ? error.message : "Intenta de nuevo");
    }
  };

  const analyze = async (): Promise<void> => {
    if (!can("aiScan")) return upsell(t.pro.upsellScan);
    if (!photoBase64) {
      Alert.alert(t.scan.noPhoto, t.scan.noPhotoMsg);
      return;
    }
    setAnalyzing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert(t.scan.noSession, t.scan.noSessionMsg);
        return;
      }
      const res = await fetch(`${process.env["EXPO_PUBLIC_SUPABASE_URL"]}/functions/v1/asesor-ia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env["EXPO_PUBLIC_SUPABASE_ANON_KEY"] ?? "",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: "analyze_ticket", imageBase64: photoBase64, mimeType: "image/jpeg" }),
        signal: AbortSignal.timeout(65000),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        Alert.alert(t.scan.readFail, typeof body.error === "string" ? body.error : t.scan.readFailMsg);
        return;
      }
      setData({
        descripcion: String(body.descripcion ?? "Compra detectada"),
        monto: String(body.monto ?? "0"),
        fecha: String(body.fecha ?? new Date().toLocaleDateString("en-CA")),
        categoria: CATEGORIAS.includes(body.categoria as (typeof CATEGORIAS)[number]) ? String(body.categoria) : "Otros",
        items: (Array.isArray(body.items) ? body.items : []).map((i: Record<string, unknown>) => ({
          nombre: String(i["nombre"] ?? ""),
          precio: String(i["precio"] ?? "0"),
          categoria: CATEGORIAS.includes(i["categoria"] as (typeof CATEGORIAS)[number]) ? String(i["categoria"]) : "Otros",
        })),
      });
      setDudosos(Array.isArray(body.dudosos) ? body.dudosos.map(String) : []);
      const categoria = CATEGORIAS.includes(body.categoria as (typeof CATEGORIAS)[number]) ? String(body.categoria) : "Otros";
      const sugerencia = ajustarSugerencia({ facturable: Boolean(body.facturable ?? true), razon: String(body.razon ?? "") }, perfil, categoria);
      setFacturable(sugerencia.facturable);
      setAiSuggestion(sugerencia);
    } catch (e) {
      const timedOut = e instanceof Error && e.name === "TimeoutError";
      Alert.alert(t.scan.netFail, timedOut ? "Tardó demasiado en responder. Intenta de nuevo con una foto bien iluminada." : e instanceof Error ? e.message : "Intenta de nuevo");
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!data || !data.descripcion || !data.categoria || aiSuggestion) return;
    const timer = setTimeout(async () => {
      setDetectingFacturable(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch(`${process.env["EXPO_PUBLIC_SUPABASE_URL"]}/functions/v1/asesor-ia`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env["EXPO_PUBLIC_SUPABASE_ANON_KEY"] ?? "",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: "detect_facturable", descripcion: data.descripcion, categoria: data.categoria }),
        });
        if (res.ok) {
          const result = await res.json();
          const sugerencia = ajustarSugerencia({ facturable: Boolean(result.facturable), razon: String(result.razon ?? "") }, perfil, data.categoria);
          setAiSuggestion(sugerencia);
          setFacturable(sugerencia.facturable);
        }
      } catch {
        // Silencioso
      } finally {
        setDetectingFacturable(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [data]);

  const items = data?.items ?? [];
  const sumaItems = items.reduce((t, i) => t + (Number(i.precio) || 0), 0);
  const descuadre = !!data && items.length > 0 && Math.abs(sumaItems - Number(data.monto)) > 0.5;

  const save = async (): Promise<void> => {
    if (!data) return;
    setSaving(true);
    try {
      // Con artículos: un gasto por categoría (suma de sus artículos); sin ellos, el gasto único de siempre.
      const grupos = new Map<string, Item[]>();
      for (const i of items) grupos.set(i.categoria, [...(grupos.get(i.categoria) ?? []), i]);
      const filas = grupos.size === 0
        ? [{ descripcion: data.descripcion, monto: Number(data.monto), categoria: data.categoria }]
        : [...grupos].map(([categoria, g]) => ({
            descripcion: `${data.descripcion} · ${g.map((i) => i.nombre).join(", ")}`.slice(0, 120),
            monto: Math.round(g.reduce((t, i) => t + (Number(i.precio) || 0), 0) * 100) / 100,
            categoria,
          }));
      for (const f of filas) {
        await insertGasto({ ...f, fecha: data.fecha, facturable, es_automatico: true, cfdi_estado: facturable ? "facturable" : "no_facturable" });
      }
      Alert.alert(t.scan.savedT, facturable ? t.scan.savedFact : t.scan.savedNoFact);
      router.replace("/(app)/mis-gastos");
    } catch (error) {
      Alert.alert(t.scan.saveFail, error instanceof Error ? error.message : "Intenta de nuevo");
    }
    setSaving(false);
  };

  return (
    <ScrollView className="flex-1 bg-canvas dark:bg-night" contentContainerClassName="pb-8">
      <SafeAreaView edges={["top"]}>
        <View className="mx-5 mt-2 overflow-hidden rounded-3xl">
        <HeroGradient style={{ padding: 20 }}>
          <View className="flex-row items-center justify-between">
            <PressableComponent variant="scale" haptic="light" onPress={() => router.replace("/(app)/dashboard")} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <Icon name="arrow-left" size={18} color="#fff" />
            </PressableComponent>
            <View className="flex-row items-center rounded-full bg-white/20 px-3 py-1.5">
              <View className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <Text className="ml-1.5 font-sans text-[11px] font-bold tracking-wider text-white">{t.scan.ocrOn}</Text>
            </View>
            <View className="h-10 w-10" />
          </View>
          <Text className="mt-4 font-sans text-[22px] font-bold text-white">{t.scan.heroTitle}</Text>
          <Text className="mt-1 font-sans text-[13px] leading-5 text-white/75">{t.scan.heroDesc}</Text>
        </HeroGradient>
        </View>

        {!photo ? (
          <>
            <PressableComponent variant="scale" haptic="light" onPress={() => void pick(true)} className="mx-5 mt-4 rounded-2xl border border-border bg-surface p-4 shadow-fintech dark:border-stroke dark:bg-nightcard">
              <View className="items-center rounded-xl border-2 border-dashed border-primary/40 px-4 py-6 dark:border-cobalt/50">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-skyTint dark:bg-white/10">
                  <Icon name="camera" size={26} color="#3B82F6" />
                </View>
                <Text className="mt-3 text-center font-sans text-[15px] font-bold text-ink dark:text-white">{t.scan.dropTitle}</Text>
                <Text className="mt-1 text-center font-sans text-[13px] text-muted dark:text-slate-400">{t.scan.dropSub}</Text>
                <View className="mt-3 flex-row gap-2">
                  {["JPG", "PNG"].map((fmt) => (
                    <View key={fmt} className="rounded-md border border-border bg-slate-50 px-2 py-1 dark:border-stroke dark:bg-white/5">
                      <Text className="font-sans text-[11px] font-bold text-muted dark:text-slate-300">{fmt}</Text>
                    </View>
                  ))}
                  <View className="rounded-md border border-primary/40 bg-primary/10 px-2 py-1 dark:border-cobalt/50 dark:bg-cobalt/15">
                    <Text className="font-sans text-[11px] font-bold text-primary dark:text-cobalt">XML (CFDI)</Text>
                  </View>
                </View>
              </View>
            </PressableComponent>

            <View className="mx-5 mt-4 flex-row gap-3">
              <PressableComponent variant="both" haptic="light" onPress={() => void pick(true)} className="flex-1 flex-row items-center justify-center rounded-xl bg-primary py-3.5 shadow-primary dark:bg-cobalt dark:shadow-glow-primary">
                <Icon name="camera" size={16} color="#fff" />
                <Text className="ml-2 font-sans text-sm font-semibold text-white">{t.scan.photo}</Text>
              </PressableComponent>
              <PressableComponent variant="both" haptic="light" onPress={upload} className="flex-1 flex-row items-center justify-center rounded-xl border border-border bg-surface py-3.5 dark:border-stroke dark:bg-nightcard">
                <Icon name="upload" size={16} color="#2547E8" />
                <Text className="ml-2 font-sans text-sm font-semibold text-ink dark:text-white">{t.scan.gallery}</Text>
              </PressableComponent>
            </View>

            <View className="mx-5 mt-6 flex-row items-center justify-between">
              <Text className="font-sans text-label-caps uppercase tracking-[0.06em] text-muted dark:text-slate-400">{t.scan.docTitle}</Text>
              <Link href="/(app)/asesor">
                <Text className="font-sans text-xs font-semibold text-primary dark:text-cobalt">{t.scan.docGuide}</Text>
              </Link>
            </View>
            <View className="mx-5 mt-2 flex-row gap-3">
              <View className="flex-1 items-center rounded-2xl border border-border bg-surface p-5 dark:border-stroke dark:bg-nightcard">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-skyTint">
                  <Icon name="receipt" size={22} color="#2547E8" />
                </View>
                <Text className="mt-2 text-center font-sans text-[15px] font-semibold text-ink dark:text-white">{t.scan.docReceipts}</Text>
                <Text className="mt-0.5 text-center font-sans text-xs text-muted dark:text-slate-300">{t.scan.docReceiptsDesc}</Text>
              </View>
              <View className="flex-1 items-center rounded-2xl border border-border bg-surface p-5 dark:border-stroke dark:bg-nightcard">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emeraldTint">
                  <Icon name="file-text" size={22} color="#059669" />
                </View>
                <Text className="mt-2 text-center font-sans text-[15px] font-semibold text-ink dark:text-white">{t.scan.docInvoice}</Text>
                <Text className="mt-0.5 text-center font-sans text-xs text-muted dark:text-slate-300">{t.scan.docInvoiceDesc}</Text>
              </View>
            </View>
            <View className="mx-5 mt-3 flex-row gap-3">
              <View className="flex-1 items-center rounded-2xl border border-border bg-surface p-5 dark:border-stroke dark:bg-nightcard">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-roseTint">
                  <Icon name="heart" size={22} color="#E11D48" />
                </View>
                <Text className="mt-2 text-center font-sans text-[15px] font-semibold text-ink dark:text-white">{t.scan.docMedical}</Text>
                <Text className="mt-0.5 text-center font-sans text-xs text-muted dark:text-slate-300">{t.scan.docMedicalDesc}</Text>
              </View>
              <View className="flex-1 items-center rounded-2xl border border-border bg-surface p-5 dark:border-stroke dark:bg-nightcard">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#FEF3C7]">
                  <Icon name="send" size={22} color="#D97706" />
                </View>
                <Text className="mt-2 text-center font-sans text-[15px] font-semibold text-ink dark:text-white">{t.scan.docTravel}</Text>
                <Text className="mt-0.5 text-center font-sans text-xs text-muted dark:text-slate-300">{t.scan.docTravelDesc}</Text>
              </View>
            </View>
          </>
        ) : (
          <>

            {photo && (
              <Card elevation="flat" className="mx-5 mt-4 overflow-hidden">
                <Image source={{ uri: photo }} className="h-56 w-full" resizeMode="cover" />
                <View className="p-4">
                  {!data ? (
                    <Button disabled={analyzing} isLoading={analyzing} onPress={() => void analyze()}>
                      {analyzing ? t.scan.analyzing : t.scan.analyze}
                    </Button>
                  ) : (
                    <View>
                      <Label>{t.scan.commerce}</Label>
                      <Input containerClassName="mt-1.5" value={data.descripcion} onChangeText={(v) => setData({ ...data, descripcion: v })} />
                      <View className="mt-3 flex-row gap-3">
                        <View className="flex-1">
                          <Label>{t.scan.amount}</Label>
                          <Input containerClassName="mt-1.5" className="tabular-nums" keyboardType="decimal-pad" value={data.monto} onChangeText={(v) => setData({ ...data, monto: v })} />
                        </View>
                        <View className="flex-1">
                          <Label>{t.scan.date}</Label>
                          <Input containerClassName="mt-1.5" value={data.fecha} onChangeText={(v) => setData({ ...data, fecha: v })} />
                        </View>
                      </View>
                      {dudosos.length > 0 && (
                        <Text className="mt-3 font-sans text-xs text-amber-600 dark:text-amber-400">{fill(t.scan.unsure, { f: dudosos.join(", ") })}</Text>
                      )}
                      {items.length > 0 ? (
                        <View className="mt-3">
                          <Label>{t.scan.items}</Label>
                          {items.map((it, idx) => {
                            const patch = (p: Partial<Item>): void => setData({ ...data, items: items.map((x, j) => (j === idx ? { ...x, ...p } : x)) });
                            return (
                              <View key={idx} className="mt-2 rounded-xl border border-border p-2 dark:border-stroke">
                                <View className="flex-row items-center gap-2">
                                  <Input containerClassName="flex-1" size="sm" value={it.nombre} onChangeText={(v) => patch({ nombre: v })} />
                                  <Input containerClassName="w-24" size="sm" keyboardType="decimal-pad" value={it.precio} onChangeText={(v) => patch({ precio: v })} />
                                  <PressableComponent variant="scale" haptic="light" accessibilityLabel={t.scan.removeItem} onPress={() => setData({ ...data, items: items.filter((_, j) => j !== idx) })}>
                                    <Icon name="x" size={16} color="#94A3B8" />
                                  </PressableComponent>
                                </View>
                                <PressableComponent variant="scale" haptic="selection" accessibilityLabel={t.scan.category} onPress={() => patch({ categoria: CATEGORIAS[(CATEGORIAS.indexOf(it.categoria as (typeof CATEGORIAS)[number]) + 1) % CATEGORIAS.length] ?? "Otros" })} className="mt-2 self-start rounded-full bg-primary/10 px-3 py-1 dark:bg-cobalt/15">
                                  <Text className="font-sans text-xs font-semibold text-primary dark:text-cobalt">{it.categoria} ›</Text>
                                </PressableComponent>
                              </View>
                            );
                          })}
                          {descuadre && (
                            <Text className="mt-2 font-sans text-xs text-amber-600 dark:text-amber-400">
                              {fill(t.scan.mismatch, { s: sumaItems.toFixed(2), t: Number(data.monto).toFixed(2) })}
                            </Text>
                          )}
                        </View>
                      ) : (
                        <View className="mt-3">
                          <Label>{t.scan.category}</Label>
                          <CategoryGrid value={data.categoria} onChange={(v) => setData({ ...data, categoria: v })} />
                        </View>
                      )}
                      {aiSuggestion && (
                        <AiSuggestion
                          prefix={t.scan.suggests}
                          verdict={aiSuggestion.facturable ? t.scan.facturable : t.scan.noFacturable}
                          reason={aiSuggestion.razon}
                          pending={detectingFacturable && t.scan.factCheck}
                        />
                      )}
                      <View className="mt-3 flex-row items-center justify-between rounded-xl border border-border p-3 dark:border-stroke">
                        <Text className="font-sans text-sm font-semibold text-ink dark:text-white">
                          {facturable ? t.scan.facturable : t.scan.noFacturable}
                        </Text>
                        <Switch value={facturable} onValueChange={(v) => setFacturable(v)} />
                      </View>
                      <Button variant="secondary" size="lg" fullWidth className="mt-4" disabled={saving} isLoading={saving} onPress={() => void save()}>
                        {saving ? t.scan.saving : t.scan.save}
                      </Button>
                      <PressableComponent variant="none" haptic="none" onPress={() => void analyze()} className="mt-3 items-center">
                        <Text className="font-sans text-sm font-semibold text-primary dark:text-cobalt">{t.scan.reanalyze}</Text>
                      </PressableComponent>
                    </View>
                  )}
                </View>
              </Card>
            )}
          </>
        )}
      </SafeAreaView>
    </ScrollView>
  );
}
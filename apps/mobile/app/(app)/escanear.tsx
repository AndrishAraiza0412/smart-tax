import { useState, useEffect } from "react";
import { Alert, Image, Linking, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HeroGradient } from "../../components/hero-gradient";
import { AiSuggestion } from "../../components/ai-suggestion";
import { Icon } from "../../components/ui/icon";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
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

type Extracted = { descripcion: string; monto: string; fecha: string; categoria: string };
const CATEGORIAS = ["Alimentación", "Transporte", "Servicios", "Salud", "Oficina", "Educación", "Entretenimiento", "Otros"] as const;

export default function Escanear(): React.JSX.Element {
  const router = useRouter();
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [detectingFacturable, setDetectingFacturable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<Extracted | null>(null);
  const [facturable, setFacturable] = useState(true);
  const t = useStrings();
  const [aiSuggestion, setAiSuggestion] = useState<{ facturable: boolean; razon: string } | null>(null);
  const [importing, setImporting] = useState(false);
  const { can } = usePlan();
  const perfil = useFiscalProfile();

  const upsell = (message: string): void => {
    Alert.alert(t.pro.upsellT, message, [
      { text: t.pro.cancel, style: "cancel" },
      { text: t.pro.seePlans, onPress: () => router.push("/(app)/planes") },
    ]);
  };

  const importXml = async (): Promise<void> => {
    if (!can("cfdiImport")) return upsell(t.pro.upsellXml);
    const picked = await DocumentPicker.getDocumentAsync({ type: ["text/xml", "application/xml", "*/*"], copyToCacheDirectory: true });
    const asset = picked.canceled ? null : picked.assets[0];
    if (!asset) return;
    setImporting(true);
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
    } finally {
      setImporting(false);
    }
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
        ? await ImagePicker.launchCameraAsync({ quality: 0.5, base64: true, exif: false })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.5, base64: true, exif: false });
      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri);
        setPhotoBase64(result.assets[0].base64 ?? null);
        setData(null);
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
      });
      const categoria = CATEGORIAS.includes(body.categoria as (typeof CATEGORIAS)[number]) ? String(body.categoria) : "Otros";
      const sugerencia = ajustarSugerencia({ facturable: Boolean(body.facturable ?? true), razon: String(body.razon ?? "") }, perfil, categoria);
      setFacturable(sugerencia.facturable);
      setAiSuggestion(sugerencia);
    } catch (e) {
      Alert.alert(t.scan.netFail, e instanceof Error ? e.message : "Intenta de nuevo");
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

  const save = async (): Promise<void> => {
    if (!data) return;
    setSaving(true);
    try {
      await insertGasto({
        descripcion: data.descripcion,
        fecha: data.fecha,
        monto: Number(data.monto),
        categoria: data.categoria,
        facturable,
        es_automatico: true,
        cfdi_estado: facturable ? "facturable" : "no_facturable",
      });
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
                  {["JPG", "PNG", "PDF"].map((fmt) => (
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
              <PressableComponent variant="both" haptic="light" onPress={() => void pick(false)} className="flex-1 flex-row items-center justify-center rounded-xl border border-border bg-surface py-3.5 dark:border-stroke dark:bg-nightcard">
                <Icon name="upload" size={16} color="#2547E8" />
                <Text className="ml-2 font-sans text-sm font-semibold text-ink dark:text-white">{t.scan.gallery}</Text>
              </PressableComponent>
            </View>
            <Button variant="outline" size="lg" leftIcon="file-text" className="mx-5 mt-3" isLoading={importing} disabled={importing} onPress={() => void importXml()}>
              {t.pro.importXml}
            </Button>

            <View className="mx-5 mt-6 flex-row items-center justify-between">
              <Text className="font-sans text-label-caps uppercase tracking-[0.06em] text-muted dark:text-slate-400">{t.scan.docTitle}</Text>
              <Link href="/(app)/asesor">
                <Text className="font-sans text-xs font-semibold text-primary dark:text-cobalt">{t.scan.docGuide}</Text>
              </Link>
            </View>
            <View className="mx-5 mt-2 flex-row gap-3">
              <PressableComponent variant="scale" haptic="selection" onPress={() => void pick(false)} className="flex-1 items-center rounded-2xl border border-border bg-surface p-5 dark:border-stroke dark:bg-nightcard">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-skyTint">
                  <Icon name="receipt" size={22} color="#2547E8" />
                </View>
                <Text className="mt-2 text-center font-sans text-[15px] font-semibold text-ink dark:text-white">{t.scan.docReceipts}</Text>
                <Text className="mt-0.5 text-center font-sans text-xs text-muted dark:text-slate-300">{t.scan.docReceiptsDesc}</Text>
              </PressableComponent>
              <PressableComponent variant="scale" haptic="selection" onPress={() => void pick(false)} className="flex-1 items-center rounded-2xl border border-border bg-surface p-5 dark:border-stroke dark:bg-nightcard">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emeraldTint">
                  <Icon name="file-text" size={22} color="#059669" />
                </View>
                <Text className="mt-2 text-center font-sans text-[15px] font-semibold text-ink dark:text-white">{t.scan.docInvoice}</Text>
                <Text className="mt-0.5 text-center font-sans text-xs text-muted dark:text-slate-300">{t.scan.docInvoiceDesc}</Text>
              </PressableComponent>
            </View>
            <View className="mx-5 mt-3 flex-row gap-3">
              <PressableComponent variant="scale" haptic="selection" onPress={() => void pick(false)} className="flex-1 items-center rounded-2xl border border-border bg-surface p-5 dark:border-stroke dark:bg-nightcard">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-roseTint">
                  <Icon name="heart" size={22} color="#E11D48" />
                </View>
                <Text className="mt-2 text-center font-sans text-[15px] font-semibold text-ink dark:text-white">{t.scan.docMedical}</Text>
                <Text className="mt-0.5 text-center font-sans text-xs text-muted dark:text-slate-300">{t.scan.docMedicalDesc}</Text>
              </PressableComponent>
              <PressableComponent variant="scale" haptic="selection" onPress={() => void pick(false)} className="flex-1 items-center rounded-2xl border border-border bg-surface p-5 dark:border-stroke dark:bg-nightcard">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#FEF3C7]">
                  <Icon name="send" size={22} color="#D97706" />
                </View>
                <Text className="mt-2 text-center font-sans text-[15px] font-semibold text-ink dark:text-white">{t.scan.docTravel}</Text>
                <Text className="mt-0.5 text-center font-sans text-xs text-muted dark:text-slate-300">{t.scan.docTravelDesc}</Text>
              </PressableComponent>
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
                      <View className="mt-3">
                        <Label>{t.scan.category}</Label>
                        <CategoryGrid
                          value={data.categoria}
                          onChange={(v) => setData({ ...data, categoria: v })}
                        />
                      </View>
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
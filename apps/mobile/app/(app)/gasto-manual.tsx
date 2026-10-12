import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "expo-router";
import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GastoSchema } from "@smarttax/shared";
import type { z } from "zod";
import { Button } from "../../components/ui/button";
import { AiSuggestion } from "../../components/ai-suggestion";
import { ScreenHeader } from "../../components/screen-header";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { CategoryGrid } from "../../components/ui/category-grid";
import { Card } from "../../components/ui/card";
import { Switch } from "../../components/ui/switch";
import { insertGasto } from "../../hooks/useGastos";
import { supabase } from "../../lib/supabase";
import { useStrings } from "../../lib/strings";
import { ajustarSugerencia } from "../../lib/fiscal";
import { useFiscalProfile } from "../../hooks/useFiscalProfile";

type Values = z.input<typeof GastoSchema>;
const CATEGORIAS = ["Alimentación", "Transporte", "Servicios", "Salud", "Oficina", "Educación", "Entretenimiento", "Otros"] as const;
const defaults: Values = { descripcion: "", fecha: new Date().toLocaleDateString("en-CA"), monto: 0, categoria: "Otros", facturable: true };

function SectionLabel({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <Text className="mb-2 mt-5 font-sans text-label-caps uppercase tracking-[0.06em] text-muted dark:text-slate-400">{children}</Text>;
}

export default function GastoManual(): React.JSX.Element {
  const { control, handleSubmit, watch, reset, setValue, formState: { isSubmitting } } = useForm<Values>({ mode: "onTouched", resolver: zodResolver(GastoSchema), defaultValues: defaults });
  // El input muestra el texto tal cual ("12.", "12.5") y el form recibe el número; si no, no se pueden capturar centavos.
  const [montoText, setMontoText] = useState("");
  const router = useRouter();
  const [detecting, setDetecting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ facturable: boolean; razon: string } | null>(null);
  const t = useStrings();
  const perfil = useFiscalProfile();

  const descripcion = watch("descripcion");
  const categoria = watch("categoria");

  useEffect(() => {
    if (!descripcion.trim() || !categoria) return;
    const timer = setTimeout(async () => {
      setDetecting(true);
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
          body: JSON.stringify({ action: "detect_facturable", descripcion, categoria }),
        });
        if (res.ok) {
          const data = await res.json();
          const sugerencia = ajustarSugerencia({ facturable: Boolean(data.facturable), razon: String(data.razon ?? "") }, perfil, categoria);
          setAiSuggestion(sugerencia);
          setValue("facturable", sugerencia.facturable, { shouldValidate: true });
        }
      } catch {
        // Silencioso: se conserva el valor por defecto
      } finally {
        setDetecting(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [descripcion, categoria, perfil]);

  const submit = async (values: Values) => {
    try {
      const parsed = GastoSchema.parse(values);
      await insertGasto({ ...parsed, es_automatico: false, cfdi_estado: parsed.facturable ? "facturable" : "no_facturable" });
      Alert.alert(t.manual.savedT, t.manual.savedMsg);
      reset({ ...defaults, fecha: new Date().toLocaleDateString("en-CA") });
      setMontoText("");
      router.back();
    } catch (error) {
      Alert.alert(t.manual.saveFail, error instanceof Error ? error.message : "Intenta de nuevo");
    }
  };

  const field = (name: "descripcion" | "fecha" | "monto", label: string, placeholder = "") => (
    <View className="mt-3">
      <Label>{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field: input, fieldState }) => (
          <Input
            containerClassName="mt-1.5"
            className={name === "monto" ? "tabular-nums" : ""}
            value={name === "monto" ? montoText : String(input.value ?? "")}
            placeholder={placeholder}
            keyboardType={name === "monto" ? "decimal-pad" : "default"}
            error={fieldState.error ? (fieldState.error.message ?? "Campo inválido") : undefined}
            onBlur={input.onBlur}
            onChangeText={(value) => {
              if (name !== "monto") return input.onChange(value);
              setMontoText(value);
              input.onChange(Number(value.replace(",", ".")));
            }}
          />
        )}
      />
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-canvas dark:bg-night" contentContainerClassName="pb-8">
      <SafeAreaView edges={["top"]}>
        <ScreenHeader title={t.manual.title} subtitle={t.manual.subtitle} />
        <View className="mx-5">
          <SectionLabel>{t.manual.section}</SectionLabel>
          <Card elevation="flat" className="p-4">
            {field("descripcion", t.manual.desc, t.manual.descPh)}
            {field("fecha", t.manual.date)}
            {field("monto", t.manual.amount, t.manual.amountPh)}
            <View className="mt-3">
              <Label>{t.manual.category}</Label>
              <Controller
                control={control}
                name="categoria"
                render={({ field: input }) => (
                  <CategoryGrid value={input.value} onChange={input.onChange} />
                )}
              />
            </View>
            {aiSuggestion && (
              <AiSuggestion
                verdict={aiSuggestion.facturable ? t.manual.facturable : t.manual.noFacturable}
                reason={aiSuggestion.razon}
                pending={detecting && t.manual.analyzing}
              />
            )}
            <View className="mt-3 flex-row items-center justify-between rounded-xl border border-border p-3 dark:border-stroke">
              <Text className="font-sans text-sm font-semibold text-ink dark:text-white">
                {watch("facturable") ?? true ? t.manual.facturable : t.manual.noFacturable}
              </Text>
              <Switch value={watch("facturable") ?? true} onValueChange={(v) => setValue("facturable", v, { shouldValidate: true })} />
            </View>
          </Card>
          <Button size="lg" fullWidth className="mt-5" isLoading={isSubmitting} disabled={isSubmitting} onPress={() => void handleSubmit(submit)()}>
            {isSubmitting ? t.manual.saving : t.manual.save}
          </Button>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}
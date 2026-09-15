import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GastoSchema } from "@smarttax/shared";
import type { z } from "zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import { insertGasto } from "../../hooks/useGastos";
import { supabase } from "../../lib/supabase";

type Values = z.input<typeof GastoSchema>;
const CATEGORIAS = ["Alimentación", "Transporte", "Servicios", "Salud", "Oficina", "Educación", "Entretenimiento", "Otros"] as const;
const defaults: Values = { descripcion: "", fecha: new Date().toISOString().slice(0, 10), monto: 0, categoria: "Otros", facturable: true };

function SectionLabel({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <Text className="mb-2 mt-5 text-[11px] font-bold tracking-widest text-muted dark:text-slate-400">{children}</Text>;
}

export default function GastoManual(): React.JSX.Element {
  const { control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(GastoSchema), defaultValues: defaults });
  const [detecting, setDetecting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ facturable: boolean; razon: string } | null>(null);

  const descripcion = watch("descripcion");
  const categoria = watch("categoria");

  // Auto-detect facturable when descripcion and categoria change
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
          setAiSuggestion({ facturable: data.facturable, razon: data.razon });
          setValue("facturable", data.facturable, { shouldValidate: true });
        }
      } catch {
        // Silencioso: el usuario puede cambiar manualmente
      } finally {
        setDetecting(false);
      }
    }, 800); // debounce
    return () => clearTimeout(timer);
  }, [descripcion, categoria]);

  const submit = async (values: Values) => {
    try {
      const parsed = GastoSchema.parse(values);
      await insertGasto({ ...parsed, es_automatico: false, cfdi_estado: parsed.facturable ? "facturable" : "no_facturable" });
      Alert.alert("Gasto guardado", "Tu gasto se registró correctamente.");
    } catch (error) {
      Alert.alert("No pudimos registrar el gasto", error instanceof Error ? error.message : "Intenta de nuevo");
    }
  };

  const field = (name: keyof Values, label: string, numeric = false, placeholder = "") => <View className="mt-3"><Label>{label}</Label><View className="mt-1.5"><Controller control={control} name={name} render={({ field: input }) => <Input value={String(input.value ?? "")} placeholder={placeholder} keyboardType={numeric ? "decimal-pad" : "default"} onChangeText={(value) => input.onChange(numeric ? Number(value) : value)} />} /></View>{errors[name] && <Text className="mb-1 mt-1 text-sm text-red-600">{String(errors[name]?.message ?? "Campo inválido")}</Text>}</View>;

  return <ScrollView className="flex-1 bg-canvas dark:bg-night" contentContainerClassName="pb-8">
    <SafeAreaView edges={["top"]}>
      <View className="mt-2 px-5"><Text className="font-sans text-[22px] font-bold text-ink dark:text-white">Registrar gasto</Text><Text className="mt-1 font-sans text-[13px] text-muted dark:text-slate-400">Agrega un gasto manual</Text></View>
      <View className="mx-5">
        <SectionLabel>DATOS DEL GASTO</SectionLabel>
        <View className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-nightcard">
          {field("descripcion", "Descripción", false, "Ej. Starbucks Centro")}
          {field("fecha", "Fecha (AAAA-MM-DD)")}
          {field("monto", "Monto", true, "0.00")}
          <View className="mt-3"><Label>Categoría</Label><View className="mt-1.5 rounded-md border border-slate-300 bg-white dark:border-white/10 dark:bg-white/5"><Controller control={control} name="categoria" render={({ field: input }) => <Select selectedValue={input.value} onValueChange={input.onChange}>{["Alimentación", "Transporte", "Servicios", "Salud", "Oficina", "Educación", "Entretenimiento", "Otros"].map((item) => <Select.Item key={item} label={item} value={item} />)}</Select>} /></View></View>
          {aiSuggestion && <View className="mt-3 p-3 rounded-lg bg-skyTint border border-skyBorder"><Text className="font-sans text-xs text-skyText">🤖 IA sugiere: <Text className="font-semibold">{aiSuggestion.facturable ? "Facturable" : "No facturable"}</Text> — {aiSuggestion.razon}</Text>{detecting && <Text className="font-sans text-xs text-skyText mt-1">Analizando…</Text>}</View>}
        </View>
        <Button className="mt-5 rounded-xl" disabled={isSubmitting} onPress={() => void handleSubmit(submit)()}>{isSubmitting ? "Guardando…" : "Guardar gasto"}</Button>
      </View>
    </SafeAreaView>
  </ScrollView>;
}
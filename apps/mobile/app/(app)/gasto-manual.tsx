import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { GastoManualSchema, formasPago, metodosPago, regimenesFiscales, usosCFDI } from "@smarttax/shared";
import type { z } from "zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import { insertGasto } from "../../hooks/useGastos";
import { useCFDI } from "../../hooks/useCFDI";

/**
 * Registro manual de gasto con validación SAT (Zod + catálogos compartidos).
 * Guarda en `gastos` e intenta el timbrado CFDI 4.0; sin Edge Function
 * desplegada el gasto queda guardado y el timbrado avisa el error.
 */
type Values = z.input<typeof GastoManualSchema>;
const defaults: Values = { descripcion: "", fecha: new Date().toISOString().slice(0, 10), rfcProveedor: "", razonSocialProveedor: "", codigoPostal: "", regimenFiscal: regimenesFiscales[0], usoCFDI: usosCFDI[0], metodoPago: metodosPago[0], formaPago: formasPago[0], subtotal: 0, iva: 0, total: 0, moneda: "MXN", esAutomatico: false };

function SectionLabel({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <Text className="mb-2 mt-5 text-[11px] font-bold tracking-widest text-muted dark:text-slate-400">{children}</Text>;
}

export default function GastoManual(): React.JSX.Element {
  const { timbrar, pollTimbrado, polling } = useCFDI();
  const { control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(GastoManualSchema), defaultValues: defaults });
  const [files, setFiles] = useState<{ xml_url?: string; pdf_url?: string } | null>(null);
  const ivaWatch = Number(watch("iva") ?? 0);
  const submit = async (values: Values) => { try { const parsed = GastoManualSchema.parse(values); await insertGasto({ descripcion: parsed.descripcion, fecha: parsed.fecha, monto: parsed.total, rfc_receptor: parsed.rfcProveedor, codigo_postal: parsed.codigoPostal, uso_cfdi: parsed.usoCFDI, metodo_pago: parsed.metodoPago, forma_pago: parsed.formaPago, es_automatico: false, cfdi_estado: "pendiente" }); const result = await timbrar(parsed); if (!result.uuid) throw new Error("El timbrado no devolvió UUID"); const status = await pollTimbrado(result.uuid); if (status.estado === "error") throw new Error("El timbrado falló"); setFiles(status); Alert.alert("Gasto timbrado", "Tus archivos CFDI están listos."); } catch (error) { Alert.alert("No pudimos registrar el gasto", error instanceof Error ? error.message : "Intenta de nuevo"); } };
  const field = (name: keyof Values, label: string, numeric = false, placeholder = "") => <View className="mt-3"><Label>{label}</Label><View className="mt-1.5"><Controller control={control} name={name} render={({ field: input }) => <Input value={String(input.value ?? "")} placeholder={placeholder} keyboardType={numeric ? "decimal-pad" : "default"} onChangeText={(value) => input.onChange(numeric ? Number(value) : value)} />} /></View>{errors[name] && <Text className="mb-1 mt-1 text-sm text-red-600">{String(errors[name]?.message ?? "Campo inválido")}</Text>}</View>;
  const select = (name: keyof Values, label: string, items: readonly string[]) => <View className="mt-3"><Label>{label}</Label><View className="mt-1.5 rounded-md border border-slate-300 bg-white dark:border-white/10 dark:bg-white/5"><Controller control={control} name={name} render={({ field }) => <Select selectedValue={field.value} onValueChange={field.onChange}>{items.map((item) => <Select.Item key={item} label={item} value={item} />)}</Select>} /></View></View>;
  return <ScrollView className="flex-1 bg-canvas dark:bg-night" contentContainerClassName="pb-8">
    <SafeAreaView edges={["top"]}>
      <View className="mt-2 flex-row items-start justify-between px-5">
        <View>
          <Text className="font-sans text-[22px] font-bold text-ink dark:text-white">Registrar gasto</Text>
          <Text className="mt-1 font-sans text-[13px] text-muted dark:text-slate-400">Gasto manual sin comprobante digital</Text>
        </View>
        <View className="flex-row items-center rounded-full bg-skyTint px-3 py-1.5"><View className="h-1.5 w-1.5 rounded-full bg-primary" /><Text className="ml-1.5 text-[11px] font-bold tracking-wider text-primary">MODO MANUAL</Text></View>
      </View>

      <View className="mx-5 mt-4 rounded-[20px] border border-slate-200 bg-white dark:border-white/10 dark:bg-nightcard p-5">
        <Text className="text-[11px] font-bold tracking-widest text-muted dark:text-slate-400">TOTAL DEL GASTO</Text>
        <Controller control={control} name="total" render={({ field: input }) => <Input value={String(input.value ?? "")} keyboardType="decimal-pad" placeholder="0.00" className="mt-1 border-0 p-0 font-sans text-[38px] font-bold text-ink dark:text-white" onChangeText={(value) => input.onChange(Number(value))} />} />
        {errors.total && <Text className="mt-1 text-sm text-red-600">{String(errors.total.message ?? "Campo inválido")}</Text>}
        <View className="mt-3 flex-row gap-2">
          <View className="rounded-full bg-slate-100 dark:bg-white/10 px-3 py-1.5"><Text className="text-xs font-semibold text-muted dark:text-slate-400">IVA estimado ${ivaWatch.toFixed(2)}</Text></View>
          <View className="rounded-full bg-emeraldTint px-3 py-1.5"><Text className="text-xs font-semibold text-emeraldText">MXN</Text></View>
        </View>
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1">{field("subtotal", "Subtotal", true)}</View>
          <View className="flex-1">{field("iva", "IVA", true)}</View>
        </View>
      </View>

      <View className="mx-5">
        <SectionLabel>COMERCIO O PROVEEDOR</SectionLabel>
        <View className="rounded-[20px] border border-slate-200 bg-white dark:border-white/10 dark:bg-nightcard p-4">
          {field("descripcion", "Descripción del gasto", false, "Ej. Starbucks Centro")}
          {field("fecha", "Fecha (AAAA-MM-DD)")}
        </View>

        <SectionLabel>DATOS FISCALES</SectionLabel>
        <View className="rounded-[20px] border border-slate-200 bg-white dark:border-white/10 dark:bg-nightcard p-4">
          {field("rfcProveedor", "RFC receptor", false, "XAXX010101000")}
          {field("razonSocialProveedor", "Razón social", false, "Público en general")}
          {field("codigoPostal", "Código postal", false, "06600")}
          {select("regimenFiscal", "Régimen fiscal", regimenesFiscales)}
          {select("usoCFDI", "Uso CFDI", usosCFDI)}
        </View>

        <SectionLabel>MÉTODO DE PAGO</SectionLabel>
        <View className="rounded-[20px] border border-slate-200 bg-white dark:border-white/10 dark:bg-nightcard p-4">
          {select("metodoPago", "Método de pago", metodosPago)}
          {select("formaPago", "Forma de pago", formasPago)}
        </View>

        <LinearGradient colors={["#1D3BBF", "#2547E8"]} className="mt-5 rounded-2xl p-4">
          <View className="flex-row items-center">
            <Feather name="zap" size={18} color="#fff" />
            <Text className="ml-2 font-sans text-[15px] font-semibold text-white">Timbrado CFDI 4.0 incluido</Text>
          </View>
          <Text className="mt-1 font-sans text-[13px] text-white/75">Al guardar se genera tu factura válida ante el SAT.</Text>
        </LinearGradient>

        <Button className="mt-4 rounded-xl" disabled={isSubmitting || polling} onPress={() => void handleSubmit(submit)()}>{polling ? "Timbrando…" : isSubmitting ? "Guardando…" : "Guardar gasto"}</Button>
        {files?.xml_url && <Button className="mt-3 rounded-xl bg-secondary" onPress={() => void Linking.openURL(files.xml_url ?? "")}>Descargar XML</Button>}
        {files?.pdf_url && <Pressable className="mt-3 min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-nightcard" onPress={() => void Linking.openURL(files.pdf_url ?? "")}><Text className="font-sans text-sm font-semibold text-primary">Descargar PDF</Text></Pressable>}
      </View>
    </SafeAreaView>
  </ScrollView>;
}

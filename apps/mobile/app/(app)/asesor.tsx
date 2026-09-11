import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { formasPago, metodosPago, regimenesFiscales, usosCFDI } from "@smarttax/shared";

import { Input } from "../../components/ui/input";
import { useGastos } from "../../hooks/useGastos";
import { supabase } from "../../lib/supabase";

/**
 * Chat del asesor fiscal. Intenta primero la Edge Function `asesor-ia`
 * (Gemini con contexto real de gastos y perfil); sin conexión o sin
 * configurar, responde con reglas locales basadas en catálogos SAT.
 */
const FUNCTIONS_URL = `${process.env["EXPO_PUBLIC_SUPABASE_URL"] ?? ""}/functions/v1/asesor-ia`;

async function askAI(question: string): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return null;
    const res = await fetch(FUNCTIONS_URL, {
      method: "POST",
      headers: { "content-type": "application/json", apikey: process.env["EXPO_PUBLIC_SUPABASE_ANON_KEY"] ?? "", authorization: `Bearer ${token}` },
      body: JSON.stringify({ question }),
    });
    if (!res.ok) return null;
    const body: unknown = await res.json();
    return typeof body === "object" && body !== null && "answer" in body && typeof body.answer === "string" ? body.answer : null;
  } catch { return null; }
}

type Msg = { id: string; from: "bot" | "user"; text: string };
const SUGGESTIONS = ["¿Qué puedo deducir?", "Usos de CFDI", "¿Cómo timbro?", "Mi total del mes"];

function answerFor(question: string, total: number, count: number): string {
  const q = question.toLowerCase();
  if (/deduc/.test(q)) return `Puedes deducir gastos estrictamente indispensables para tu actividad con CFDI vigente (PUE + forma de pago electrónica). Llevas $${total.toFixed(2)} en ${count} gasto(s) este periodo. Marca cada gasto como Facturable al registrarlo.`;
  if (/uso/.test(q)) return `Usos de CFDI frecuentes: ${usosCFDI.slice(0, 5).join(", ")}${usosCFDI.length > 5 ? ` y ${usosCFDI.length - 5} más` : ""}. Para gastos generales usa G03.`;
  if (/r[eé]gimen/.test(q)) return `Hay ${regimenesFiscales.length} regímenes en el catálogo, por ejemplo: ${regimenesFiscales.slice(0, 3).join(", ")}. Tu régimen se guarda en Configuración → Perfil fiscal.`;
  if (/timbr|factur|cfdi/.test(q)) return "Para timbrar: Nuevo → llena RFC receptor, CP, uso CFDI y total → Guardar gasto. La app genera el XML 4.0 y consulta el estado hasta timbrado. Descarga XML/PDF desde la misma pantalla.";
  if (/iva/.test(q)) return "El IVA general es 16%. Al registrar tu gasto captura subtotal e IVA por separado para que tu deducible se calcule bien.";
  if (/pago|pue|ppd/.test(q)) return `Métodos: ${metodosPago.join(", ")}. Formas comunes: ${formasPago.slice(0, 4).join(", ")}. Para deducir necesitas medio electrónico (no efectivo).`;
  if (/total|cu[aá]nto|mes|gastos/.test(q)) return `Registraste $${total.toFixed(2)} en ${count} gasto(s). Revisa el detalle en la pestaña Gastos.`;
  if (/hola|buenas|ayuda/.test(q)) return "Hola, soy tu asesor fiscal. Pregúntame sobre deducciones, CFDI, regímenes o tus gastos del mes.";
  return "Puedo ayudarte con deducciones, usos de CFDI, regímenes, timbrado y el resumen de tus gastos. Prueba una sugerencia de abajo.";
}

export default function Asesor(): React.JSX.Element {
  const { gastos } = useGastos();
  const total = gastos.reduce((s, g) => sum(s, g), 0);
  const [msgs, setMsgs] = useState<Msg[]>([{ id: "0", from: "bot", text: "Hola, soy tu asesor fiscal con IA. ¿En qué te ayudo hoy?" }]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);

  const send = (raw?: string): void => {
    const value = (raw ?? text).trim();
    if (!value || typing) return;
    const id = Date.now().toString();
    setMsgs((m) => [...m, { id, from: "user", text: value }]);
    setText("");
    setTyping(true);
    void (async () => {
      const ai = await askAI(value);
      const reply = ai ?? answerFor(value, total, gastos.length);
      setTyping(false);
      setMsgs((m) => [...m, { id: `${id}-r`, from: "bot", text: reply }]);
    })();
  };

  return <View className="flex-1 bg-canvas dark:bg-night">
    <SafeAreaView edges={["top"]} className="flex-1">
      <LinearGradient colors={["#1D3BBF", "#2547E8"]} className="mx-5 mt-2 flex-row items-center rounded-[20px] p-4">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-white/20"><Feather name="cpu" size={22} color="#fff" /></View>
        <View className="ml-3 flex-1">
          <Text className="font-sans text-[15px] font-bold text-white">Asesor Fiscal IA</Text>
          <View className="mt-0.5 flex-row items-center"><View className="h-2 w-2 rounded-full bg-emerald-300" /><Text className="ml-1.5 font-sans text-xs text-white/75">En línea · SAT 2026</Text></View>
        </View>
      </LinearGradient>

      <FlatList
        className="mt-2 flex-1"
        contentContainerClassName="gap-2 px-5 py-3"
        data={typing ? [...msgs, { id: "typing", from: "bot" as const, text: "Escribiendo…" }] : msgs}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => item.from === "bot"
          ? <View className="mr-12 self-start rounded-2xl rounded-tl-md border border-slate-200 bg-white dark:border-white/10 dark:bg-nightcard px-4 py-3"><Text className="font-sans text-sm leading-5 text-ink dark:text-white">{item.text}</Text></View>
          : <View className="ml-12 self-end rounded-2xl rounded-tr-md bg-primary px-4 py-3"><Text className="font-sans text-sm leading-5 text-white">{item.text}</Text></View>}
      />

      <View className="px-5 pb-1">
        <FlatList horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 py-2" data={SUGGESTIONS} keyExtractor={(s) => s} renderItem={({ item }) => <Pressable className="rounded-full border border-slate-200 bg-white dark:border-white/10 dark:bg-nightcard px-3.5 py-2" onPress={() => send(item)}><Text className="font-sans text-[13px] font-medium text-primary">{item}</Text></Pressable>} />
        <View className="flex-row items-center gap-2 pb-4 pt-1">
          <Input className="flex-1 border-slate-200 bg-white dark:border-white/10 dark:bg-nightcard" placeholder="Pregunta sobre impuestos…" value={text} onChangeText={setText} onSubmitEditing={() => send()} returnKeyType="send" />
          <Pressable className="h-11 w-11 items-center justify-center rounded-full bg-primary" onPress={() => send()}><Feather name="send" size={18} color="#fff" /></Pressable>
        </View>
      </View>
    </SafeAreaView>
  </View>;
}

function sum(acc: number, g: { monto: number | string }): number { return acc + Number(g.monto); }

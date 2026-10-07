import { useState } from "react";
import { FlatList, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../../components/ui/icon";
import { formasPago, metodosPago, regimenesFiscales, usosCFDI } from "@smarttax/shared";

import { Input } from "../../components/ui/input";
import { useGastos } from "../../hooks/useGastos";
import { useMoney } from "../../lib/money";
import { useStrings, type Strings } from "../../lib/strings";
import { usePrefs } from "../../lib/preferences";
import { supabase } from "../../lib/supabase";
import { Card } from "../../components/ui/card";
import { PressableComponent } from "../../components/ui/pressable";
import { usePlan } from "../../hooks/usePlan";

/**
 * Chat del asesor fiscal. Intenta primero la Edge Function `asesor-ia`
 * (Gemini con contexto real de gastos y perfil); sin conexión o sin
 * configurar, responde con reglas locales basadas en catálogos SAT.
 */
const FUNCTIONS_URL = `${process.env["EXPO_PUBLIC_SUPABASE_URL"] ?? ""}/functions/v1/asesor-ia`;

async function askAI(question: string, history: Msg[], lang: string): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return null;
    const res = await fetch(FUNCTIONS_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: process.env["EXPO_PUBLIC_SUPABASE_ANON_KEY"] ?? "",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: "chat", question, lang, history: history.slice(-6).map(({ from, text }) => ({ from, text })) }),
    });
    if (!res.ok) return null;
    const body: unknown = await res.json();
    return typeof body === "object" && body !== null && "answer" in body && typeof body.answer === "string"
      ? body.answer
      : null;
  } catch {
    return null;
  }
}

type Intent = "deduc" | "cfdi" | "regimen" | "timbrar" | "iva" | "pago" | "total" | "hello" | "fallback";
type Msg = { id: string; from: "bot" | "user"; text: string };

function matchIntent(question: string): Intent {
  const q = question.toLowerCase();
  if (/deduc|deduct/.test(q)) return "deduc";
  if (/usos?( de)? cfdi|cfdi use/.test(q)) return "cfdi";
  if (/r[eé]gimen|tax regime|\bregime\b/.test(q)) return "regimen";
  if (/timbr|factur|invoic|stamp/.test(q)) return "timbrar";
  if (/\biva\b|\bvat\b/.test(q)) return "iva";
  if (/pago|pue|ppd|payment/.test(q)) return "pago";
  if (/total|cu[aá]nto|mes|gastos?|how much|month|expenses?|spending/.test(q)) return "total";
  if (/hola|buenas|ayuda|hello|\bhi\b|help/.test(q)) return "hello";
  return "fallback";
}

/**
 * Renders advisor pipe-templates: "{{p1}}|{{p2}}|body with {{p1}} and
 * {{#if p2}}conditional{{/if}}". Plain strings pass through unchanged.
 */
function renderAdvisorTemplate(template: string, params: Record<string, string | number>): string {
  const parts = template.split("|");
  const body = parts.length > 1 ? (parts[parts.length - 1] ?? template) : template;
  const withConditionals = body.replace(
    /\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_match: string, name: string, inner: string) => (params[name] ? inner : "")
  );
  return withConditionals.replace(/\{\{(\w+)\}\}/g, (_match: string, name: string) => {
    const value = params[name];
    return value === undefined || value === null ? "" : String(value);
  });
}

function answerFor(question: string, total: string, count: number, t: Strings): string {
  const a = t.asesor as unknown as Record<string, string>;
  const render = (key: string, params: Record<string, string | number> = {}): string =>
    renderAdvisorTemplate(a[key] ?? "", params);
  switch (matchIntent(question)) {
    case "deduc":
      return render("aDeduc", { total, count });
    case "cfdi":
      return render("aCfdi", { sample: usosCFDI.slice(0, 5).join(", "), more: usosCFDI.length - 5 });
    case "regimen":
      return render("aRegimen", { sample: regimenesFiscales.slice(0, 3).join(", ") });
    case "timbrar":
      return render("aTimbrar");
    case "iva":
      return render("aIva");
    case "pago":
      return render("aPago", { metodos: metodosPago.join(", "), formas: formasPago.slice(0, 4).join(", ") });
    case "total":
      return render("aTotal", { total, count });
    case "hello":
      return render("aHello");
    default:
      return render("aFallback");
  }
}

export default function Asesor(): React.JSX.Element {
  const { gastos } = useGastos();
  const total = gastos.reduce((s, g) => sum(s, g), 0);
  const { format } = useMoney();
  const t = useStrings();
  const { can } = usePlan();
  const { language } = usePrefs();
  const [msgs, setMsgs] = useState<Msg[]>([{ id: "0", from: "bot", text: t.asesor.greeting }]);
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
      const ai = can("aiAdvisor") ? await askAI(value, msgs, language) : null;
      const reply = ai ?? answerFor(value, format(total), gastos.length, t);
      setTyping(false);
      setMsgs((m) => [...m, { id: `${id}-r`, from: "bot", text: reply }]);
    })();
  };

  return (
    <View className="flex-1 bg-canvas dark:bg-night">
      <SafeAreaView edges={["top"]} className="flex-1">
        <Card elevation="elevated" className="mx-5 mt-2 p-4">
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary dark:bg-cobalt">
              <Icon name="cpu" size={22} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="font-sans text-[15px] font-bold text-ink dark:text-white">{t.asesor.title}</Text>
              <View className="mt-0.5 flex-row items-center">
                <View className="h-2 w-2 rounded-full bg-emerald-300" />
                <Text className="ml-1.5 font-sans text-xs text-muted dark:text-slate-400">{t.asesor.online}</Text>
              </View>
            </View>
          </View>
        </Card>

        <FlatList
          className="mt-2 flex-1"
          contentContainerClassName="gap-2.5 px-5 py-3"
          showsVerticalScrollIndicator={false}
          data={typing ? [...msgs, { id: "typing", from: "bot" as const, text: t.asesor.typing }] : msgs}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) =>
            item.from === "bot" ? (
              <View className="mr-10 max-w-[88%] flex-row items-end self-start">
                <View className="mr-2 h-7 w-7 items-center justify-center rounded-full bg-primary dark:bg-cobalt">
                  <Icon name="cpu" size={13} color="#fff" />
                </View>
                <Card elevation="flat" className="flex-1 px-4 py-3">
                  <Text className="font-sans text-sm leading-5 text-ink dark:text-white">{item.text}</Text>
                </Card>
              </View>
            ) : (
              <View className="ml-14 max-w-[85%] self-end">
                <Card elevation="flat" className="bg-primary px-4 py-3 dark:bg-cobalt">
                  <Text className="font-sans text-sm leading-5 text-white">{item.text}</Text>
                </Card>
              </View>
            )
          }
        />

        <View className="px-5 pb-3">
          {!can("aiAdvisor") && (
            <Text className="mb-2 text-center font-sans text-xs text-muted dark:text-slate-400">{t.pro.localAdvisor}</Text>
          )}
          <Card elevation="flat" className="px-3 pb-2 pt-1">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2 py-2"
            >
              {(t.asesor.sug as string[]).map((item: string) => (
                <PressableComponent key={item} variant="scale" haptic="selection" onPress={() => send(item)} className="rounded-full bg-muted/20 px-3.5 py-2 dark:bg-white/10">
                  <Text className="font-sans text-[13px] font-medium text-primary dark:text-white">{item}</Text>
                </PressableComponent>
              ))}
            </ScrollView>
            <View className="flex-row items-center pb-1 pt-1" style={{ gap: 8 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Input
                  placeholder={t.asesor.placeholder}
                  value={text}
                  onChangeText={setText}
                  onSubmitEditing={() => send()}
                  returnKeyType="send"
                />
              </View>
              <PressableComponent variant="both" haptic="light" onPress={() => send()} accessibilityRole="button" accessibilityLabel={t.asesor.placeholder} style={{ width: 50, height: 50, flexShrink: 0 }} className="items-center justify-center rounded-full bg-primary shadow-md dark:bg-cobalt dark:shadow-glow-primary">
                <Icon name="send" size={18} color="#fff" />
              </PressableComponent>
            </View>
          </Card>
        </View>
      </SafeAreaView>
    </View>
  );
}

function sum(acc: number, g: { monto: number | string }): number {
  return acc + Number(g.monto);
}
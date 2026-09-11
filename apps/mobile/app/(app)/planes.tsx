import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

/** Planes de suscripción (Gratis / Pro IA / Negocios) con selección local. El cobro real con Stripe Payment Links está pendiente de cablear. */
type Plan = { id: string; name: string; price: string; period: string; features: string[]; highlight: boolean };
const PLANS: Plan[] = [
  { id: "gratis", name: "Gratis", price: "$0", period: "para siempre", features: ["10 gastos al mes", "Descarga de XML", "Soporte por correo"], highlight: false },
  { id: "pro", name: "Plan Pro IA", price: "$149", period: "/mes", features: ["Gastos ilimitados", "Escaneo con IA", "Timbrado CFDI 4.0", "Asesor fiscal 24/7"], highlight: true },
  { id: "negocios", name: "Negocios", price: "$399", period: "/mes", features: ["Todo lo de Pro", "Multi-usuario", "Conciliación bancaria", "Soporte prioritario"], highlight: false },
];

export default function Planes(): React.JSX.Element {
  const router = useRouter();
  const [current, setCurrent] = useState("gratis");
  const subscribe = (plan: Plan): void => {
    if (plan.id === current) return;
    Alert.alert(`Cambiar a ${plan.name}`, `${plan.price}${plan.period}. ¿Confirmas tu suscripción?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Confirmar", onPress: () => { setCurrent(plan.id); Alert.alert("Listo", `Ahora tienes ${plan.name}.`); } },
    ]);
  };
  return <ScrollView className="flex-1 bg-canvas dark:bg-night" contentContainerClassName="pb-8">
    <SafeAreaView edges={["top"]}>
      <View className="mt-2 flex-row items-center px-5">
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-white" onPress={() => router.back()}><Feather name="arrow-left" size={18} color="#0F172A" /></Pressable>
        <Text className="ml-3 font-sans text-[22px] font-bold text-ink dark:text-white">Planes de Suscripción</Text>
      </View>

      <LinearGradient colors={["#1D3BBF", "#2547E8"]} className="mx-5 mt-4 rounded-[20px] p-5">
        <Text className="font-sans text-lg font-bold text-white">Potencia tu facturación con IA</Text>
        <Text className="mt-1 font-sans text-[13px] text-white/75">Cambia o cancela cuando quieras, sin penalización.</Text>
      </LinearGradient>

      {PLANS.map((plan) => <View key={plan.id} className={plan.highlight ? "mx-5 mt-4 rounded-[20px] border-2 border-primary bg-white p-5" : "mx-5 mt-4 rounded-[20px] border border-slate-200 bg-white dark:border-white/10 dark:bg-nightcard p-5"}>
        <View className="flex-row items-center justify-between">
          <Text className="font-sans text-[15px] font-bold text-ink dark:text-white">{plan.name}</Text>
          {plan.highlight && <View className="rounded-full bg-primary px-2.5 py-1"><Text className="text-[10px] font-bold text-white">RECOMENDADO</Text></View>}
          {current === plan.id && <View className="rounded-full bg-emeraldTint px-2.5 py-1"><Text className="text-[10px] font-bold text-emeraldText">ACTUAL</Text></View>}
        </View>
        <View className="mt-2 flex-row items-baseline"><Text className="font-sans text-[30px] font-bold text-ink dark:text-white">{plan.price}</Text><Text className="ml-1 font-sans text-sm text-muted dark:text-slate-400">{plan.period}</Text></View>
        <View className="mt-3 gap-2">
          {plan.features.map((f) => <View key={f} className="flex-row items-center"><Feather name="check-circle" size={15} color="#059669" /><Text className="ml-2 font-sans text-sm text-muted dark:text-slate-400">{f}</Text></View>)}
        </View>
        <Pressable className={current === plan.id ? "mt-4 items-center rounded-xl bg-slate-100 dark:bg-white/10 py-3.5" : plan.highlight ? "mt-4 items-center rounded-xl bg-primary py-3.5" : "mt-4 items-center rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-nightcard py-3.5"} onPress={() => subscribe(plan)} disabled={current === plan.id}>
          <Text className={current === plan.id ? "font-sans text-sm font-semibold text-muted dark:text-slate-400" : plan.highlight ? "font-sans text-sm font-semibold text-white" : "font-sans text-sm font-semibold text-primary"}>{current === plan.id ? "Plan actual" : "Elegir plan"}</Text>
        </Pressable>
      </View>)}
    </SafeAreaView>
  </ScrollView>;
}

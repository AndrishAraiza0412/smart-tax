import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Circle, Polyline } from "react-native-svg";
import { useGastos } from "../../hooks/useGastos";
import { ThemeToggle } from "../../components/ui/theme-toggle";
import type { Gasto } from "../../hooks/useGastos";

/**
 * Panel principal. Todo es calculado desde los gastos reales del usuario:
 * total del mes en curso, deducible (CFDI timbrado), barras de 12 meses,
 * dona por categoría y lista de recientes. Sin gastos muestra estados vacíos.
 */
const CIRC = 2 * Math.PI * 48;
const INITIALS = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DONUT_COLORS = ["#2547E8", "#10B981", "#F43F5E", "#0EA5E9", "#8B5CF6"];

function statusPill(estado: string | null | undefined): { label: string; box: string; text: string } {
  if (estado === "timbrado") return { label: "Facturable", box: "border-emeraldBorder bg-emeraldTint", text: "text-emeraldText" };
  if (estado === "error") return { label: "Sin factura", box: "border-roseBorder bg-roseTint", text: "text-roseText" };
  return { label: "Pendiente", box: "border-skyBorder bg-skyTint", text: "text-skyText" };
}

function iconFor(categoria: string | null | undefined): { icon: "car" | "cart" | "briefcase" | "plus" | "zap" | "file"; tint: string; color: string } {
  const c = (categoria ?? "").toLowerCase();
  if (/transport|uber|didi|taxi|gasolin/.test(c)) return { icon: "car", tint: "bg-skyTint", color: "#0EA5E9" };
  if (/aliment|comida|super|restaurante|caf/.test(c)) return { icon: "cart", tint: "bg-emeraldTint", color: "#059669" };
  if (/salud|farmacia|medic|hospital/.test(c)) return { icon: "plus", tint: "bg-roseTint", color: "#E11D48" };
  if (/oficina|ofice|mueble|papeler/.test(c)) return { icon: "briefcase", tint: "bg-skyTint", color: "#2547E8" };
  if (/servicio|luz|agua|internet|tel/.test(c)) return { icon: "zap", tint: "bg-[#FEF3C7]", color: "#D97706" };
  return { icon: "file", tint: "bg-slate-100", color: "#64748B" };
}

function fmt(n: number): string { return `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function shortDate(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  return `${d} ${MESES[(m ?? 1) - 1]?.slice(0, 3) ?? ""}`;
}

export default function Dashboard(): React.JSX.Element {
  const { width } = useWindowDimensions();
  const heroSize = width < 360 ? 30 : 38;
  const { gastos, loading } = useGastos();
  const now = new Date();
  const inMonth = (g: Gasto): boolean => { const [y, m] = g.fecha.split("-").map(Number); return y === now.getFullYear() && m === now.getMonth() + 1; };
  const monthRows = gastos.filter(inMonth);
  const monthTotal = monthRows.reduce((s, g) => s + Number(g.monto), 0);
  const deducible = monthRows.filter((g) => g.cfdi_estado === "timbrado").reduce((s, g) => s + Number(g.monto), 0);

  const bars = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const total = gastos.filter((g) => { const [y, m] = g.fecha.split("-").map(Number); return y === d.getFullYear() && m === d.getMonth() + 1; }).reduce((s, g) => s + Number(g.monto), 0);
    return { label: INITIALS[d.getMonth()], total, current: i === 11 };
  });
  const maxBar = Math.max(1, ...bars.map((b) => b.total));

  const byCat = new Map<string, number>();
  for (const g of gastos) byCat.set(g.categoria ?? "Otros", (byCat.get(g.categoria ?? "Otros") ?? 0) + Number(g.monto));
  const cats = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, total], i) => ({ name, total, color: DONUT_COLORS[i % DONUT_COLORS.length] ?? "#2547E8" }));
  const catSum = cats.reduce((s, c) => s + c.total, 0);
  let acc = 0;
  const arcs = cats.map((c) => { const frac = catSum ? c.total / catSum : 0; const seg = { ...c, frac, offset: -acc * CIRC }; acc += frac; return seg; });

  const spark = gastos.length > 1
    ? gastos.slice(0, 12).reverse().map((g, i, arr) => { const max = Math.max(1, ...arr.map((x) => Number(x.monto))); return `${(i / Math.max(1, arr.length - 1)) * 300},${52 - (Number(g.monto) / max) * 44}`; }).join(" ")
    : "0,44 150,30 300,10";

  return <ScrollView className="flex-1 bg-canvas dark:bg-night" contentContainerClassName="pb-8">
    <LinearGradient colors={["#1D3BBF", "#2547E8"]} className="rounded-b-[28px] px-5 pb-20">
      <SafeAreaView edges={["top"]}>
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-[11px] font-bold tracking-widest text-white/75">{MESES[now.getMonth()]?.toUpperCase()} {now.getFullYear()}</Text>
          <View className="flex-row gap-2">
            <Link href="/(app)/configuraciones" asChild><Pressable className="h-10 w-10 items-center justify-center rounded-full bg-white/20"><Feather name="settings" size={18} color="#fff" /></Pressable></Link>
            <ThemeToggle />
          </View>
        </View>
        <Text className="mt-3 font-sans text-sm text-white/85">Gasto total del mes</Text>
        <Text className="font-sans font-bold text-white" style={{ fontSize: heroSize, lineHeight: heroSize + 6 }}>{loading ? "…" : fmt(monthTotal)}</Text>
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-white/20 bg-white/10 p-3">
            <Text className="text-[11px] font-semibold text-white/75">Deducible ISR</Text>
            <Text className="mt-1 font-sans text-lg font-bold text-white">{loading ? "…" : fmt(deducible)}</Text>
            <Text className="mt-0.5 text-[11px] font-semibold text-emerald-300">CFDI timbrado</Text>
          </View>
          <View className="flex-1 rounded-2xl border border-white/20 bg-white/10 p-3">
            <Text className="text-[11px] font-semibold text-white/75">Facturable</Text>
            <Text className="mt-1 font-sans text-lg font-bold text-white">{loading ? "…" : fmt(monthTotal)}</Text>
            <Text className="mt-0.5 text-[11px] font-semibold text-white/75">{monthRows.length} movimientos</Text>
          </View>
        </View>
        <Svg height={56} width="100%" viewBox="0 0 300 56" className="mt-3">
          <Polyline points={spark} fill="none" stroke="#60A5FA" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </SafeAreaView>
    </LinearGradient>

    <Link href="/(app)/escanear" asChild>
      <Pressable className="mx-5 -mt-12 flex-row items-center rounded-[20px] border border-slate-200 bg-white dark:border-white/10 dark:bg-nightcard p-4 shadow-sm">
        <LinearGradient colors={["#1D3BBF", "#2547E8"]} className="h-12 w-12 items-center justify-center rounded-2xl"><Feather name="camera" size={20} color="#fff" /></LinearGradient>
        <View className="ml-3 flex-1">
          <Text className="font-sans text-[15px] font-semibold text-ink dark:text-white">Escanear comprobante</Text>
          <Text className="mt-0.5 font-sans text-[13px] text-muted dark:text-slate-400">Extrae datos y categorías con IA</Text>
        </View>
        <Feather name="chevron-right" size={20} color="#94A3B8" />
      </Pressable>
    </Link>

    <View className="mx-5 mt-6 flex-row items-center justify-between">
      <Text className="text-[11px] font-bold tracking-widest text-muted dark:text-slate-400">GASTO MENSUAL {now.getFullYear()}</Text>
      <Link href="/(app)/mis-gastos"><Text className="text-xs font-semibold text-primary">Ver gastos</Text></Link>
    </View>
    <View className="mx-5 mt-2 rounded-[20px] border border-slate-200 bg-white dark:border-white/10 dark:bg-nightcard p-4">
      <View className="h-32 flex-row items-end">
        {bars.map((b, i) => <View key={`bar-${i}`} className="flex-1 items-center" style={{ height: "100%", justifyContent: "flex-end" }}>
          <View className={b.current && b.total > 0 ? "w-3/5 rounded-t-md bg-primary" : "w-3/5 rounded-t-md bg-[#DBEAFE]"} style={{ height: `${Math.max(4, (b.total / maxBar) * 100)}%` }} />
        </View>)}
      </View>
      <View className="mt-2 flex-row">{bars.map((b, i) => <Text key={`lbl-${i}`} className="flex-1 text-center text-[10px] text-faint">{b.label}</Text>)}</View>
    </View>

    <View className="mx-5 mt-6 flex-row items-center justify-between">
      <Text className="text-[11px] font-bold tracking-widest text-muted dark:text-slate-400">POR CATEGORÍA</Text>
      <Link href="/(app)/mis-gastos"><Text className="text-xs font-semibold text-primary">Ver todas</Text></Link>
    </View>
    <View className="mx-5 mt-2 flex-row items-center rounded-[20px] border border-slate-200 bg-white dark:border-white/10 dark:bg-nightcard p-4">
      {cats.length === 0 ? <Text className="font-sans text-sm text-muted dark:text-slate-400">{loading ? "Cargando…" : "Aún no hay gastos por categoría."}</Text> : <>
        <View className="items-center">
          <Svg height={120} width={120} viewBox="0 0 120 120">
            <Circle cx={60} cy={60} r={48} stroke="#F1F5F9" strokeWidth={14} fill="none" />
            {arcs.map((a) => <Circle key={a.name} cx={60} cy={60} r={48} stroke={a.color} strokeWidth={14} fill="none" strokeDasharray={`${CIRC * a.frac} ${CIRC}`} strokeLinecap="round" strokeDashoffset={a.offset} transform="rotate(-90 60 60)" />)}
          </Svg>
          <Text className="absolute font-sans text-lg font-bold text-ink dark:text-white" style={{ top: 50 }}>{arcs[0] ? `${Math.round(arcs[0].frac * 100)}%` : ""}</Text>
        </View>
        <View className="ml-4 flex-1 gap-3">
          {cats.slice(0, 3).map((c) => <View key={c.name} className="flex-row items-center justify-between">
            <View className="flex-row items-center"><View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} /><Text className="ml-2 font-sans text-sm text-muted dark:text-slate-400">{c.name}</Text></View>
            <Text className="font-sans text-sm font-bold text-ink dark:text-white">{fmt(c.total)}</Text>
          </View>)}
        </View>
      </>}
    </View>

    <View className="mx-5 mt-6 flex-row items-center justify-between">
      <Text className="text-[11px] font-bold tracking-widest text-muted dark:text-slate-400">RECIENTES</Text>
      <Link href="/(app)/mis-gastos"><Text className="text-xs font-semibold text-primary">Ver todos</Text></Link>
    </View>
    <View className="mx-5 mt-2 gap-2">
      {loading ? <Text className="text-muted dark:text-slate-400">Cargando…</Text> : gastos.length === 0 ? <View className="items-center rounded-[20px] border border-slate-200 bg-white dark:border-white/10 dark:bg-nightcard p-6"><Text className="font-sans text-sm text-muted dark:text-slate-400">Sin movimientos. Registra tu primer gasto ⭢</Text></View> : gastos.slice(0, 5).map((g) => {
        const v = iconFor(g.categoria); const pill = statusPill(g.cfdi_estado);
        return <View key={g.id} className="flex-row items-center rounded-[20px] border border-slate-200 bg-white dark:border-white/10 dark:bg-nightcard px-4 py-3.5">
          <View className={`h-11 w-11 items-center justify-center rounded-xl ${v.tint}`}>
            {v.icon === "car" ? <MaterialCommunityIcons name="car" size={20} color={v.color} /> : v.icon === "cart" ? <Feather name="shopping-cart" size={20} color={v.color} /> : v.icon === "briefcase" ? <Feather name="briefcase" size={20} color={v.color} /> : v.icon === "plus" ? <Feather name="plus" size={20} color={v.color} /> : v.icon === "zap" ? <Feather name="zap" size={20} color={v.color} /> : <Feather name="file-text" size={20} color={v.color} />}
          </View>
          <View className="ml-3 flex-1">
            <Text className="font-sans text-[15px] font-semibold text-ink dark:text-white">{g.descripcion}</Text>
            <Text className="mt-0.5 font-sans text-xs text-faint">{shortDate(g.fecha)} · {g.cfdi_estado === "timbrado" ? "Facturado" : "Pendiente"}</Text>
          </View>
          <View className="items-end">
            <Text className="font-sans text-[17px] font-bold text-ink dark:text-white">{fmt(Number(g.monto))}</Text>
            <View className={`mt-1 rounded-full border px-2 py-0.5 ${pill.box}`}><Text className={`text-[11px] font-semibold ${pill.text}`}>{pill.label}</Text></View>
          </View>
        </View>;
      })}
    </View>
  </ScrollView>;
}

import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useColorScheme } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { HeroGradient } from "../../components/hero-gradient";
import { ExpenseEmpty, ExpenseRow } from "../../components/expense-row";
import { Icon } from "../../components/ui/icon";
import Svg, { Circle, Polyline } from "react-native-svg";
import { useGastos } from "../../hooks/useGastos";
import { useMoney } from "../../lib/money";
import { useStrings } from "../../lib/strings";
import type { Gasto } from "../../hooks/useGastos";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { Card } from "../../components/ui/card";
import { PressableComponent } from "../../components/ui/pressable";
import { SkeletonDashboard } from "../../components/ui/skeleton-dashboard";

const CIRC = 2 * Math.PI * 48;
const DONUT_COLORS = ["#2547E8", "#10B981", "#F43F5E", "#0EA5E9", "#8B5CF6"];

export default function Dashboard(): React.JSX.Element {
  const { width } = useWindowDimensions();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const heroSize = width < 360 ? 30 : 38;
  const { gastos, loading, refresh } = useGastos();
  const { format: fmt } = useMoney();
  const t = useStrings();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );
  const now = new Date();
  const inMonth = (g: Gasto): boolean => {
    const [y, m] = g.fecha.split("-").map(Number);
    return y === now.getFullYear() && m === now.getMonth() + 1;
  };
  const monthRows = gastos.filter(inMonth);
  const monthTotal = monthRows.reduce((s, g) => s + Number(g.monto), 0);
  const facturableTotal = monthRows.filter((g) => g.facturable === true).reduce((s, g) => s + Number(g.monto), 0);
  const factCount = monthRows.filter((g) => g.facturable === true).length;

  const bars = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const total = gastos
      .filter((g) => {
        const [y, m] = g.fecha.split("-").map(Number);
        return y === d.getFullYear() && m === d.getMonth() + 1;
      })
      .reduce((s, g) => s + Number(g.monto), 0);
    return { label: t.dash.monthsShort[d.getMonth()], total, current: i === 11 };
  });
  const maxBar = Math.max(1, ...bars.map((b) => b.total));

  const byCat = new Map<string, number>();
  for (const g of monthRows) byCat.set(g.categoria ?? "Otros", (byCat.get(g.categoria ?? "Otros") ?? 0) + Number(g.monto));
  const cats = [...byCat.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, total], i) => ({ name, total, color: DONUT_COLORS[i % DONUT_COLORS.length] ?? "#2547E8" }));
  const catSum = cats.reduce((s, c) => s + c.total, 0);
  let acc = 0;
  const arcs = cats.map((c) => {
    const frac = catSum ? c.total / catSum : 0;
    const seg = { ...c, frac, offset: -acc * CIRC };
    acc += frac;
    return seg;
  });

  const spark = monthRows.length > 1
    ? monthRows
        .slice(0, 12)
        .reverse()
        .map((g, i, arr) => {
          const max = Math.max(1, ...arr.map((x) => Number(x.monto)));
          return `${(i / Math.max(1, arr.length - 1)) * 300},${52 - (Number(g.monto) / max) * 44}`;
        })
        .join(" ")
    : "0,44 150,30 300,10";
  const sparkLast = spark.split(" ").pop()?.split(",").map(Number) ?? [300, 10];

  return (
    <ScrollView className="flex-1 bg-canvas dark:bg-night" contentContainerClassName="pb-8">
      <View className="mx-5 mt-2 overflow-hidden rounded-3xl">
      <HeroGradient style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}>
        <SafeAreaView edges={["top"]}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="h-2 w-2 rounded-full bg-emerald-400" />
              <Text className="ml-2 font-sans text-label-caps tracking-[0.06em] text-white/85">
                {t.dash.months[now.getMonth()]?.toUpperCase()} {now.getFullYear()}
              </Text>
            </View>
            <Link href="/(app)/configuraciones" asChild>
              <PressableComponent variant="scale" haptic="light" accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Icon name="settings" size={18} color="#fff" />
              </PressableComponent>
            </Link>
          </View>
          <Text className="mt-4 font-sans text-sm font-medium text-white/75">{t.dash.totalMonth}</Text>
          <View className="flex-row items-center gap-2">
            <Text className="font-sans font-bold tabular-nums text-white" style={{ fontSize: heroSize, lineHeight: heroSize + 6, letterSpacing: -0.76 }}>
              {loading ? "…" : fmt(monthTotal)}
            </Text>
            <View className="rounded-md bg-black/30 px-2 py-1">
              <Text className="font-sans text-[11px] font-bold text-white">MXN</Text>
            </View>
          </View>
          <View className="mt-3 flex-row gap-3">
            <View className="flex-1 rounded-2xl border border-white/10 bg-[#0A0F24] p-3">
              <View className="flex-row items-center justify-between">
                <Text className="font-sans text-[11px] font-semibold text-white/75">{t.dash.facturable}</Text>
                <View className="h-2 w-2 rounded-full bg-emerald-400" />
              </View>
              <Text className="mt-1 font-sans text-lg font-bold tabular-nums text-white">{loading ? "…" : fmt(facturableTotal)}</Text>
              <View className="mt-1 flex-row items-center">
                <Icon name="check" size={12} color="#6EE7B7" />
                <Text className="ml-1 font-sans text-[11px] font-semibold text-emerald-300">{factCount} {t.dash.vouchers}</Text>
              </View>
            </View>
            <View className="flex-1 rounded-2xl border border-white/10 bg-[#0A0F24] p-3">
              <View className="flex-row items-center justify-between">
                <Text className="font-sans text-[11px] font-semibold text-white/75">{t.dash.total}</Text>
                <View className="h-2 w-2 rounded-full bg-sky-400" />
              </View>
              <Text className="mt-1 font-sans text-lg font-bold tabular-nums text-white">{loading ? "…" : fmt(monthTotal)}</Text>
              <View className="mt-1 flex-row items-center">
                <Icon name="file-text" size={12} color="#BAE6FD" />
                <Text className="ml-1 font-sans text-[11px] font-semibold text-white/75">{monthRows.length} {t.dash.withCfdi}</Text>
              </View>
            </View>
          </View>
          <Svg height={40} width="100%" viewBox="0 0 300 56" className="mt-2">
            <Polyline points={spark} fill="none" stroke="#93C5FD" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx={sparkLast[0] ?? 300} cy={sparkLast[1] ?? 10} r={5} fill="#fff" />
            <Circle cx={sparkLast[0] ?? 300} cy={sparkLast[1] ?? 10} r={2.5} fill="#2547E8" />
          </Svg>
        </SafeAreaView>
      </HeroGradient>
      </View>

      {loading ? (
        <SkeletonDashboard />
      ) : (
        <>
          <Link href="/(app)/escanear" asChild>
            <PressableComponent variant="both" haptic="light" className="mx-5 mt-3 flex-row items-center rounded-2xl border border-border bg-surface p-4 shadow-fintech-lg dark:border-stroke dark:bg-nightcard">
              <HeroGradient style={{ width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
                <Icon name="camera" size={20} color="#fff" />
              </HeroGradient>
              <View className="ml-3 flex-1">
                <Text className="font-sans text-title-card text-ink dark:text-white">{t.dash.scanTitle}</Text>
                <Text className="mt-0.5 font-sans text-[13px] text-muted dark:text-slate-400">{t.dash.scanDesc}</Text>
              </View>
              <View className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10">
                <Icon name="chevron-right" size={18} color="#94A3B8" />
              </View>
            </PressableComponent>
          </Link>

          <View className="mx-5 mt-6 flex-row items-center justify-between">
            <Text className="font-sans text-label-caps uppercase tracking-[0.06em] text-muted dark:text-slate-400">{t.dash.monthly} {now.getFullYear()}</Text>
            <Link href="/(app)/mis-gastos">
              <Text className="font-sans text-xs font-semibold text-primary dark:text-cobalt">{t.dash.viewExpenses}</Text>
            </Link>
          </View>
          <Card elevation="flat" className="mx-5 mt-2 p-4">
            <View className="h-36 flex-row items-end">
              {bars.map((b, i) => {
                const isCurrent = b.current && b.total > 0;
                return (
                  <View key={`bar-${i}`} className="flex-1 items-center" style={{ height: "100%", justifyContent: "flex-end" }}>
                    <View className="relative items-center" style={{ height: `${Math.max(4, (b.total / maxBar) * 100)}%`, width: "100%" }}>
                      {isCurrent && (
                        <View className="absolute -top-6 rounded bg-[#50C878] px-1.5 py-0.5">
                          <Text className="font-sans text-[9px] font-bold text-white">Máx</Text>
                        </View>
                      )}
                      <View
                        className={isCurrent ? "w-3/5 flex-1 rounded-t-md bg-[#50C878]" : "w-3/5 flex-1 rounded-t-md bg-[rgba(80,200,120,0.25)] dark:bg-[rgba(80,200,120,0.3)]"}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
            <View className="mt-2 flex-row">
              {bars.map((b, i) => (
                <Text
                  key={`lbl-${i}`}
                  className={b.current
                    ? "flex-1 text-center font-sans text-[10px] font-bold text-[#2E9E57] dark:text-[#50C878]"
                    : "flex-1 text-center font-sans text-[10px] text-faint"}
                >
                  {b.label}
                </Text>
              ))}
            </View>
          </Card>

          <View className="mx-5 mt-6 flex-row items-center justify-between">
            <Text className="font-sans text-label-caps uppercase tracking-[0.06em] text-muted dark:text-slate-400">{t.dash.byCat}</Text>
            <Link href="/(app)/mis-gastos">
              <Text className="font-sans text-xs font-semibold text-primary dark:text-cobalt">{t.dash.viewAll}</Text>
            </Link>
          </View>
          <Card elevation="flat" className="mx-5 mt-2 p-4">
            {cats.length === 0 ? (
              <Text className="font-sans text-sm text-muted dark:text-slate-400">{t.dash.emptyCat}</Text>
            ) : (
              <>
                <View className="items-center">
                  <Svg height={120} width={120} viewBox="0 0 120 120">
                    <Circle cx={60} cy={60} r={48} stroke={isDark ? "#2A3756" : "#F1F5F9"} strokeWidth={14} fill="none" />
                    {arcs.map((a) => (
                      <Circle
                        key={a.name}
                        cx={60}
                        cy={60}
                        r={48}
                        stroke={a.color}
                        strokeWidth={14}
                        fill="none"
                        strokeDasharray={`${CIRC * a.frac} ${CIRC}`}
                        strokeLinecap="round"
                        strokeDashoffset={a.offset}
                        transform="rotate(-90 60 60)"
                      />
                    ))}
                  </Svg>
                  <Text className="absolute font-sans text-lg font-bold tabular-nums text-ink dark:text-white" style={{ top: 50 }}>
                    {arcs[0] ? `${Math.round(arcs[0].frac * 100)}%` : ""}
                  </Text>
                </View>
                <View className="mt-4 gap-3">
                  {cats.slice(0, 3).map((c) => (
                    <View key={c.name} className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                        <Text className="ml-2 font-sans text-sm text-ink dark:text-slate-200" numberOfLines={1}>{c.name}</Text>
                      </View>
                      <Text className="font-sans text-sm font-bold tabular-nums text-ink dark:text-white">{fmt(c.total)}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </Card>

          <View className="mx-5 mt-6 flex-row items-center justify-between">
            <Text className="font-sans text-label-caps uppercase tracking-[0.06em] text-muted dark:text-slate-400">{t.dash.recent}</Text>
            <Link href="/(app)/mis-gastos">
              <Text className="font-sans text-xs font-semibold text-primary dark:text-cobalt">{t.dash.viewAll}</Text>
            </Link>
          </View>
          <View className="mx-5 mt-2 gap-2">
            {monthRows.length === 0 ? (
              <Card elevation="flat">
                <ExpenseEmpty text={t.dash.empty} />
              </Card>
            ) : (
              monthRows.slice(0, 5).map((g) => <ExpenseRow key={g.id} gasto={g} />)
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}
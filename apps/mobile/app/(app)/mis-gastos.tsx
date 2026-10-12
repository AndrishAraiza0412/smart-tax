import { useCallback, useState } from "react";
import { FlatList, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Input } from "../../components/ui/input";
import { useGastos } from "../../hooks/useGastos";
import { useMoney } from "../../lib/money";
import { useStrings } from "../../lib/strings";
import { Card } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { ScreenHeader } from "../../components/screen-header";
import { ExpenseEmpty, ExpenseRow } from "../../components/expense-row";
import { PressableComponent } from "../../components/ui/pressable";
import { SkeletonList } from "../../components/ui/skeleton-list";

/** Lista de gastos con filtros por estado CFDI y rango de fechas, con pull-to-refresh y paginación. */
type FilterId = "all" | "facturable" | "nonbill";
const FILTERS: FilterId[] = ["all", "facturable", "nonbill"];

const filterLabel = (f: FilterId, t: { all: string; facturable: string; noFacturable: string }): string =>
  f === "all" ? t.all : f === "facturable" ? t.facturable : t.noFacturable;

export default function MisGastos(): React.JSX.Element {
  const [active, setActive] = useState<FilterId>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const estadoQuery = active === "all" ? undefined : active === "facturable";
  const { gastos, loading, refreshing, error, refresh, loadMore } = useGastos({
    ...(estadoQuery === undefined ? {} : { facturable: estadoQuery }),
    from: from || undefined,
    to: to || undefined,
  });
  useFocusEffect(useCallback(() => {
    refresh();
  }, [refresh]));
  const { format } = useMoney();
  const t = useStrings();
  const total = gastos.reduce((sum, g) => sum + Number(g.monto), 0);
  return (
    <View className="flex-1 bg-canvas dark:bg-night">
      <SafeAreaView edges={["top"]} className="flex-1">
        <ScreenHeader title={t.gastos.title} subtitle={t.gastos.subtitle} />

        <Card elevation="flat" className="mx-5 mt-4 p-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-sans text-label-caps uppercase tracking-[0.06em] text-muted dark:text-slate-400">{t.gastos.filtered}</Text>
              <Text className="mt-1 font-sans text-[22px] font-bold tabular-nums text-ink dark:text-white">{format(total)}</Text>
            </View>
            <View className="items-end">
              <Text className="font-sans text-sm font-bold tabular-nums text-ink dark:text-white">{gastos.length}</Text>
              <Text className="font-sans text-xs text-muted dark:text-slate-400">{t.gastos.movements}</Text>
            </View>
          </View>
        </Card>

        <FlatList
          className="mt-4"
          contentContainerClassName="gap-2 px-5 pb-8"
          data={gastos}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          onEndReached={() => void loadMore?.()}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={<View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2 py-1"
            >
              {FILTERS.map((item) => {
                const isActive = item === active;
                return (
                  <PressableComponent
                    key={item}
                    variant="scale"
                    haptic="selection"
                    onPress={() => setActive(item)}
                    className={isActive
                      ? "rounded-full bg-primary px-4 py-2 shadow-glow-primary dark:bg-cobalt"
                      : "rounded-full border border-border bg-surface px-4 py-2 dark:border-stroke dark:bg-nightcard"}
                  >
                    <Text className={isActive
                      ? "font-sans text-[13px] font-semibold text-white"
                      : "font-sans text-[13px] font-medium text-muted dark:text-slate-400"}>
                      {filterLabel(item, t.gastos)}
                    </Text>
                  </PressableComponent>
                );
              })}
            </ScrollView>
            <View className="mt-3 flex-row gap-3">
              <View className="flex-1">
                <Label>{t.gastos.from}</Label>
                <Input placeholder={t.gastos.datePh} leftIcon="calendar" value={from} onChangeText={setFrom} containerClassName="mt-1.5" keyboardType="numbers-and-punctuation" />
              </View>
              <View className="flex-1">
                <Label>{t.gastos.to}</Label>
                <Input placeholder={t.gastos.datePh} leftIcon="calendar" value={to} onChangeText={setTo} containerClassName="mt-1.5" keyboardType="numbers-and-punctuation" />
              </View>
            </View>
          </View>}
          ListEmptyComponent={loading ? null : <ExpenseEmpty text={t.gastos.empty} />}
          renderItem={({ item }) => <ExpenseRow gasto={item} />}
        />
        {loading && <SkeletonList count={5} />}
        {error && <Text className="px-5 pb-4 text-red-600">{error}</Text>}
      </SafeAreaView>
    </View>
  );
}
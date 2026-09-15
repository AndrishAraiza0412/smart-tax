import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Input } from "../../components/ui/input";
import { useGastos } from "../../hooks/useGastos";

/** Lista de gastos con filtros por estado CFDI y rango de fechas, con pull-to-refresh y paginación. */
const FILTERS = ["Todos", "Facturable", "No facturable"] as const;

function pillFor(facturable: boolean): { label: string; classes: string; text: string } {
	return facturable
		? { label: "Facturable", classes: "border-emeraldBorder bg-emeraldTint", text: "text-emeraldText" }
		: { label: "No facturable", classes: "border-roseBorder bg-roseTint", text: "text-roseText" };
}

export default function MisGastos(): React.JSX.Element {
  const [active, setActive] = useState<(typeof FILTERS)[number]>("Todos");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
	const estadoQuery = active === "Todos" ? undefined : active === "Facturable" ? true : false;
	const { gastos, loading, refreshing, error, refresh, loadMore } = useGastos({
		...(estadoQuery === undefined ? {} : { facturable: estadoQuery }),
		from: from || undefined,
		to: to || undefined,
	});
  const total = gastos.reduce((sum, g) => sum + Number(g.monto), 0);
  return <View className="flex-1 bg-canvas dark:bg-night">
    <SafeAreaView edges={["top"]} className="flex-1">
      <View className="mt-2 px-5">
        <Text className="font-sans text-[22px] font-bold text-ink dark:text-white">Mis gastos</Text>
        <Text className="mt-1 font-sans text-[13px] text-muted dark:text-slate-400">Consulta y filtra tus comprobantes</Text>
      </View>

      <View className="mx-5 mt-4 flex-row items-center rounded-[20px] border border-slate-200 bg-white dark:border-white/10 dark:bg-nightcard p-4">
        <View>
          <Text className="text-[11px] font-bold tracking-widest text-muted dark:text-slate-400">TOTAL FILTRADO</Text>
          <Text className="mt-1 font-sans text-[22px] font-bold text-ink dark:text-white">${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</Text>
        </View>
        <View className="ml-auto items-end">
          <Text className="font-sans text-sm font-bold text-ink dark:text-white">{gastos.length}</Text>
          <Text className="font-sans text-xs text-muted dark:text-slate-400">movimientos</Text>
        </View>
      </View>

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
          <FlatList horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 py-1" data={FILTERS as unknown as string[]} keyExtractor={(f) => f} renderItem={({ item }) => {
            const isActive = item === active;
            return <Pressable className={isActive ? "rounded-full bg-primary px-4 py-2" : "rounded-full border border-slate-200 bg-white dark:border-white/10 dark:bg-nightcard px-4 py-2"} onPress={() => setActive(item as (typeof FILTERS)[number])}>
              <Text className={isActive ? "font-sans text-[13px] font-semibold text-white" : "font-sans text-[13px] font-medium text-muted dark:text-slate-400"}>{item}</Text>
            </Pressable>;
          }} />
          <View className="mt-3 flex-row gap-2">
            <Input className="flex-1 border-slate-200 bg-white dark:border-white/10 dark:bg-nightcard" placeholder="Desde AAAA-MM-DD" value={from} onChangeText={setFrom} />
            <Input className="flex-1 border-slate-200 bg-white dark:border-white/10 dark:bg-nightcard" placeholder="Hasta AAAA-MM-DD" value={to} onChangeText={setTo} />
          </View>
        </View>}
        ListEmptyComponent={<View className="mt-8 items-center">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10"><Feather name="inbox" size={28} color="#94A3B8" /></View>
          <Text className="mt-3 font-sans text-sm text-muted dark:text-slate-400">{loading ? "Cargando…" : "No hay gastos con estos filtros."}</Text>
        </View>}
        renderItem={({ item }) => {
			  const pill = pillFor(item.facturable);
          return <View className="flex-row items-center rounded-[20px] border border-slate-200 bg-white dark:border-white/10 dark:bg-nightcard px-4 py-3.5">
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-skyTint"><Feather name="file-text" size={20} color="#2547E8" /></View>
            <View className="ml-3 flex-1">
              <Text className="font-sans text-[15px] font-semibold text-ink dark:text-white">{item.descripcion}</Text>
				  <Text className="mt-0.5 font-sans text-xs text-faint">{item.fecha}</Text>
            </View>
            <View className="items-end">
              <Text className="font-sans text-[17px] font-bold text-ink dark:text-white">${Number(item.monto).toFixed(2)}</Text>
              <View className={`mt-1 rounded-full border px-2 py-0.5 ${pill.classes}`}><Text className={`text-[11px] font-semibold ${pill.text}`}>{pill.label}</Text></View>
            </View>
          </View>;
        }}
      />
      {error && <Text className="px-5 pb-4 text-red-600">{error}</Text>}
    </SafeAreaView>
  </View>;
}

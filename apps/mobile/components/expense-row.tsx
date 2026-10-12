import { Text, View } from "react-native";

import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Icon } from "./ui/icon";
import { useMoney } from "../lib/money";
import { useStrings } from "../lib/strings";
import type { Gasto } from "../hooks/useGastos";

/** Icono, fondo (claro/oscuro) y color por categoría. */
function iconFor(categoria: string | null | undefined): { icon: string; tint: string; color: string } {
  const c = (categoria ?? "").toLowerCase();
  if (/transport|uber|didi|taxi|gasolin/.test(c)) return { icon: "car", tint: "bg-skyTint dark:bg-[rgba(14,165,233,0.12)]", color: "#0EA5E9" };
  if (/aliment|comida|super|restaurante|caf/.test(c)) return { icon: "shopping-cart", tint: "bg-emeraldTint dark:bg-[rgba(16,185,129,0.12)]", color: "#059669" };
  if (/salud|farmacia|medic|hospital/.test(c)) return { icon: "plus", tint: "bg-roseTint dark:bg-[rgba(244,63,94,0.12)]", color: "#E11D48" };
  if (/oficina|ofice|mueble|papeler/.test(c)) return { icon: "briefcase", tint: "bg-skyTint dark:bg-[rgba(59,130,246,0.12)]", color: "#2547E8" };
  if (/servicio|luz|agua|internet|tel/.test(c)) return { icon: "zap", tint: "bg-[#FEF3C7] dark:bg-[rgba(245,158,11,0.12)]", color: "#D97706" };
  return { icon: "file-text", tint: "bg-slate-100 dark:bg-white/10", color: "#64748B" };
}

export function shortDate(fecha: string, months: readonly string[]): string {
  const [, m, d] = fecha.split("-").map(Number);
  return `${d ?? ""} ${months[(m ?? 1) - 1]?.slice(0, 3) ?? ""}`;
}

/** Fila de gasto compartida por dashboard y mis gastos. */
export function ExpenseRow({ gasto }: { gasto: Omit<Gasto, "facturable"> & { facturable: boolean | null } }): React.JSX.Element {
  const { format } = useMoney();
  const t = useStrings();
  const v = iconFor(gasto.categoria);
  const pill = gasto.facturable === true
    ? { label: t.dash.facturable, variant: "success" as const }
    : gasto.facturable === false
      ? { label: t.dash.noFacturable, variant: "error" as const }
      : { label: t.dash.unclassified, variant: "neutral" as const };
  return (
    <Card elevation="flat" className="px-4 py-3.5">
      <View className="flex-row items-center gap-3">
        <View className={`h-11 w-11 items-center justify-center rounded-lg ${v.tint}`}>
          <Icon name={v.icon} size={20} color={v.color} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-sans text-title-card text-ink dark:text-white" numberOfLines={1}>{gasto.descripcion}</Text>
          <Text className="mt-0.5 font-sans text-xs tabular-nums text-faint">{shortDate(gasto.fecha, t.dash.months)}{gasto.payment_methods ? ` · •••• ${gasto.payment_methods.last4}` : ""}</Text>
        </View>
        <View className="items-end">
          <Text className="font-sans text-[17px] font-bold tabular-nums text-ink dark:text-white">{format(Number(gasto.monto))}</Text>
          <Badge variant={pill.variant} className="mt-1">{pill.label}</Badge>
        </View>
      </View>
    </Card>
  );
}

/** Estado vacío compartido para listas de gastos. */
export function ExpenseEmpty({ text }: { text: string }): React.JSX.Element {
  return (
    <View className="items-center py-8">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10">
        <Icon name="inbox" size={28} color="muted" />
      </View>
      <Text className="mt-3 text-center font-sans text-sm text-muted dark:text-slate-400">{text}</Text>
    </View>
  );
}

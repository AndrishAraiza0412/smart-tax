import { Text, View } from "react-native";
import { PressableComponent } from "./pressable";
import { Icon, type IconName } from "./icon";

interface CategoryMeta {
  id: string;
  icon: IconName;
  tint: string;
  color: string;
}

const CATEGORIES: CategoryMeta[] = [
  { id: "Alimentación", icon: "fast-food", tint: "bg-emeraldTint dark:bg-[rgba(16,185,129,0.12)]", color: "#059669" },
  { id: "Transporte", icon: "car", tint: "bg-skyTint dark:bg-[rgba(14,165,233,0.12)]", color: "#0EA5E9" },
  { id: "Servicios", icon: "flash", tint: "bg-[#FEF3C7] dark:bg-[rgba(245,158,11,0.12)]", color: "#D97706" },
  { id: "Salud", icon: "medkit", tint: "bg-roseTint dark:bg-[rgba(244,63,94,0.12)]", color: "#E11D48" },
  { id: "Oficina", icon: "briefcase", tint: "bg-skyTint dark:bg-[rgba(59,130,246,0.12)]", color: "#2547E8" },
  { id: "Educación", icon: "book", tint: "bg-[#EDE9FE] dark:bg-[rgba(124,58,237,0.15)]", color: "#7C3AED" },
  { id: "Entretenimiento", icon: "star", tint: "bg-[#FDF2F8] dark:bg-[rgba(219,39,119,0.15)]", color: "#DB2777" },
  { id: "Otros", icon: "apps", tint: "bg-slate-100 dark:bg-white/10", color: "#64748B" },
];

interface CategoryGridProps {
  value: string;
  onChange: (value: string) => void;
}

/** 4-column icon grid selector. Professional alternative to a dropdown. */
export function CategoryGrid({ value, onChange }: CategoryGridProps): React.JSX.Element {
  return (
    <View className="mt-1.5" style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 8 }}>
      {CATEGORIES.map((c) => {
        const selected = value === c.id;
        return (
          <PressableComponent
            key={c.id}
            variant="scale"
            haptic="selection"
            onPress={() => onChange(c.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={c.id}
            style={{ width: "23.5%", minHeight: 84 }}
            className={
              selected
                ? "items-center justify-center rounded-xl border-2 border-primary bg-primary/5 px-1 py-2.5 dark:border-cobalt dark:bg-cobalt/10"
                : "items-center justify-center rounded-xl border-2 border-transparent bg-canvas px-1 py-2.5 dark:bg-white/5"
            }
          >
            <View className={`h-10 w-10 items-center justify-center rounded-xl ${c.tint}`}>
              <Icon name={c.icon} size={20} color={c.color} />
            </View>
            <Text
              className={
                selected
                  ? "mt-1.5 text-center font-sans text-[11px] font-bold text-primary dark:text-white"
                  : "mt-1.5 text-center font-sans text-[11px] font-medium text-muted dark:text-slate-300"
              }
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {c.id}
            </Text>
          </PressableComponent>
        );
      })}
    </View>
  );
}

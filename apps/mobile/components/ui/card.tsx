import { View } from "react-native";

/** Tarjeta blanca con borde sutil (radio y padding base del sistema). */

export function Card({ className = "", ...props }: React.ComponentProps<typeof View> & { className?: string }): React.JSX.Element {
  return <View className={`rounded-md border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-nightcard ${className}`} {...props} />;
}

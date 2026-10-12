import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "nativewind";
import type { StyleProp, ViewStyle } from "react-native";

/** Gradiente de marca con variante oscura. Redondeo y overflow van en el contenedor. */
export function HeroGradient({ style, children }: { style?: StyleProp<ViewStyle>; children?: React.ReactNode }): React.JSX.Element {
  const { colorScheme } = useColorScheme();
  return (
    <LinearGradient colors={colorScheme === "dark" ? ["#1E40AF", "#3B82F6"] : ["#1D3BBF", "#2547E8"]} style={style}>
      {children}
    </LinearGradient>
  );
}

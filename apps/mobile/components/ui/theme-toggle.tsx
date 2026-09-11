import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

/** Botón luna/sol que alterna el tema claro/oscuro global (NativeWind `darkMode: "class"`). */

export function ThemeToggle(): React.JSX.Element {
  const { colorScheme, setColorScheme } = useColorScheme();
  const dark = colorScheme === "dark";
  return <Pressable
    className="h-10 w-10 items-center justify-center rounded-full bg-white/20"
    accessibilityLabel="Cambiar tema"
    onPress={() => setColorScheme(dark ? "light" : "dark")}
  >
    <Ionicons name={dark ? "sunny-outline" : "moon-outline"} size={18} color="#fff" />
  </Pressable>;
}

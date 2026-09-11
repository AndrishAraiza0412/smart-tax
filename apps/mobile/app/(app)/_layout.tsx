import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

/**
 * Navegación principal con 5 tabs (Inicio, Escanear, Nuevo, Gastos, Asesor).
 * Configuración y Planes existen como rutas ocultas (`href: null`) y se
 * alcanzan desde el dashboard y sus enlaces internos.
 */
export default function AppLayout(): React.JSX.Element {
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === "dark";
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: "#2547E8", tabBarInactiveTintColor: "#94A3B8", tabBarStyle: { backgroundColor: dark ? "#0B1120" : "#fff", borderTopWidth: 1, borderTopColor: dark ? "rgba(255,255,255,0.1)" : "#F1F5F9", height: 64, paddingBottom: 10, paddingTop: 6 }, tabBarLabelStyle: { fontSize: 11, fontWeight: "600" } }}>
    <Tabs.Screen name="dashboard" options={{ title: "Inicio", tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} /> }} />
    <Tabs.Screen name="escanear" options={{ title: "Escanear", tabBarIcon: ({ color, size }) => <Feather name="camera" size={size} color={color} /> }} />
    <Tabs.Screen name="gasto-manual" options={{ title: "Nuevo", tabBarIcon: ({ color, size }) => <Feather name="plus-circle" size={size} color={color} /> }} />
    <Tabs.Screen name="mis-gastos" options={{ title: "Gastos", tabBarIcon: ({ color, size }) => <Feather name="file-text" size={size} color={color} /> }} />
    <Tabs.Screen name="asesor" options={{ title: "Asesor", tabBarIcon: ({ color, size }) => <Feather name="cpu" size={size} color={color} /> }} />
    <Tabs.Screen name="configuraciones" options={{ href: null }} />
    <Tabs.Screen name="planes" options={{ href: null }} />
    <Tabs.Screen name="index" options={{ href: null }} />
  </Tabs>;
}

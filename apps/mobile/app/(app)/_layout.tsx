import { Tabs } from "expo-router";
import { Icon } from "../../components/ui/icon";
import { useColorScheme } from "nativewind";

import { useStrings } from "../../lib/strings";

/**
 * Navegación principal con 5 tabs (Inicio, Escanear, Nuevo, Gastos, Asesor).
 * Configuración y Planes existen como rutas ocultas (`href: null`) y se
 * alcanzan desde el dashboard y sus enlaces internos.
 */
export default function AppLayout(): React.JSX.Element {
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === "dark";
  const t = useStrings();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: dark ? "#3B82F6" : "#2547E8",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarStyle: {
          backgroundColor: dark ? "#0B0F19" : "#fff",
          borderTopWidth: 1,
          borderTopColor: dark ? "#2A3756" : "#F1F5F9",
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t.tabs.home,
          tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="escanear"
        options={{
          title: t.tabs.scan,
          tabBarIcon: ({ color, size }) => <Icon name="camera" size={size} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="gasto-manual"
        options={{
          title: t.tabs.new,
          tabBarIcon: ({ color, size }) => <Icon name="plus-circle" size={size} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="mis-gastos"
        options={{
          title: t.tabs.expenses,
          tabBarIcon: ({ color, size }) => <Icon name="file-text" size={size} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="asesor"
        options={{
          title: t.tabs.advisor,
          tabBarIcon: ({ color, size }) => <Icon name="cpu" size={size} color={String(color)} />,
        }}
      />
      <Tabs.Screen name="configuraciones" options={{ href: null }} />
      <Tabs.Screen name="planes" options={{ href: null }} />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}
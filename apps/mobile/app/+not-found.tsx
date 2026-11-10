import { Link } from "expo-router";
import { Text, View } from "react-native";

/** 404 en español en lugar de la pantalla genérica de Expo. */
export default function NotFound(): React.JSX.Element {
  return (
    <View className="flex-1 items-center justify-center bg-canvas px-8 dark:bg-night">
      <Text className="font-sans text-xl font-bold text-ink dark:text-white">Página no encontrada</Text>
      <Link href="/" asChild>
        <Text accessibilityRole="link" className="mt-3 font-sans text-sm font-semibold text-primary dark:text-cobalt">Volver al inicio</Text>
      </Link>
    </View>
  );
}

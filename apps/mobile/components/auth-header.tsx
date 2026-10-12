import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "./ui/icon";
import { PressableComponent } from "./ui/pressable";
import { HeroGradient } from "./hero-gradient";

interface AuthHeaderProps {
  icon: string;
  badge: string;
  title: string;
  desc: string;
  onBack?: () => void;
}

/** Header con gradiente compartido por login, registro y recuperar contraseña. */
export function AuthHeader({ icon, badge, title, desc, onBack }: AuthHeaderProps): React.JSX.Element {
  return (
    <View className="overflow-hidden rounded-b-3xl">
      <HeroGradient style={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <SafeAreaView edges={["top"]}>
          <View className="mt-2 h-10 flex-row items-center justify-between">
            {onBack ? (
              <PressableComponent variant="scale" haptic="light" onPress={onBack} accessibilityRole="button" accessibilityLabel="Regresar" className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Icon name="arrow-left" size={18} color="#FFFFFF" />
              </PressableComponent>
            ) : null}
            <View className="rounded-full bg-border px-3 py-1.5 dark:bg-nightcard">
              <Text className="font-sans text-[11px] font-bold tracking-[0.06em] text-ink dark:text-white">{badge}</Text>
            </View>
            {onBack ? <View className="h-10 w-10" /> : <View />}
          </View>
          <View className="mt-6 items-center">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-white">
              <Icon name={icon} size={30} color="#2547E8" />
            </View>
            <Text className="mt-4 font-sans text-[22px] font-bold text-white">{title}</Text>
            <Text className="mt-2 px-6 text-center font-sans text-sm text-white/75">{desc}</Text>
          </View>
        </SafeAreaView>
      </HeroGradient>
    </View>
  );
}

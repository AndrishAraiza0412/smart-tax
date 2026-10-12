import { Text, View } from "react-native";

import { HeroGradient } from "./hero-gradient";
import { Icon } from "./ui/icon";
import { PressableComponent } from "./ui/pressable";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

/** Header en card azul curveada, igual al de Inicio y Escanear. */
export function ScreenHeader({ title, subtitle, onBack }: ScreenHeaderProps): React.JSX.Element {
  return (
    <View className="mx-5 mt-2 overflow-hidden rounded-3xl">
      <HeroGradient style={{ padding: 20 }}>
        <View className="flex-row items-center">
          {onBack ? (
            <PressableComponent variant="scale" haptic="light" onPress={onBack} accessibilityRole="button" accessibilityLabel="Regresar" className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <Icon name="arrow-left" size={18} color="#FFFFFF" />
            </PressableComponent>
          ) : null}
          <View className="flex-1">
            <Text className="font-sans text-[22px] font-bold text-white">{title}</Text>
            {subtitle ? <Text className="mt-1 font-sans text-[13px] leading-5 text-white/75">{subtitle}</Text> : null}
          </View>
        </View>
      </HeroGradient>
    </View>
  );
}

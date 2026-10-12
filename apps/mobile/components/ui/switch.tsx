import React from "react";
import { View, Text } from "react-native";
import { PressableComponent } from "./pressable";
import { Animated, Easing } from "react-native";

export type SwitchSize = "sm" | "md";
export type SwitchColor = "primary" | "secondary" | "success" | "warning" | "error";

interface SwitchBaseProps {
  label?: string;
  description?: string;
  size?: SwitchSize;
  color?: SwitchColor;
  disabled?: boolean;
  value: boolean;
  onValueChange: (value: boolean) => void;
  className?: string;
  labelClassName?: string;
  descriptionClassName?: string;
  thumbClassName?: string;
  trackClassName?: string;
}

const sizeStyles: Record<SwitchSize, { track: { width: number; height: number }; thumb: { width: number; height: number } }> = {
  sm: { track: { width: 32, height: 20 }, thumb: { width: 16, height: 16 } },
  md: { track: { width: 44, height: 24 }, thumb: { width: 20, height: 20 } },
};

const colorStyles: Record<SwitchColor, { trackTrue: string; trackFalse: string; thumb: string }> = {
  primary: { trackTrue: "bg-primary", trackFalse: "bg-border", thumb: "bg-white" },
  secondary: { trackTrue: "bg-secondary", trackFalse: "bg-border", thumb: "bg-white" },
  success: { trackTrue: "bg-secondary", trackFalse: "bg-border", thumb: "bg-white" },
  warning: { trackTrue: "bg-tertiary", trackFalse: "bg-border", thumb: "bg-white" },
  error: { trackTrue: "bg-error", trackFalse: "bg-border", thumb: "bg-white" },
};

export function Switch({
  label,
  description,
  size = "md",
  color = "primary",
  disabled = false,
  value,
  onValueChange,
  className = "",
  labelClassName = "",
  descriptionClassName = "",
  thumbClassName = "",
  trackClassName = "",
}: SwitchBaseProps): React.JSX.Element {
  const sizes = sizeStyles[size];
  const colors = colorStyles[color];

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  return (
    <PressableComponent
      variant="none"
      haptic="selection"
      disabled={disabled}
      onPress={handlePress}
      className={`flex-row items-center gap-3 ${className}`}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={label ?? ""}
    >
      <View className="flex-row items-center gap-2">
        <View
          className={`
            relative rounded-full transition-colors duration-fast ease-out
            ${value ? colors.trackTrue : colors.trackFalse}
            ${disabled ? "opacity-50" : ""}
            ${trackClassName}
          `}
          style={{ width: sizes.track.width, height: sizes.track.height }}
        >
          <AnimatedSwitchThumb
            value={value}
            size={size}
            thumbColor={colors.thumb}
            thumbClassName={thumbClassName}
          />
        </View>
      </View>
      {(label || description) && (
        <View className="flex-1 min-w-0">
          {label && (
            <Text className={`font-sans text-label text-ink dark:text-slate-200 ${disabled ? "opacity-50" : ""} ${labelClassName}`}>
              {label}
            </Text>
          )}
          {description && (
            <Text className={`font-sans text-body-sm text-muted dark:text-faint ${descriptionClassName}`}>
              {description}
            </Text>
          )}
        </View>
      )}
    </PressableComponent>
  );
}

interface AnimatedSwitchThumbProps {
  value: boolean;
  size: SwitchSize;
  thumbColor: string;
  thumbClassName?: string;
}

function AnimatedSwitchThumb({ value, size, thumbColor, thumbClassName = "" }: AnimatedSwitchThumbProps): React.JSX.Element {
  const translateX = React.useRef(new Animated.Value(value ? sizeStyles[size].track.width - sizeStyles[size].thumb.width - 2 : 2)).current;

  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: value ? sizeStyles[size].track.width - sizeStyles[size].thumb.width - 2 : 2,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [value, size]);

  const sizes = sizeStyles[size];

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: 0,
        top: (sizes.track.height - sizes.thumb.height) / 2,
        transform: [{ translateX }],
        width: sizes.thumb.width,
        height: sizes.thumb.height,
        borderRadius: sizes.thumb.height / 2,
        backgroundColor: "#FFFFFF",
        shadowColor: "#0F172A",
        shadowOpacity: 0.15,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
      }}
      className={thumbClassName}
    />
  );
}
import { Text, View } from "react-native";
import { PressableComponent } from "./pressable";
import { Icon } from "./icon";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  disabled?: boolean;
  className?: string;
  style?: React.ComponentProps<typeof View>["style"];
  onPress?: () => void;
  accessibilityLabel?: string;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary dark:bg-cobalt text-white shadow-primary dark:shadow-glow-primary",
  secondary: "bg-secondary text-white shadow-secondary",
  outline: "border-2 border-primary dark:border-cobalt text-primary dark:text-white bg-transparent",
  ghost: "text-primary dark:text-white bg-transparent",
  destructive: "bg-error text-white shadow-error",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3",
  md: "h-11 px-4",
  lg: "h-[52px] px-6",
};

const textSizeStyles: Record<ButtonSize, string> = {
  sm: "text-body-sm",
  md: "text-body-md",
  lg: "text-body-lg",
};

const textVariantStyles: Record<ButtonVariant, string> = {
  primary: "text-white",
  secondary: "text-white",
  outline: "text-primary dark:text-white",
  ghost: "text-primary dark:text-white",
  destructive: "text-white",
};

const variantPressableProps: Record<ButtonVariant, { haptic: "light" | "medium" | "heavy" | "selection" | "none" }> = {
  primary: { haptic: "light" },
  secondary: { haptic: "light" },
  outline: { haptic: "none" },
  ghost: { haptic: "none" },
  destructive: { haptic: "light" },
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled = false,
  className = "",
  style,
  onPress,
  accessibilityLabel,
  children,
}: ButtonBaseProps): React.JSX.Element {
  const isDisabled = disabled || isLoading;
  // Icono del mismo color que el texto: blanco sobre fondos sólidos, primario en outline/ghost.
  const iconColor = variant === "outline" || variant === "ghost" ? "primary" : "#FFFFFF";
  const { haptic } = variantPressableProps[variant];

  const pressableProps = {
    variant: "both" as const,
    haptic,
    disabled: isDisabled,
    ...(accessibilityLabel ? { accessibilityLabel } : {}),
    className: `
      flex-row items-center justify-center gap-2
      rounded-xl font-sans font-semibold
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${fullWidth ? "w-full" : ""}
      ${isDisabled ? "opacity-50" : ""}
      ${className}
    `,
    style,
    ...(onPress ? { onPress } : {}),
  };

  return (
    <PressableComponent {...pressableProps}>
      {isLoading ? (
        <View className="flex-row items-center justify-center gap-2">
          <Icon name="refresh-cw" size={size === "sm" ? 16 : size === "md" ? 20 : 24} color={iconColor} className="animate-spin" />
          <Text className={`font-sans font-semibold ${textSizeStyles[size]} ${textVariantStyles[variant]}`}>Cargando...</Text>
        </View>
      ) : (
        <>
          {leftIcon && <Icon name={leftIcon} size={size === "sm" ? 16 : size === "md" ? 20 : 24} color={iconColor} />}
          <Text className={`font-sans font-semibold ${textSizeStyles[size]} ${textVariantStyles[variant]}`}>{children}</Text>
          {rightIcon && <Icon name={rightIcon} size={size === "sm" ? 16 : size === "md" ? 20 : 24} color={iconColor} />}
        </>
      )}
    </PressableComponent>
  );
}
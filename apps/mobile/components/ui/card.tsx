import { View, Text } from "react-native";
import { PressableComponent } from "./pressable";

export type CardElevation = "flat" | "elevated" | "outlined";
export type CardPadding = "none" | "sm" | "md" | "lg";

interface CardBaseProps {
  elevation?: CardElevation;
  padding?: CardPadding;
  interactive?: boolean;
  hoverable?: boolean;
  onPress?: () => void;
  className?: string;
  style?: React.ComponentProps<typeof View>["style"];
  children: React.ReactNode;
}

const elevationStyles: Record<CardElevation, string> = {
  flat: "border border-border dark:border-stroke shadow-fintech",
  elevated: "border border-border dark:border-stroke shadow-fintech-lg dark:shadow-dark-md",
  outlined: "border-2 border-primary dark:border-cobalt shadow-fintech",
};

const paddingStyles: Record<CardPadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function Card({
  elevation = "flat",
  padding = "md",
  interactive = false,
  hoverable = false,
  onPress,
  className = "",
  style,
  children,
}: CardBaseProps): React.JSX.Element {
  const baseClassName = `
    rounded-2xl bg-surface dark:bg-nightcard
    ${elevationStyles[elevation]}
    ${paddingStyles[padding]}
    ${interactive ? "active:opacity-75" : ""}
    ${hoverable ? "transition-shadow duration-normal ease-out" : ""}
    ${className}
  `;

  if (interactive && onPress) {
    return (
      <PressableComponent
        variant={hoverable ? "both" : "opacity"}
        haptic="none"
        onPress={onPress}
        className={baseClassName}
        style={style}
      >
        {children}
      </PressableComponent>
    );
  }

  return <View className={baseClassName} style={style}>{children}</View>;
}

export interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className = "" }: CardHeaderProps): React.JSX.Element {
  return (
    <View className={`flex-row items-center justify-between mb-3 ${className}`}>
      <View className="flex-1">
        <Text className="font-sans text-title-md text-ink dark:text-white">{title}</Text>
        {subtitle && <Text className="font-sans text-body-sm text-muted dark:text-faint mt-0.5">{subtitle}</Text>}
      </View>
      {action && <View>{action}</View>}
    </View>
  );
}

export interface CardContentProps {
  className?: string;
  children: React.ReactNode;
}

export function CardContent({ className = "", children }: CardContentProps): React.JSX.Element {
  return <View className={className}>{children}</View>;
}

export interface CardFooterProps {
  className?: string;
  children: React.ReactNode;
}

export function CardFooter({ className = "", children }: CardFooterProps): React.JSX.Element {
  return (
    <View className={`flex-row items-center justify-end gap-2 mt-4 pt-3 border-t border-border dark:border-stroke ${className}`}>
      {children}
    </View>
  );
}
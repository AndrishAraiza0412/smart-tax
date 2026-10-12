import { Text, View, Pressable } from "react-native";
import { Icon } from "./icon";

export type BadgeVariant = "primary" | "secondary" | "success" | "warning" | "error" | "neutral";
export type BadgeSize = "sm" | "md";

interface BadgeBaseProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  dotColor?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
  style?: React.ComponentProps<typeof View>["style"];
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, { container: string; text: string; dot: string }> = {
  primary: { container: "bg-primary border border-primary dark:bg-cobalt dark:border-cobalt", text: "text-white", dot: "bg-white" },
  secondary: { container: "bg-secondary-muted border border-secondary/20 dark:bg-secondary-muted/30 dark:border-secondary/30", text: "text-secondary dark:text-mint", dot: "bg-secondary" },
  success: { container: "bg-emeraldTint border border-emeraldBorder dark:bg-[rgba(16,185,129,0.12)] dark:border-[rgba(16,185,129,0.3)]", text: "text-emeraldText dark:text-mint", dot: "bg-secondary" },
  warning: { container: "bg-skyTint border border-skyBorder dark:bg-[rgba(14,165,233,0.12)] dark:border-[rgba(14,165,233,0.3)]", text: "text-skyText dark:text-[#7DD3FC]", dot: "bg-tertiary" },
  error: { container: "bg-roseTint border border-roseBorder dark:bg-[rgba(244,63,94,0.12)] dark:border-[rgba(244,63,94,0.3)]", text: "text-roseText dark:text-[#FDA4AF]", dot: "bg-error" },
  neutral: { container: "bg-muted/10 border border-transparent dark:bg-white/10 dark:border-white/10", text: "text-muted dark:text-slate-300", dot: "bg-muted" },
};

const sizeStyles: Record<BadgeSize, { container: string; text: string; dot: string; gap: string }> = {
  sm: { container: "px-2 py-0.5", text: "text-caption", dot: "w-1.5 h-1.5", gap: "gap-1" },
  md: { container: "px-2.5 py-1", text: "text-badge-pill", dot: "w-2 h-2", gap: "gap-1.5" },
};

export function Badge({
  variant = "neutral",
  size = "md",
  dot = false,
  dotColor,
  dismissible = false,
  onDismiss,
  className = "",
  style,
  children,
}: BadgeBaseProps): React.JSX.Element {
  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  return (
    <View
      className={`
        flex-row items-center
        rounded-full font-sans font-semibold
        ${styles.container}
        ${sizes.container}
        ${sizes.gap}
        ${dismissible ? "pr-1" : ""}
        ${className}
      `}
      style={style}
    >
      {dot && (
        <View
          className={`
            rounded-full
            ${dotColor ? "" : styles.dot}
            ${sizes.dot}
          `}
          style={dotColor ? { backgroundColor: dotColor } : undefined}
        />
      )}
      <Text className={`${sizes.text} ${styles.text}`}>{children}</Text>
      {dismissible && (
        <Pressable
          onPress={onDismiss}
          className="flex items-center justify-center -mr-1"
          accessibilityLabel="Dismiss"
          accessibilityRole="button"
        >
          <Icon name="x" size={size === "sm" ? 12 : 14} color="muted" />
        </Pressable>
      )}
    </View>
  );
}
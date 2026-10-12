import { View } from "react-native";
import { SkeletonCard, SkeletonCardSimple } from "./skeleton-card";
import { SkeletonTitle } from "./skeleton-text";

export interface SkeletonListProps {
  count?: number;
  variant?: "card" | "simple";
  itemHeight?: number;
  className?: string;
  animate?: boolean;
  showSeparator?: boolean;
}

export function SkeletonList({
  count = 5,
  variant = "card",
  itemHeight = 120,
  className = "",
  animate = true,
  showSeparator = false,
}: SkeletonListProps): React.JSX.Element {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === "simple") {
    return (
      <View className={`space-y-3 ${className}`}>
        {items.map((i) => (
          <SkeletonCardSimple key={i} height={itemHeight} animate={animate} />
        ))}
      </View>
    );
  }

  return (
    <View className={className} style={{ paddingBottom: 16 }}>
      {items.map((i) => (
        <View key={`skeleton-${i}`} className={i === 0 ? "pt-0" : "pt-3"}>
          <SkeletonCard
            hasAvatar={true}
            hasTitle={true}
            hasSubtitle={true}
            hasDescription={true}
            lines={2}
            animate={animate}
          />
          {showSeparator && i < items.length - 1 && <View className="h-px bg-border my-3" />}
        </View>
      ))}
    </View>
  );
}
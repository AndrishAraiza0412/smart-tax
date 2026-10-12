import { View } from "react-native";
import { Skeleton, SkeletonCircle, SkeletonRect } from "./skeleton";
import { SkeletonText, SkeletonTitle, SkeletonSubtitle } from "./skeleton-text";

export interface SkeletonCardProps {
  hasAvatar?: boolean;
  hasTitle?: boolean;
  hasSubtitle?: boolean;
  hasDescription?: boolean;
  hasAction?: boolean;
  lines?: number;
  className?: string;
  animate?: boolean;
}

export function SkeletonCard({
  hasAvatar = true,
  hasTitle = true,
  hasSubtitle = true,
  hasDescription = true,
  hasAction = false,
  lines = 2,
  className = "",
  animate = true,
}: SkeletonCardProps): React.JSX.Element {
  return (
    <View className={`rounded-xl border border-border bg-surface dark:border-stroke dark:bg-nightcard p-4 ${className}`}>
      <View className="flex-row items-start gap-3">
        {hasAvatar && <SkeletonCircle size={40} animate={animate} />}
        <View className="flex-1 min-w-0 mt-1">
          {hasTitle && <SkeletonTitle width="50%" animate={animate} className="mb-1.5" />}
          {hasSubtitle && <SkeletonSubtitle width="70%" animate={animate} className="mb-2" />}
          {hasDescription && <SkeletonText lines={lines} animate={animate} />}
        </View>
        {hasAction && <SkeletonRect width={80} height={32} radius={8} animate={animate} className="mt-1" />}
      </View>
    </View>
  );
}

export interface SkeletonCardSimpleProps {
  height?: number;
  className?: string;
  animate?: boolean;
}

export function SkeletonCardSimple({
  height = 120,
  className = "",
  animate = true,
}: SkeletonCardSimpleProps): React.JSX.Element {
  return (
    <Skeleton
      className={`rounded-xl border border-border bg-surface dark:border-stroke dark:bg-nightcard ${className}`}
      style={{ height }}
      animate={animate}
    />
  );
}
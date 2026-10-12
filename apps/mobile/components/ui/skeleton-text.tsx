import { View } from "react-native";
import { Skeleton, SkeletonRect } from "./skeleton";
import type { DimensionValue } from "react-native";

export interface SkeletonTextProps {
  lines?: number;
  lineWidth?: DimensionValue;
  lastLineWidth?: DimensionValue;
  lineHeight?: number;
  spacing?: number;
  className?: string;
  animate?: boolean;
}

export function SkeletonText({
  lines = 3,
  lineWidth = "100%",
  lastLineWidth = "60%",
  lineHeight = 20,
  spacing = 8,
  className = "",
  animate = true,
}: SkeletonTextProps): React.JSX.Element {
  return (
    <View className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonRect
          key={i}
          width={i === lines - 1 ? lastLineWidth : lineWidth}
          height={lineHeight}
          radius={4}
          animate={animate}
          style={{ marginBottom: i === lines - 1 ? 0 : spacing }}
        />
      ))}
    </View>
  );
}

export interface SkeletonTitleProps {
  width?: DimensionValue;
  className?: string;
  animate?: boolean;
}

export function SkeletonTitle({
  width = "40%",
  className = "",
  animate = true,
}: SkeletonTitleProps): React.JSX.Element {
  return <SkeletonRect width={width} height={24} radius={4} animate={animate} className={className} />;
}

export interface SkeletonSubtitleProps {
  width?: DimensionValue;
  className?: string;
  animate?: boolean;
}

export function SkeletonSubtitle({
  width = "70%",
  className = "",
  animate = true,
}: SkeletonSubtitleProps): React.JSX.Element {
  return <SkeletonRect width={width} height={16} radius={4} animate={animate} className={className} />;
}

export interface SkeletonCaptionProps {
  width?: DimensionValue;
  className?: string;
  animate?: boolean;
}

export function SkeletonCaption({
  width = "50%",
  className = "",
  animate = true,
}: SkeletonCaptionProps): React.JSX.Element {
  return <SkeletonRect width={width} height={12} radius={4} animate={animate} className={className} />;
}
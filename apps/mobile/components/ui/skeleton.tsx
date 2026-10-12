import { Animated, View, StyleSheet, type DimensionValue, type ViewStyle } from "react-native";
import { useRef, useEffect } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface SkeletonProps {
  className?: string;
  style?: React.ComponentProps<typeof View>["style"];
  animate?: boolean;
}

export function Skeleton({
  className = "",
  style,
  animate = true,
}: SkeletonProps): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const shouldAnimate = animate && !reducedMotion;

  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    if (!shouldAnimate) return;

    shimmerAnim.setValue(-1);
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        easing: (t) => t,
        useNativeDriver: true,
      })
    ).start();
  }, [shouldAnimate]);

  const baseStyle = StyleSheet.flatten([style, { overflow: "hidden", position: "relative" }]) as ViewStyle;

  const shimmerStyle = {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.3)",
    transform: [
      {
        translateX: shimmerAnim.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: ["-100%", "0%", "100%"],
        }),
      },
    ],
  };

  return (
    <View style={baseStyle} className={className}>
      {shouldAnimate && <Animated.View style={shimmerStyle} />}
    </View>
  );
}

export interface SkeletonCircleProps {
  size: number;
  className?: string;
  animate?: boolean;
}

export function SkeletonCircle({
  size,
  className = "",
  animate = true,
}: SkeletonCircleProps): React.JSX.Element {
  return (
    <Skeleton className={`rounded-full ${className}`} style={{ width: size, height: size }} animate={animate} />
  );
}

export interface SkeletonRectProps {
  width: DimensionValue;
  height: number;
  radius?: number;
  className?: string;
  animate?: boolean;
  style?: React.ComponentProps<typeof View>["style"];
}

export function SkeletonRect({
  width,
  height,
  radius = 8,
  className = "",
  animate = true,
  style,
}: SkeletonRectProps): React.JSX.Element {
  return (
    <Skeleton
      className={`rounded-${radius === 9999 ? "full" : radius === 12 ? "lg" : radius === 16 ? "xl" : "md"} ${className}`}
      style={{ width, height, ...style }}
      animate={animate}
    />
  );
}
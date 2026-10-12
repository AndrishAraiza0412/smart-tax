import React from "react";
import { useEffect, useRef } from "react";
import { Animated, View, type ViewStyle } from "react-native";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: "fast" | "normal" | "slow";
  direction?: "up" | "down" | "left" | "right";
  className?: string;
  style?: ViewStyle;
}

const durationMap = {
  fast: 150,
  normal: 200,
  slow: 280,
};

const directionMap = {
  up: { translateY: 10 },
  down: { translateY: -10 },
  left: { translateX: 10 },
  right: { translateX: -10 },
};

export function FadeIn({
  children,
  delay = 0,
  duration = "normal",
  direction = "up",
  className = "",
  style,
}: FadeInProps): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(direction === "left" || direction === "right" ? (directionMap[direction].translateX ?? 0) : (directionMap[direction].translateY ?? 0))).current;

  useEffect(() => {
    const animDuration = reducedMotion ? 0 : durationMap[duration];

    const startAnimation = () => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: animDuration,
          useNativeDriver: true,
        }),
        Animated.timing(translate, {
          toValue: 0,
          duration: animDuration,
          useNativeDriver: true,
        }),
      ]).start();
    };

    if (delay > 0) {
      const timer = setTimeout(startAnimation, delay);
      return () => clearTimeout(timer);
    }

    startAnimation();
  }, [opacity, translate, delay, duration, reducedMotion, direction]);

  const transform = direction === "left" || direction === "right"
    ? [{ translateX: translate }]
    : [{ translateY: translate }];

  return (
    <Animated.View
      style={[
        { opacity, transform },
        style,
      ] as ViewStyle[]}
      className={className}
    >
      {children}
    </Animated.View>
  );
}

export function StaggeredFadeIn({
  children,
  delay = 50,
  duration = "normal",
  direction = "up",
  className = "",
  style,
}: Omit<FadeInProps, "children"> & { children: React.ReactNode[] }): React.JSX.Element {
  return (
    <View className={className} style={style}>
      {children.map((child, index) => (
        <FadeIn key={index} delay={index * delay} duration={duration} direction={direction}>
          {child}
        </FadeIn>
      ))}
    </View>
  );
}
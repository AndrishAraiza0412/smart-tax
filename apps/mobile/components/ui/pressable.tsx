import { Pressable, Animated } from "react-native";
import { cssInterop } from "nativewind";
import { useRef, forwardRef } from "react";
import type { StyleProp, ViewStyle, AccessibilityRole } from "react-native";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { hapticFeedback } from "@/lib/haptics";

type Variant = "scale" | "opacity" | "both" | "none";
type HapticType = "light" | "medium" | "heavy" | "selection" | "none";

type PressableInstance = React.ComponentProps<typeof Pressable>["ref"] extends React.RefObject<infer T> ? T : never;

interface PressableProps {
  variant?: Variant;
  haptic?: HapticType;
  disabled?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityRole?: AccessibilityRole;
  accessibilityExpanded?: boolean;
  accessibilityHasPopup?: "menu" | "listbox" | "tree" | "grid" | "dialog";
  accessibilityRequired?: boolean;
  accessibilityInvalid?: boolean;
  accessibilityLabel?: string;
  accessibilitySelected?: boolean;
  accessibilityDisabled?: boolean;
  accessibilityState?: React.ComponentProps<typeof Pressable>["accessibilityState"];
}

// Un solo elemento animado: className (layout incluido: flex-1, márgenes, ancho) y la
// animación viven juntos. Antes className iba a un Pressable interno y el wrapper
// animado no crecía, dejando botones pegados a la izquierda.
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
cssInterop(AnimatedPressable, { className: "style" });

// Con clases transition-/animate-, NativeWind envuelve el componente en Reanimated y éste
// pasa el Animated.Value de `scale` crudo al View ("Transform with key of scale must be a number").
// Este componente ya anima por su cuenta: se descartan esas clases para todos los callers.
const ANIMATION_CLASS = /^(transition|duration|ease|delay|animate)(-|$)/;
const stripAnimationClasses = (className: string): string =>
  className.split(/\s+/).filter((c) => c && !ANIMATION_CLASS.test(c)).join(" ");

const PressableComponent = forwardRef<PressableInstance, PressableProps>(
  (
    {
      variant = "both",
      haptic = "light",
      disabled = false,
      onPress,
      children,
      className = "",
      style,
      ...rest
    },
    ref
  ): React.JSX.Element => {
    const reducedMotion = useReducedMotion();
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;

    const animateIn = () => {
      if (reducedMotion || disabled) return;
      const animations: Animated.CompositeAnimation[] = [];
      if (variant === "scale" || variant === "both") {
        animations.push(Animated.timing(scaleAnim, { toValue: 0.96, duration: 100, useNativeDriver: true }));
      }
      if (variant === "opacity" || variant === "both") {
        animations.push(Animated.timing(opacityAnim, { toValue: 0.8, duration: 100, useNativeDriver: true }));
      }
      Animated.parallel(animations).start();
      if (haptic !== "none") hapticFeedback(haptic);
    };

    const animateOut = () => {
      if (reducedMotion || disabled) return;
      const animations: Animated.CompositeAnimation[] = [];
      if (variant === "scale" || variant === "both") {
        animations.push(Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }));
      }
      if (variant === "opacity" || variant === "both") {
        animations.push(Animated.timing(opacityAnim, { toValue: 1, duration: 150, useNativeDriver: true }));
      }
      Animated.parallel(animations).start();
    };

    const handlePress = () => {
      if (!disabled && onPress) onPress();
    };

    return (
      <AnimatedPressable
        ref={ref}
        disabled={disabled}
        onPressIn={animateIn}
        onPressOut={animateOut}
        onPress={handlePress}
        className={stripAnimationClasses(className)}
        style={[style, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}
        {...rest}
      >
        {children}
      </AnimatedPressable>
    );
  }
);

PressableComponent.displayName = "PressableComponent";

export { PressableComponent };
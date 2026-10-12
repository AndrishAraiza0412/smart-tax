import React from "react";
import { Animated, TextInput, View, Text } from "react-native";
import { useColorScheme } from "nativewind";
import { PressableComponent } from "./pressable";
import { Icon } from "./icon";
import { Label } from "./label";

export type InputSize = "sm" | "md" | "lg";

interface InputBaseProps extends Omit<React.ComponentProps<typeof TextInput>, "onChangeText" | "value" | "defaultValue" | "id" | "required"> {
  label?: string;
  error?: string | undefined;
  helperText?: string;
  leftIcon?: string;
  rightIcon?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  size?: InputSize;
  invalid?: boolean;
  /** Muestra un check verde a la derecha (campo validado). */
  valid?: boolean;
  className?: string;
  containerClassName?: string;
  labelClassName?: string;
  onChangeText?: (text: string) => void;
  value?: string;
  defaultValue?: string;
  id?: string;
  required?: boolean;
}

/** Colores del campo [reposo, foco] por esquema; el borde se anima entre ambos. */
const fieldColors = {
  light: { border: ["#E2E8F0", "#2547E8"], bg: ["#F8FAFC", "#FFFFFF"] },
  dark: { border: ["#2A3756", "#3B82F6"], bg: ["#111827", "#151E33"] },
} as const;

const sizeStyles: Record<InputSize, { container: string; input: string; icon: number }> = {
  sm: { container: "gap-1", input: "h-10 px-3.5 text-body-sm", icon: 16 },
  md: { container: "gap-1.5", input: "h-12 px-4 text-body-md", icon: 18 },
  lg: { container: "gap-2", input: "h-14 px-5 text-body-lg", icon: 20 },
};

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  leftElement,
  rightElement,
  size = "md",
  invalid = false,
  valid = false,
  className = "",
  containerClassName = "",
  labelClassName = "",
  onChangeText,
  value,
  defaultValue,
  editable,
  onFocus,
  onBlur,
  ...props
}: InputBaseProps): React.JSX.Element {
  const hasError = !!error;
  const isInvalid = invalid || hasError;
  const sizes = sizeStyles[size];

  const handleChangeText = (text: string) => {
    onChangeText?.(text);
  };

  const inputRef = React.useRef<TextInput>(null);
  const { colorScheme } = useColorScheme();
  const palette = fieldColors[colorScheme === "dark" ? "dark" : "light"];
  const focusAnim = React.useRef(new Animated.Value(0)).current;
  const animateFocus = (to: 0 | 1) =>
    Animated.timing(focusAnim, { toValue: to, duration: 160, useNativeDriver: false }).start();

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <View className={`w-full ${sizes.container} ${containerClassName}`}>
      {label && (
        <PressableComponent
          variant="none"
          haptic="none"
          onPress={focusInput}
          className="w-full"
        >
          <Label htmlFor={props.id ?? ""} required={props.required} className={labelClassName}>
            {label}
          </Label>
        </PressableComponent>
      )}
      <Animated.View
        className={`flex-row items-center rounded-xl ${editable === false ? "opacity-50" : ""}`}
        style={{
          borderWidth: 1,
          borderColor: isInvalid ? "#F43F5E" : focusAnim.interpolate({ inputRange: [0, 1], outputRange: [...palette.border] }),
          backgroundColor: focusAnim.interpolate({ inputRange: [0, 1], outputRange: [...palette.bg] }),
        }}
      >
        {(leftIcon || leftElement) && (
          <View className="flex items-center justify-center px-3">
            {leftElement ? (
              leftElement
            ) : (
              <Icon name={leftIcon!} size={sizes.icon} color="muted" />
            )}
          </View>
        )}
        <TextInput
          ref={inputRef}
          className={`
            flex-1 font-sans text-ink dark:text-white
            placeholder:text-faint
            ${sizes.input}
            ${(leftIcon || leftElement) && "pl-0"}
            ${(rightIcon || rightElement || (valid && !isInvalid)) && "pr-0"}
            ${className}
          `}
          editable={editable}
          value={value}
          defaultValue={defaultValue}
          onChangeText={handleChangeText}
          onFocus={(e) => { animateFocus(1); onFocus?.(e); }}
          onBlur={(e) => { animateFocus(0); onBlur?.(e); }}
          aria-invalid={isInvalid}
          aria-describedby={hasError ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
          {...props}
        />
        {valid && !isInvalid && (
          <View className={`items-center justify-center ${rightIcon || rightElement ? "pl-3" : "px-3"}`}>
            <Icon name="check-circle" size={sizes.icon} color="secondary" />
          </View>
        )}
        {(rightIcon || rightElement) && (
          <View className="flex items-center justify-center px-3">
            {rightElement ? (
              rightElement
            ) : (
              <Icon name={rightIcon!} size={sizes.icon} color="muted" />
            )}
          </View>
        )}
      </Animated.View>
      {(hasError || helperText) && (
        <Text
          id={hasError ? `${props.id}-error` : `${props.id}-helper`}
          className={`
            font-sans text-caption
            ${hasError ? "text-error" : "text-muted"}
          `}
        >
          {hasError ? error : helperText}
        </Text>
      )}
    </View>
  );
}
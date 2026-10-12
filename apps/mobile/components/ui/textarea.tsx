import React from "react";
import { TextInput, View, Text } from "react-native";
import { PressableComponent } from "./pressable";
import { Label } from "./label";

export type TextareaSize = "sm" | "md" | "lg";

interface TextareaBaseProps extends Omit<React.ComponentProps<typeof TextInput>, "onChangeText" | "value" | "defaultValue" | "multiline" | "id" | "required"> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: TextareaSize;
  rows?: number;
  maxLength?: number;
  autoResize?: boolean;
  invalid?: boolean;
  className?: string;
  containerClassName?: string;
  labelClassName?: string;
  onChangeText?: (text: string) => void;
  value?: string;
  defaultValue?: string;
  id?: string;
  required?: boolean;
}

const sizeStyles: Record<TextareaSize, { container: string; textarea: string }> = {
  sm: { container: "gap-1", textarea: "min-h-20 px-3 py-2 text-body-sm" },
  md: { container: "gap-1.5", textarea: "min-h-24 px-4 py-3 text-body-md" },
  lg: { container: "gap-2", textarea: "min-h-32 px-5 py-4 text-body-lg" },
};

export function Textarea({
  label,
  error,
  helperText,
  size = "md",
  rows = 4,
  maxLength,
  autoResize = false,
  invalid = false,
  className = "",
  containerClassName = "",
  labelClassName = "",
  onChangeText,
  value,
  defaultValue,
  editable,
  ...props
}: TextareaBaseProps): React.JSX.Element {
  const hasError = !!error;
  const isInvalid = invalid || hasError;
  const sizes = sizeStyles[size];

  const [height, setHeight] = React.useState(0);
  const [text, setText] = React.useState(value || defaultValue || "");

  React.useEffect(() => {
    if (value !== undefined) {
      setText(value);
    }
  }, [value]);

  const handleChangeText = (newText: string) => {
    if (maxLength && newText.length > maxLength) return;
    setText(newText);
    onChangeText?.(newText);
  };

  const handleContentSizeChange = (event: { nativeEvent: { contentSize: { height: number } } }) => {
    if (autoResize) {
      setHeight(event.nativeEvent.contentSize.height);
    }
  };

  const inputRef = React.useRef<TextInput>(null);

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
      <View
        className={`
          rounded-xl border bg-canvas dark:bg-[#111827]
          transition-colors duration-fast ease-out
          ${isInvalid ? "border-error focus:border-error" : "border-border dark:border-stroke"}
          ${editable === false ? "opacity-50 bg-muted/20" : ""}
        `}
      >
        <TextInput
          ref={inputRef}
          multiline
          textAlignVertical="top"
          numberOfLines={rows}
          className={`
            flex-1 font-sans text-ink dark:text-white
            placeholder:text-faint
            ${sizes.textarea}
          `}
          editable={editable}
          value={text}
          onChangeText={handleChangeText}
          onContentSizeChange={handleContentSizeChange}
          style={{ height: autoResize && height > 0 ? height : undefined }}
          aria-invalid={isInvalid}
          aria-describedby={hasError ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
          maxLength={maxLength}
          {...props}
        />
      </View>
      {(hasError || helperText) && (
        <View className="flex-row items-center justify-between">
          <Text
            id={hasError ? `${props.id}-error` : `${props.id}-helper`}
            className={`
              font-sans text-caption
              ${hasError ? "text-error" : "text-muted"}
            `}
          >
            {hasError ? error : helperText}
          </Text>
          {maxLength && (
            <Text className="font-sans text-caption text-faint">
              {text.length}/{maxLength}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
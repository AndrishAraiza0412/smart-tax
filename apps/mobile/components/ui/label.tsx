import { Text } from "react-native";
import { PressableComponent } from "./pressable";

export interface LabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean | undefined;
  className?: string;
  style?: React.ComponentProps<typeof Text>["style"];
}

export function Label({
  children,
  htmlFor,
  required,
  className = "",
  style,
  ...props
}: LabelProps): React.JSX.Element {
  return (
    <PressableComponent
      variant="none"
      haptic="none"
      className={`mb-1.5 ${className}`}
      style={style}
      onPress={() => htmlFor && undefined}
      {...props}
    >
      <Text className="font-sans text-sm font-medium text-ink dark:text-slate-200">
        {children}
        {required && <Text className="text-error ml-0.5" importantForAccessibility="no-hide-descendants">*</Text>}
      </Text>
    </PressableComponent>
  );
}
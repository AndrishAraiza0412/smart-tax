import { Pressable, Text } from "react-native";

/** Botón primario SmartTax (fondo `primary`, texto blanco). Acepta `className` extra de NativeWind. */

type ButtonProps = Readonly<Omit<React.ComponentProps<typeof Pressable>, "className"> & { children: React.ReactNode; className?: string }>;

export function Button({ children, className = "", ...rest }: ButtonProps): React.JSX.Element {
  return <Pressable className={`min-h-11 items-center justify-center rounded-md bg-primary px-4 ${className}`} {...rest}><Text className="font-sans font-semibold text-white">{children}</Text></Pressable>;
}

import { Text } from "react-native";

export function Badge({ children }: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return <Text className="self-start rounded-md bg-secondary px-2 py-1 font-sans text-xs font-semibold text-white">{children}</Text>;
}

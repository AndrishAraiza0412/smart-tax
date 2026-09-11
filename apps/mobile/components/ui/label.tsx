import { Text } from "react-native";

/** Etiqueta pequeña semibold para campos de formulario. */

export function Label(props: React.ComponentProps<typeof Text>): React.JSX.Element {
  return <Text className="font-sans text-sm font-medium text-slate-700 dark:text-slate-300" {...props} />;
}

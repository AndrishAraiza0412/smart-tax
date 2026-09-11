import { TextInput } from "react-native";

/** Campo de texto base con altura mínima táctil y placeholder gris. */

export function Input(props: React.ComponentProps<typeof TextInput>): React.JSX.Element {
  return <TextInput className="min-h-11 rounded-md border border-slate-300 bg-white px-3 font-sans text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white" placeholderTextColor="#64748B" {...props} />;
}

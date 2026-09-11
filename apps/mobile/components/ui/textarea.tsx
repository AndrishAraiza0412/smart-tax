import { TextInput } from "react-native";

export function Textarea(props: React.ComponentProps<typeof TextInput>): React.JSX.Element {
  return <TextInput multiline textAlignVertical="top" className="min-h-24 rounded-md border border-slate-300 p-3 font-sans text-slate-900" {...props} />;
}

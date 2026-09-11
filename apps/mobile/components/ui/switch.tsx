import { Switch as NativeSwitch } from "react-native";

export function Switch(props: React.ComponentProps<typeof NativeSwitch>): React.JSX.Element {
  return <NativeSwitch trackColor={{ false: "#CBD5E1", true: "#10B981" }} {...props} />;
}

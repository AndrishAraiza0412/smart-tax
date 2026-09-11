import { Redirect } from "expo-router";

export default function AppEntry(): React.JSX.Element {
  return <Redirect href="/(app)/dashboard" />;
}

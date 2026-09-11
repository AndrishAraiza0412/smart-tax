import { Redirect } from "expo-router";

export default function AuthEntry(): React.JSX.Element {
  return <Redirect href="/(auth)/login" />;
}

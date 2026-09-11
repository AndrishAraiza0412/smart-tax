import { Image, View } from "react-native";

export function Avatar({ uri }: Readonly<{ uri?: string }>): React.JSX.Element {
  return uri ? <Image className="h-10 w-10 rounded-full" source={{ uri }} /> : <View className="h-10 w-10 rounded-full bg-slate-200" />;
}

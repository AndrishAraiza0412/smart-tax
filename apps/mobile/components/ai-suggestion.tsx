import { Text, View } from "react-native";

import { FadeIn } from "./ui/fade-in";
import { Icon } from "./ui/icon";

interface AiSuggestionProps {
  prefix?: string;
  verdict: string;
  reason: string;
  /** Texto de "analizando…" mientras la IA vuelve a revisar. */
  pending?: string | false;
}

/** Sugerencia de facturable de la IA (gasto manual y escaneo). */
export function AiSuggestion({ prefix, verdict, reason, pending }: AiSuggestionProps): React.JSX.Element {
  return (
    <FadeIn>
      <View className="mt-3 flex-row items-start rounded-xl border border-skyBorder bg-skyTint p-3 dark:border-[rgba(14,165,233,0.3)] dark:bg-[rgba(14,165,233,0.12)]">
        <View className="h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-white/10">
          <Icon name="cpu" size={15} color="#0284C7" />
        </View>
        <View className="ml-2.5 flex-1">
          <Text className="font-sans text-[13px] leading-5 text-skyText dark:text-[#7DD3FC]">
            {prefix ? `${prefix} ` : ""}
            <Text className="font-semibold">{verdict}</Text>
            {reason ? ` — ${reason}` : ""}
          </Text>
          {pending ? <Text className="mt-1 font-sans text-xs text-skyText dark:text-[#7DD3FC]">{pending}</Text> : null}
        </View>
      </View>
    </FadeIn>
  );
}

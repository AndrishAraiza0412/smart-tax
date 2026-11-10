import { Alert, Platform } from "react-native";

/** RN-web deja Alert.alert sin efecto: sin esto los errores y confirmaciones no se ven en web. */
if (Platform.OS === "web") {
  Alert.alert = (title, message, buttons) => {
    const text = [title, message].filter(Boolean).join("\n\n");
    const actions = (buttons ?? []).filter((b) => b.style !== "cancel");
    const cancel = (buttons ?? []).find((b) => b.style === "cancel");
    if (actions.length <= 1 && !cancel) {
      window.alert(text);
      actions[0]?.onPress?.();
    } else if (actions.length <= 1) {
      if (window.confirm(text)) actions[0]?.onPress?.();
      else cancel?.onPress?.();
    } else {
      const n = window.prompt(`${text}\n\n${actions.map((b, i) => `${i + 1}. ${b.text}`).join("\n")}`);
      actions[Number(n) - 1]?.onPress?.();
    }
  };
}

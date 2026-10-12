let Haptics: any = null;
let isNativeAvailable = false;

// Try to load native module, fallback gracefully for Expo Go
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Haptics = require("react-native-haptic-feedback");
  isNativeAvailable = true;
} catch {
  // Native module not available (Expo Go, web, etc.)
  isNativeAvailable = false;
  Haptics = {
    trigger: () => Promise.resolve(),
  };
}

export const hapticFeedback = (
  type: "light" | "medium" | "heavy" | "selection" = "light"
): void => {
  if (!isNativeAvailable) return;

  const options = {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: false,
  };
  const map = {
    light: "impactLight",
    medium: "impactMedium",
    heavy: "impactHeavy",
    selection: "selection",
  } as const;

  Haptics.trigger(map[type], options).catch(() => {
    // Silently ignore haptic errors
  });
};

export const isHapticsAvailable = (): boolean => isNativeAvailable;
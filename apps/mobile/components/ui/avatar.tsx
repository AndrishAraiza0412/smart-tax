import { Image, View, Text, type ViewStyle, type ImageStyle } from "react-native";
import { Icon } from "./icon";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarShape = "circle" | "rounded" | "square";
export type AvatarStatus = "online" | "offline" | "busy" | "away";
export type AvatarStatusPosition = "bottom-right" | "top-right";

interface AvatarBaseProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  status?: AvatarStatus;
  statusPosition?: AvatarStatusPosition;
  className?: string;
  style?: ViewStyle;
}

const sizeStyles: Record<AvatarSize, { width: number; height: number; fontSize: number; statusSize: number; statusOffset: number }> = {
  xs: { width: 24, height: 24, fontSize: 10, statusSize: 8, statusOffset: -2 },
  sm: { width: 32, height: 32, fontSize: 12, statusSize: 10, statusOffset: -2 },
  md: { width: 40, height: 40, fontSize: 14, statusSize: 12, statusOffset: -3 },
  lg: { width: 56, height: 56, fontSize: 18, statusSize: 16, statusOffset: -4 },
  xl: { width: 72, height: 72, fontSize: 24, statusSize: 20, statusOffset: -5 },
};

const shapeStyles: Record<AvatarShape, string> = {
  circle: "rounded-full",
  rounded: "rounded-lg",
  square: "rounded-none",
};

const statusColors: Record<AvatarStatus, string> = {
  online: "bg-secondary",
  offline: "bg-muted",
  busy: "bg-error",
  away: "bg-tertiary",
};

const statusPositionStyles: Record<AvatarStatusPosition, { bottom?: number; right?: number; top?: number }> = {
  "bottom-right": { bottom: 0, right: 0 },
  "top-right": { top: 0, right: 0 },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getFallbackColor(name: string): string {
  const colors = [
    "bg-primary",
    "bg-secondary",
    "bg-tertiary",
    "bg-error",
    "bg-emeraldText",
    "bg-skyText",
    "bg-roseText",
    "bg-muted",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length] ?? "bg-primary";
}

export function Avatar({
  src,
  alt,
  fallback,
  size = "md",
  shape = "circle",
  status,
  statusPosition = "bottom-right",
  className = "",
  style,
}: AvatarBaseProps): React.JSX.Element {
  const sizes = sizeStyles[size];
  const shapeClass = shapeStyles[shape];
  const statusPos = statusPositionStyles[statusPosition];

  const containerStyle: ViewStyle = {
    width: sizes.width,
    height: sizes.height,
    ...style,
  };

  const statusStyle: ViewStyle = {
    width: sizes.statusSize,
    height: sizes.statusSize,
    position: "absolute",
    borderWidth: 2,
    borderColor: "white",
    ...statusPos,
  };

  const renderFallback = () => {
    const initials = fallback || (alt ? getInitials(alt) : "?");
    const bgColor = getFallbackColor(alt || fallback || "default");
    return (
      <View
        className={`flex items-center justify-center ${bgColor} ${shapeClass}`}
        style={containerStyle}
      >
        <Text className={`font-sans font-semibold text-white`} style={{ fontSize: sizes.fontSize }}>
          {initials}
        </Text>
      </View>
    );
  };

  return (
    <View className={`relative ${className}`} style={{ width: sizes.width, height: sizes.height }}>
      {src ? (
        <Image
          source={{ uri: src }}
          className={shapeClass}
          style={containerStyle as ImageStyle}
          resizeMode="cover"
          accessibilityLabel={alt ?? ""}
        />
      ) : (
        renderFallback()
      )}
      {status && (
        <View
          className={`${statusColors[status]} rounded-full`}
          style={statusStyle}
          accessibilityLabel={`Status: ${status}`}
        />
      )}
    </View>
  );
}

export interface AvatarGroupProps {
  avatars: Array<{ src?: string; alt?: string; fallback?: string }>;
  max?: number;
  size?: AvatarSize;
  shape?: AvatarShape;
  className?: string;
}

export function AvatarGroup({ avatars, max = 5, size = "md", shape = "circle", className = "" }: AvatarGroupProps): React.JSX.Element {
  const sizes = sizeStyles[size];
  const shapeClass = shapeStyles[shape];
  const overlap = -sizes.width * 0.25;

  const visibleAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <View className={`flex-row ${className}`}>
      {visibleAvatars.map((avatar, index) => (
        <View key={index} style={{ marginLeft: index === 0 ? 0 : overlap, zIndex: max - index }}>
          <Avatar {...avatar} size={size} shape={shape} />
        </View>
      ))}
      {remaining > 0 && (
        <View
          className={`flex items-center justify-center ${shapeClass} bg-muted/20 border-2 border-surface dark:border-surface`}
          style={{ width: sizes.width, height: sizes.height, marginLeft: overlap, zIndex: 0 }}
        >
          <Text className="font-sans font-semibold text-muted dark:text-faint" style={{ fontSize: sizes.fontSize }}>
            +{remaining}
          </Text>
        </View>
      )}
    </View>
  );
}
import {
  Home,
  Settings,
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Plus,
  PlusCircle,
  Minus,
  Search,
  Filter,
  Calendar,
  Clock,
  DollarSign,
  CreditCard,
  Receipt,
  Camera,
  Image,
  FileText,
  Download,
  Upload,
  Share,
  Copy,
  Edit,
  Trash,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  LogIn,
  LogOut,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Check,
  XCircle,
  Info,
  HelpCircle,
  Bell,
  BellOff,
  Mail,
  Phone,
  MapPin,
  Globe,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Signal,
  SignalLow,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  FastForward,
  Rewind,
  Shuffle,
  Repeat,
  Heart,
  Star,
  Bookmark,
  Flag,
  Tag,
  Archive,
  Inbox,
  Send,
  Reply,
  Forward,
  Link,
  Unlink,
  ExternalLink,
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  GitCompare,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderMinus,
  File,
  FilePlus,
  FileMinus,
  FileSearch,
  FileCheck,
  FileX,
  FileEdit,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileJson,
  FileLock,
  FileKey,
  FileQuestion,
  FileWarning,
  FileHeart,
  FileUser,
  FileCog,
  FileSliders,
  FileBarChart,
  FilePieChart,
  FileLineChart,
  ShoppingCart,
  Briefcase,
  Zap,
  Moon,
  Sun,
  Smartphone,
  AtSign,
  MessageSquare,
  Shield,
  Scan,
  Apple,
  ArrowLeft,
  Car,
  Briefcase as BriefcaseIcon,
  FileText as FileTextIcon,
  FileCheck as FileCheckIcon,
  FileX as FileXIcon,
  FileEdit as FileEditIcon,
  FileImage as FileImageIcon,
  FileVideo as FileVideoIcon,
  FileAudio as FileAudioIcon,
  FileCode as FileCodeIcon2,
  FileJson as FileJsonIcon,
  FileLock as FileLockIcon,
  FileKey as FileKeyIcon,
  FileQuestion as FileQuestionIcon,
  FileWarning as FileWarningIcon,
  FileHeart as FileHeartIcon,
  FileUser as FileUserIcon,
  FileCog as FileCogIcon,
  FileSliders as FileSlidersIcon,
  FileBarChart as FileBarChartIcon,
  FilePieChart as FilePieChartIcon,
  FileLineChart as FileLineChartIcon,
} from "lucide-react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { Svg, Path } from "react-native-svg";

type IconComponent = React.ComponentType<{
  size?: number;
  color?: string;
  className?: string;
  style?: object;
}>;

const iconRegistry: Record<string, IconComponent> = {
  home: Home,
  settings: Settings,
  user: User,
  menu: Menu,
  x: X,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "chevron-up": ChevronUp,
  "chevron-down": ChevronDown,
  plus: Plus,
  "plus-circle": PlusCircle,
  minus: Minus,
  search: Search,
  filter: Filter,
  calendar: Calendar,
  clock: Clock,
  "dollar-sign": DollarSign,
  "credit-card": CreditCard,
  receipt: Receipt,
  camera: Camera,
  image: Image,
  "file-text": FileTextIcon,
  download: Download,
  upload: Upload,
  share: Share,
  copy: Copy,
  edit: Edit,
  trash: Trash,
  eye: Eye,
  "eye-off": EyeOff,
  lock: Lock,
  unlock: Unlock,
  "log-in": LogIn,
  "log-out": LogOut,
  "refresh-cw": RefreshCw,
  "alert-circle": AlertCircle,
  "check-circle": CheckCircle,
  check: Check,
  "x-circle": XCircle,
  info: Info,
  "help-circle": HelpCircle,
  bell: Bell,
  "bell-off": BellOff,
  mail: Mail,
  phone: Phone,
  "map-pin": MapPin,
  globe: Globe,
  wifi: Wifi,
  "wifi-off": WifiOff,
  battery: Battery,
  "battery-low": BatteryLow,
  signal: Signal,
  "signal-low": SignalLow,
  "volume-2": Volume2,
  "volume-x": VolumeX,
  mic: Mic,
  "mic-off": MicOff,
  play: Play,
  pause: Pause,
  "skip-back": SkipBack,
  "skip-forward": SkipForward,
  "fast-forward": FastForward,
  rewind: Rewind,
  shuffle: Shuffle,
  repeat: Repeat,
  heart: Heart,
  star: Star,
  bookmark: Bookmark,
  flag: Flag,
  tag: Tag,
  archive: Archive,
  inbox: Inbox,
  send: Send,
  reply: Reply,
  forward: Forward,
  link: Link,
  unlink: Unlink,
  "external-link": ExternalLink,
  "git-branch": GitBranch,
  "git-commit": GitCommit,
  "git-merge": GitMerge,
  "git-pull-request": GitPullRequest,
  "git-compare": GitCompare,
  folder: Folder,
  "folder-open": FolderOpen,
  "folder-plus": FolderPlus,
  "folder-minus": FolderMinus,
  file: File,
  "file-plus": FilePlus,
  "file-minus": FileMinus,
  "file-search": FileSearch,
  "file-check": FileCheckIcon,
  "file-x": FileXIcon,
  "file-edit": FileEditIcon,
  "file-image": FileImageIcon,
  "file-video": FileVideoIcon,
  "file-audio": FileAudioIcon,
  "file-code": FileCodeIcon2,
  "file-json": FileJsonIcon,
  "file-lock": FileLockIcon,
  "file-key": FileKeyIcon,
  "file-question": FileQuestionIcon,
  "file-warning": FileWarningIcon,
  "file-heart": FileHeartIcon,
  "file-user": FileUserIcon,
  "file-cog": FileCogIcon,
  "file-sliders": FileSlidersIcon,
  "file-bar-chart": FileBarChartIcon,
  "file-pie-chart": FilePieChartIcon,
  "file-line-chart": FileLineChartIcon,
  "shopping-cart": ShoppingCart,
  briefcase: BriefcaseIcon,
  zap: Zap,
  moon: Moon,
  sun: Sun,
  smartphone: Smartphone,
  "at-sign": AtSign,
  "message-square": MessageSquare,
  shield: Shield,
  scan: Scan,
  apple: Apple,
  "arrow-left": ArrowLeft,
  car: Car,
  google: () => (
    <Svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  ),
} as const;

/**
 * Todos los iconos de la app salen de Feather (@expo/vector-icons): trazo
 * uniforme de 2px y estilo minimalista. Este mapa traduce los nombres que ya
 * usan las pantallas a su equivalente en Feather; un nombre que ya existe en
 * Feather (mail, lock, user…) se usa tal cual. Apple/Google son logos de marca
 * y se quedan fuera de Feather.
 */
const featherAlias: Record<string, string> = {
  receipt: "file-text",
  car: "truck",
  scan: "maximize",
  "fast-food": "coffee",
  flash: "zap",
  medkit: "activity",
  apps: "grid",
  trash: "trash-2",
  wallet: "credit-card",
  "file-check": "file-text",
};

const brandIcons: Record<string, { family: "ion"; glyph: string }> = {
  apple: { family: "ion", glyph: "logo-apple" },
};

export type IconName = string;

interface IconProps {
  name: IconName;
  size?: number;
  color?: "primary" | "secondary" | "muted" | "faint" | "inverse" | string;
  className?: string;
  style?: React.CSSProperties;
}

/** Named colors resolved to real hex per color scheme (glyphs need `color`, not classes). */
const namedHex: Record<string, readonly [light: string, dark: string]> = {
  primary: ["#2547E8", "#3B82F6"],
  secondary: ["#10B981", "#34D399"],
  muted: ["#64748B", "#94A3B8"],
  faint: ["#94A3B8", "#94A3B8"],
  inverse: ["#0F172A", "#FFFFFF"],
};

type AnyVectorIcon = React.ComponentType<{
  name: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}>;

export function Icon({
  name,
  size = 24,
  color = "primary",
  className = "",
  style,
  ...props
}: IconProps): React.JSX.Element | null {
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === "dark";
  const hex = color.startsWith("#") ? color : (namedHex[color]?.[dark ? 1 : 0] ?? color);

  const feather = featherAlias[name] ?? name;
  if (feather in Feather.glyphMap) {
    const FeatherIcon = Feather as unknown as AnyVectorIcon;
    return <FeatherIcon name={feather} size={size} color={hex} {...(style === undefined ? {} : { style })} />;
  }

  const brand = brandIcons[name];
  if (brand) {
    const BrandIcon = Ionicons as unknown as AnyVectorIcon;
    return <BrandIcon name={brand.glyph} size={size} color={hex} {...(style === undefined ? {} : { style })} />;
  }

  const IconComponent = iconRegistry[name as keyof typeof iconRegistry];
  if (!IconComponent) {
    if (__DEV__) {
      console.warn(`Icon "${name}" not found in registry`);
    }
    return null;
  }

  const iconProps = {
    size,
    color: hex,
    className,
    ...props,
  } as Record<string, unknown>;
  if (style !== undefined) {
    iconProps["style"] = style;
  }

  return <IconComponent {...iconProps} />;
}
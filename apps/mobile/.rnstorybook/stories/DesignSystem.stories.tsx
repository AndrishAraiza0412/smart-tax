import type { Meta, StoryObj } from '@storybook/react-native';

import { View, Text } from 'react-native';
import { fn } from 'storybook/test';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { SkeletonList } from '@/components/ui/skeleton-list';
import { SkeletonDashboard } from '@/components/ui/skeleton-dashboard';

const decorators = [
  (Story: React.FC) => (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#F8FAFC' }}>
      <Story />
    </View>
  ),
];

// ============================================
// BUTTON STORIES
// ============================================
const buttonMeta: Meta<typeof Button> = {
  title: 'Design System/Button',
  component: Button,
  decorators,
  tags: ['autodocs'],
  args: { onPress: fn() },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'outline', 'ghost', 'destructive'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    fullWidth: { control: 'boolean' },
    isLoading: { control: 'boolean' },
  },
};
export default buttonMeta;

type ButtonStory = StoryObj<typeof Button>;

export const Primary: ButtonStory = { args: { variant: 'primary', children: 'Primary Button' } };
export const Secondary: ButtonStory = { args: { variant: 'secondary', children: 'Secondary Button' } };
export const Outline: ButtonStory = { args: { variant: 'outline', children: 'Outline Button' } };
export const Ghost: ButtonStory = { args: { variant: 'ghost', children: 'Ghost Button' } };
export const Destructive: ButtonStory = { args: { variant: 'destructive', children: 'Destructive Button' } };
export const Small: ButtonStory = { args: { size: 'sm', children: 'Small Button' } };
export const Large: ButtonStory = { args: { size: 'lg', children: 'Large Button' } };
export const Loading: ButtonStory = { args: { isLoading: true, children: 'Loading...' } };
export const FullWidth: ButtonStory = { args: { fullWidth: true, children: 'Full Width Button' } };
export const WithLeftIcon: ButtonStory = { args: { leftIcon: 'plus', children: 'Add Item' } };
export const WithRightIcon: ButtonStory = { args: { rightIcon: 'chevron-right', children: 'Continue' } };

// ============================================
// CARD STORIES
// ============================================
const cardMeta: Meta<typeof Card> = {
  title: 'Design System/Card',
  component: Card,
  decorators,
  tags: ['autodocs'],
  argTypes: {
    elevation: { control: 'select', options: ['flat', 'elevated', 'outlined'] },
    padding: { control: 'select', options: ['none', 'sm', 'md', 'lg'] },
    interactive: { control: 'boolean' },
    hoverable: { control: 'boolean' },
  },
};

export const Flat: StoryObj<typeof Card> = {
  args: {
    elevation: 'flat',
    children: (
      <>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Flat Card</Text>
        <Text style={{ color: '#64748B' }}>Border only, no shadow</Text>
      </>
    ),
  },
};

export const Elevated: StoryObj<typeof Card> = {
  args: {
    elevation: 'elevated',
    children: (
      <>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Elevated Card</Text>
        <Text style={{ color: '#64748B' }}>With shadow, no border</Text>
      </>
    ),
  },
};

export const OutlinedCard: StoryObj<typeof Card> = {
  args: {
    elevation: 'outlined',
    children: (
      <>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Outlined Card</Text>
        <Text style={{ color: '#64748B' }}>Border + subtle shadow</Text>
      </>
    ),
  },
};

export const InteractiveCard: StoryObj<typeof Card> = {
  args: {
    elevation: 'elevated',
    interactive: true,
    onPress: fn(),
    children: (
      <>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Interactive Card</Text>
        <Text style={{ color: '#64748B' }}>Pressable with haptic feedback</Text>
      </>
    ),
  },
};

export const CardWithPadding: StoryObj<typeof Card> = {
  args: {
    elevation: 'flat',
    padding: 'lg',
    children: (
      <>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Large Padding</Text>
        <Text style={{ color: '#64748B' }}>p-6 (24px) padding</Text>
      </>
    ),
  },
};

// ============================================
// INPUT STORIES
// ============================================
const inputMeta: Meta<typeof Input> = {
  title: 'Design System/Input',
  component: Input,
  decorators,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    invalid: { control: 'boolean' },
  },
};

export const DefaultInput: StoryObj<typeof Input> = { args: { placeholder: 'Enter text...' } };
export const WithLabel: StoryObj<typeof Input> = { args: { label: 'Email', placeholder: 'you@example.com' } };
export const WithError: StoryObj<typeof Input> = { args: { label: 'Email', value: 'invalid', error: 'Invalid email format', invalid: true } };
export const WithHelper: StoryObj<typeof Input> = { args: { label: 'Password', helperText: 'Must be at least 8 characters', type: 'password' } };
export const WithLeftIcon: StoryObj<typeof Input> = { args: { label: 'Search', placeholder: 'Search...', leftIcon: 'search' } };
export const WithRightIcon: StoryObj<typeof Input> = { args: { label: 'Amount', placeholder: '0.00', rightIcon: 'dollar-sign' } };
export const SmallInput: StoryObj<typeof Input> = { args: { size: 'sm', placeholder: 'Small' } };
export const LargeInput: StoryObj<typeof Input> = { args: { size: 'lg', placeholder: 'Large' } };
export const DisabledInput: StoryObj<typeof Input> = { args: { value: 'Disabled', disabled: true } };

// ============================================
// BADGE STORIES
// ============================================
const badgeMeta: Meta<typeof Badge> = {
  title: 'Design System/Badge',
  component: Badge,
  decorators,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'success', 'warning', 'error', 'neutral'] },
    size: { control: 'select', options: ['sm', 'md'] },
    dot: { control: 'boolean' },
    dismissible: { control: 'boolean' },
  },
};

export const PrimaryBadge: StoryObj<typeof Badge> = { args: { variant: 'primary', children: 'Primary' } };
export const SuccessBadge: StoryObj<typeof Badge> = { args: { variant: 'success', children: 'Success' } };
export const WarningBadge: StoryObj<typeof Badge> = { args: { variant: 'warning', children: 'Warning' } };
export const ErrorBadge: StoryObj<typeof Badge> = { args: { variant: 'error', children: 'Error' } };
export const NeutralBadge: StoryObj<typeof Badge> = { args: { variant: 'neutral', children: 'Neutral' } };
export const SmallBadge: StoryObj<typeof Badge> = { args: { size: 'sm', children: 'Small' } };
export const WithDot: StoryObj<typeof Badge> = { args: { variant: 'success', dot: true, children: 'Active' } };
export const Dismissible: StoryObj<typeof Badge> = { args: { variant: 'neutral', dismissible: true, onDismiss: fn(), children: 'Dismissible' } };

// ============================================
// SWITCH STORIES
// ============================================
const switchMeta: Meta<typeof Switch> = {
  title: 'Design System/Switch',
  component: Switch,
  decorators,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md'] },
    color: { control: 'select', options: ['primary', 'secondary', 'success', 'warning', 'error'] },
  },
};

export const DefaultSwitch: StoryObj<typeof Switch> = { args: { label: 'Enable notifications', value: false, onValueChange: fn() } };
export const CheckedSwitch: StoryObj<typeof Switch> = { args: { label: 'Dark mode', value: true, onValueChange: fn() } };
export const WithDescription: StoryObj<typeof Switch> = { args: { label: 'Biometric login', description: 'Use Face ID to sign in', value: true, onValueChange: fn() } };
export const SmallSwitch: StoryObj<typeof Switch> = { args: { size: 'sm', label: 'Compact', value: false, onValueChange: fn() } };
export const SuccessSwitch: StoryObj<typeof Switch> = { args: { color: 'success', label: 'Auto-save', value: true, onValueChange: fn() } };
export const WarningSwitch: StoryObj<typeof Switch> = { args: { color: 'warning', label: 'Beta features', value: false, onValueChange: fn() } };
export const DisabledSwitch: StoryObj<typeof Switch> = { args: { disabled: true, label: 'Disabled', value: false, onValueChange: fn() } };

// ============================================
// AVATAR STORIES
// ============================================
const avatarMeta: Meta<typeof Avatar> = {
  title: 'Design System/Avatar',
  component: Avatar,
  decorators,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    shape: { control: 'select', options: ['circle', 'rounded', 'square'] },
    status: { control: 'select', options: ['online', 'offline', 'busy', 'away'] },
  },
};

export const DefaultAvatar: StoryObj<typeof Avatar> = { args: { alt: 'John Doe', fallback: 'JD' } };
export const WithImage: StoryObj<typeof Avatar> = { args: { src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John', alt: 'John Doe' } };
export const OnlineStatus: StoryObj<typeof Avatar> = { args: { alt: 'John Doe', fallback: 'JD', status: 'online' } };
export const BusyStatus: StoryObj<typeof Avatar> = { args: { alt: 'Jane Smith', fallback: 'JS', status: 'busy' } };
export const XsAvatar: StoryObj<typeof Avatar> = { args: { size: 'xs', alt: 'User', fallback: 'U' } };
export const XlAvatar: StoryObj<typeof Avatar> = { args: { size: 'xl', alt: 'User', fallback: 'U' } };
export const SquareAvatar: StoryObj<typeof Avatar> = { args: { shape: 'square', alt: 'User', fallback: 'U' } };

// ============================================
// ICON STORIES
// ============================================
const iconMeta: Meta<typeof Icon> = {
  title: 'Design System/Icon',
  component: Icon,
  decorators,
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'text' },
    size: { control: 'select', options: [16, 20, 24, 32, 48] },
    color: { control: 'select', options: ['primary', 'secondary', 'muted', 'inverse'] },
  },
};

export const HomeIcon: StoryObj<typeof Icon> = { args: { name: 'home', size: 24 } };
export const SettingsIcon: StoryObj<typeof Icon> = { args: { name: 'settings', size: 24, color: 'primary' } };
export const CameraIcon: StoryObj<typeof Icon> = { args: { name: 'camera', size: 24, color: 'secondary' } };
export const MutedIcon: StoryObj<typeof Icon> = { args: { name: 'bell-off', size: 24, color: 'muted' } };
export const LargeIcon: StoryObj<typeof Icon> = { args: { name: 'shield', size: 48, color: 'primary' } };

// ============================================
// SKELETON STORIES
// ============================================
const skeletonMeta: Meta<typeof Skeleton> = {
  title: 'Design System/Skeleton',
  component: Skeleton,
  decorators,
  tags: ['autodocs'],
};

export const DefaultSkeleton: StoryObj<typeof Skeleton> = { args: { style: { width: 200, height: 20, borderRadius: 8 } } };
export const SkeletonCircle: StoryObj<typeof Skeleton> = { args: { style: { width: 40, height: 40, borderRadius: 9999 } } };

const skeletonCardMeta: Meta<typeof SkeletonCard> = {
  title: 'Design System/SkeletonCard',
  component: SkeletonCard,
  decorators,
  tags: ['autodocs'],
};

export const DefaultSkeletonCard: StoryObj<typeof SkeletonCard> = { args: {} };
export const SkeletonCardWithoutAvatar: StoryObj<typeof SkeletonCard> = { args: { hasAvatar: false } };

const skeletonListMeta: Meta<typeof SkeletonList> = {
  title: 'Design System/SkeletonList',
  component: SkeletonList,
  decorators,
  tags: ['autodocs'],
};

export const DefaultSkeletonList: StoryObj<typeof SkeletonList> = { args: { count: 5 } };
export const SimpleSkeletonList: StoryObj<typeof SkeletonList> = { args: { variant: 'simple', count: 3 } };

const skeletonDashboardMeta: Meta<typeof SkeletonDashboard> = {
  title: 'Design System/SkeletonDashboard',
  component: SkeletonDashboard,
  decorators,
  tags: ['autodocs'],
};

export const DefaultSkeletonDashboard: StoryObj<typeof SkeletonDashboard> = { args: {} };
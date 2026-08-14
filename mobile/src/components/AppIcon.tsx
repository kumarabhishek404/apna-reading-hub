import { Text, type StyleProp, type TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useIoniconsReady } from '@/components/IoniconsReadyContext';
import { colors } from '@/theme/colors';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type AppIconProps = {
  name: IoniconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

/**
 * Readable fallbacks when the Ionicons font is not ready.
 * @expo/vector-icons renders an empty <Text /> until its font loads,
 * which is why tab/back icons were invisible.
 */
const FALLBACK_GLYPHS: Partial<Record<IoniconName, string>> = {
  'home-outline': '⌂',
  home: '⌂',
  'alarm-outline': '⏱',
  alarm: '⏱',
  'notifications-outline': '◔',
  notifications: '◕',
  'time-outline': '◌',
  time: '●',
  'book-outline': '▤',
  book: '▤',
  'settings-outline': '⚙',
  settings: '⚙',
  'chevron-back': '‹',
};

export function AppIcon({ name, size = 22, color = colors.primary, style }: AppIconProps) {
  const ioniconsReady = useIoniconsReady();

  if (ioniconsReady) {
    return <Ionicons name={name} size={size} color={color} style={style} />;
  }

  return (
    <Text
      style={[
        {
          fontSize: size,
          color,
          lineHeight: size,
          fontWeight: '700',
          textAlign: 'center',
          includeFontPadding: false,
        },
        style,
      ]}
    >
      {FALLBACK_GLYPHS[name] ?? '•'}
    </Text>
  );
}

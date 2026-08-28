import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { colors } from '@/theme/colors';
import { TAB_BAR_FLOAT_MARGIN, TAB_BAR_INNER_HEIGHT } from '@/theme/layout';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type TabMeta = {
  label: string;
  icon: IoniconName;
  activeIcon: IoniconName;
};

const TAB_META: Record<string, TabMeta> = {
  notes: { label: 'Notes', icon: 'document-text-outline', activeIcon: 'document-text' },
  alarms: { label: 'Alarms', icon: 'alarm-outline', activeIcon: 'alarm' },
  settings: { label: 'Settings', icon: 'settings-outline', activeIcon: 'settings' },
};

type TabBarProps = {
  state: {
    index: number;
    routes: Array<{ key: string; name: string; params?: object }>;
  };
  descriptors: Record<string, { options: Record<string, unknown> }>;
  navigation: {
    emit: (event: { type: string; target: string; canPreventDefault: boolean }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string, params?: object) => void;
  };
};

export function AppTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]} pointerEvents="box-none">
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const options = descriptors[route.key]?.options ?? {};
          if (options.href === null) return null;

          const meta = TAB_META[route.name];
          if (!meta) return null;

          const focused = state.index === index;
          const label = typeof options.title === 'string' ? options.title : meta.label;

          return (
            <Pressable
              key={route.key}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              }}
              style={[styles.item, focused && styles.itemActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
            >
              <View style={[styles.iconWell, focused && styles.iconWellActive]}>
                <AppIcon
                  name={focused ? meta.activeIcon : meta.icon}
                  size={20}
                  color={focused ? colors.primary : colors.textMuted}
                />
              </View>
              <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: TAB_BAR_FLOAT_MARGIN,
  },
  bar: {
    height: TAB_BAR_INNER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  item: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  itemActive: {
    backgroundColor: colors.primaryMuted,
  },
  iconWell: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWellActive: {
    transform: [{ scale: 1.02 }],
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.1,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});

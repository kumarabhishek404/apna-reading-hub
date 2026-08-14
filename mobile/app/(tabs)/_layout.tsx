import { Pressable, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { GlobalHeader } from '@/components/GlobalHeader';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { colors } from '@/theme/colors';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type TabTheme = {
  primary: string;
  muted: string;
  soft: string;
};

const TAB_THEMES = {
  home: {
    primary: colors.primary,
    muted: colors.primaryMuted,
    soft: colors.note.soft,
  },
  notes: {
    primary: colors.note.primary,
    muted: colors.note.muted,
    soft: colors.note.soft,
  },
  alarms: {
    primary: colors.alarm.primary,
    muted: colors.alarm.muted,
    soft: colors.alarm.soft,
  },
  content: {
    primary: colors.blog.primary,
    muted: colors.blog.muted,
    soft: colors.blog.soft,
  },
  settings: {
    primary: colors.primaryDark,
    muted: colors.primaryMuted,
    soft: colors.note.soft,
  },
} as const satisfies Record<string, TabTheme>;

function makeTabButton(theme: TabTheme) {
  return function ThemedTabButton(props: any) {
    const selected = !!props.accessibilityState?.selected;
    const { children, style, ...rest } = props;

    return (
      <Pressable {...rest} style={[styles.tabButton, style]}>
        <View
          style={[
            styles.tabButtonInner,
            selected && {
              backgroundColor: theme.muted,
              borderColor: theme.soft,
            },
          ]}
        >
          {children}
        </View>
      </Pressable>
    );
  };
}

function TabIcon({
  name,
  activeName,
  focused,
  color,
  size,
}: {
  name: IoniconName;
  activeName: IoniconName;
  focused: boolean;
  color: string;
  size: number;
}) {
  return (
    <View style={styles.iconWrap}>
      <AppIcon name={focused ? activeName : name} color={color} size={size} />
    </View>
  );
}

export default function TabsLayout() {
  const { isOpen, closeSidebar } = useSidebar();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 62 + Math.max(insets.bottom, 8);

  return (
    <>
      <GlobalHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: tabBarHeight,
            paddingTop: 6,
            paddingBottom: Math.max(insets.bottom, 8),
            paddingHorizontal: 6,
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.borderLight,
            borderLeftWidth: 0,
            borderRightWidth: 0,
            borderBottomWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginTop: 2,
          },
          tabBarIconStyle: {
            marginBottom: 0,
          },
          tabBarItemStyle: {
            paddingVertical: 0,
            margin: 0,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarActiveTintColor: TAB_THEMES.home.primary,
            tabBarButton: makeTabButton(TAB_THEMES.home),
            tabBarIcon: ({ color, focused, size }) => (
              <TabIcon
                name="home-outline"
                activeName="home"
                focused={focused}
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="notes"
          options={{
            title: 'Notes',
            tabBarActiveTintColor: TAB_THEMES.notes.primary,
            tabBarButton: makeTabButton(TAB_THEMES.notes),
            tabBarIcon: ({ color, focused, size }) => (
              <TabIcon
                name="document-text-outline"
                activeName="document-text"
                focused={focused}
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="alarms"
          options={{
            title: 'Alarm',
            tabBarActiveTintColor: TAB_THEMES.alarms.primary,
            tabBarButton: makeTabButton(TAB_THEMES.alarms),
            tabBarIcon: ({ color, focused, size }) => (
              <TabIcon
                name="alarm-outline"
                activeName="alarm"
                focused={focused}
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="content"
          options={{
            title: 'Library',
            tabBarActiveTintColor: TAB_THEMES.content.primary,
            tabBarButton: makeTabButton(TAB_THEMES.content),
            tabBarIcon: ({ color, focused, size }) => (
              <TabIcon
                name="book-outline"
                activeName="book"
                focused={focused}
                color={color}
                size={size}
              />
            ),
          }}
        />
      </Tabs>
      <Sidebar visible={isOpen} onClose={closeSidebar} />
    </>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonInner: {
    minWidth: 64,
    minHeight: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import { Pressable, View } from 'react-native';
import { Tabs } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { GlobalHeader } from '@/components/GlobalHeader';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { colors } from '@/theme/colors';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const tabIcon = (
  name: IoniconName,
  activeName: IoniconName,
  focused: boolean,
  color: string,
  size: number,
) => (
  <View style={{ width: size + 8, height: size + 8, justifyContent: 'center', alignItems: 'center' }}>
    <AppIcon name={focused ? activeName : name} color={color} size={size} />
  </View>
);

const tabButton = ({ children, style, ...props }: any) => {
  const selected = !!props.accessibilityState?.selected;

  return (
    <Pressable
      {...props}
      style={[
        {
          borderRadius: 18,
          backgroundColor: selected ? colors.primaryMuted : 'transparent',
          minWidth: 70,
          minHeight: 54,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 10,
          paddingVertical: 8,
          borderWidth: selected ? 1 : 0,
          borderColor: selected ? colors.primary : 'transparent',
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
};

export default function TabsLayout() {
  const { isOpen, closeSidebar } = useSidebar();

  return (
    <>
      <GlobalHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textLight,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 74,
            backgroundColor: '#f6f8fc',
            borderRadius: 0,
            borderTopWidth: 1,
            borderTopColor: '#e2e8f0',
            borderLeftWidth: 0,
            borderRightWidth: 0,
            borderBottomWidth: 0,
            paddingBottom: 8,
            paddingTop: 8,
            paddingHorizontal: 0,
            shadowColor: 'transparent',
            shadowOpacity: 0,
            shadowRadius: 0,
            shadowOffset: { width: 0, height: 0 },
            elevation: 0,
          },
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 2,
            color: colors.text,
          },
          tabBarIconStyle: {
            marginBottom: 0,
            width: 24,
            height: 24,
          },
          tabBarItemStyle: {
            borderRadius: 0,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 4,
            margin: 0,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarButton: tabButton,
            tabBarIcon: ({ color, focused, size }) =>
              tabIcon('home-outline', 'home', focused, color, size),
          }}
        />
        <Tabs.Screen
          name="notes"
          options={{
            title: 'Notes',
            tabBarButton: tabButton,
            tabBarIcon: ({ color, focused, size }) =>
              tabIcon('document-text-outline', 'document-text', focused, color, size),
          }}
        />
        <Tabs.Screen
          name="alarms"
          options={{
            title: 'Alarm',
            tabBarButton: tabButton,
            tabBarIcon: ({ color, focused, size }) =>
              tabIcon('alarm-outline', 'alarm', focused, color, size),
          }}
        />
        <Tabs.Screen
          name="content"
          options={{
            title: 'Library',
            tabBarButton: tabButton,
            tabBarIcon: ({ color, focused, size }) =>
              tabIcon('book-outline', 'book', focused, color, size),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarButton: tabButton,
            tabBarIcon: ({ color, focused, size }) =>
              tabIcon('settings-outline', 'settings', focused, color, size),
          }}
        />
      </Tabs>
      <Sidebar visible={isOpen} onClose={closeSidebar} />
    </>
  );
}

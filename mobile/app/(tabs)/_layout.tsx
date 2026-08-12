import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const tabIcon = (
  name: ComponentProps<typeof Ionicons>['name'],
  activeName: ComponentProps<typeof Ionicons>['name'],
  focused: boolean,
  color: string,
  size: number,
) => (
  <View style={{ width: size + 8, height: size + 8, justifyContent: 'center', alignItems: 'center' }}>
    <Ionicons name={focused ? activeName : name} color={color} size={size} />
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
          backgroundColor: selected ? '#e9f0ff' : 'transparent',
          minWidth: 70,
          minHeight: 54,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 10,
          paddingVertical: 8,
          borderWidth: selected ? 1 : 0,
          borderColor: selected ? '#dfe9ff' : 'transparent',
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#22409a',
        tabBarInactiveTintColor: '#64748b',
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
          color: '#1d2f5f',
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
          tabBarIcon: ({ color, focused, size }) => tabIcon('home-outline', 'home', focused, color, size),
        }}
      />
      <Tabs.Screen
        name="alarms"
        options={{
          title: 'Alarms',
          tabBarButton: tabButton,
          tabBarIcon: ({ color, focused, size }) => tabIcon('alarm-outline', 'alarm', focused, color, size),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Reminders',
          tabBarButton: tabButton,
          tabBarIcon: ({ color, focused, size }) => tabIcon('time-outline', 'time', focused, color, size),
        }}
      />
      <Tabs.Screen
        name="content"
        options={{
          title: 'Library',
          tabBarButton: tabButton,
          tabBarIcon: ({ color, focused, size }) => tabIcon('book-outline', 'book', focused, color, size),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarButton: tabButton,
          tabBarIcon: ({ color, focused, size }) => tabIcon('settings-outline', 'settings', focused, color, size),
        }}
      />
    </Tabs>
  );
}

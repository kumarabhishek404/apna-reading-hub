import { Tabs } from 'expo-router';
import { AppTabBar } from '@/components/AppTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...(props as Parameters<typeof AppTabBar>[0])} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
        }}
      />
      <Tabs.Screen
        name="alarms"
        options={{
          title: 'Alarms',
        }}
      />
      <Tabs.Screen
        name="content"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#7c3aed' }}>
      <Tabs.Screen
        name="home"
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="alarms"
        options={{ title: 'Alarms', tabBarIcon: ({ color, size }) => <Ionicons name="alarm-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="reminders"
        options={{ title: 'Reminders', tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="content"
        options={{ title: 'Library', tabBarIcon: ({ color, size }) => <Ionicons name="library-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} /> }}
      />
    </Tabs>
  );
}

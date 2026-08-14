import { View, StyleSheet, Text, Pressable, Modal, ScrollView, SafeAreaView } from 'react-native';
import { AppIcon } from './AppIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { clearSession, getStoredSession, type AuthSession } from '@/lib/auth';
import { colors } from '@/theme/colors';
import { useState, useEffect } from 'react';

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItem {
  icon: string;
  label: string;
  route?: string;
  action?: () => void;
}

export function Sidebar({ visible, onClose }: SidebarProps) {
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      const stored = await getStoredSession();
      setSession(stored);
    };
    loadSession();
  }, []);

  const user = session?.user;
  const initials = user?.fullName?.trim()?.charAt(0)?.toUpperCase() || 'A';

  const menuItems: MenuItem[] = [
    { icon: 'document-text-outline', label: 'Notes', route: '/(tabs)/notes' },
    { icon: 'newspaper-outline', label: 'Blogs', route: '/(tabs)/content' },
    { icon: 'document-outline', label: 'PDFs', route: '/(tabs)/content' },
    { icon: 'link-outline', label: 'Links', route: '/(tabs)/content' },
    { icon: 'alarm-outline', label: 'Alarm', route: '/(tabs)/alarms' },
    { icon: 'notifications-outline', label: 'Reminders', route: '/(tabs)/content' },
    { icon: 'pricetag-outline', label: 'Tags', route: '/tags' },
  ];

  const accountItems: MenuItem[] = [
    { icon: 'person-outline', label: 'Profile', route: '/(tabs)/settings' },
    { icon: 'settings-outline', label: 'Settings', route: '/(tabs)/settings' },
    { 
      icon: 'log-out-outline', 
      label: 'Logout', 
      action: async () => {
        await clearSession();
        router.replace('/login' as any);
      }
    },
  ];

  const handleMenuItemPress = (item: MenuItem) => {
    onClose();
    if (item.route) {
      router.push(item.route as any);
    } else if (item.action) {
      item.action();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sidebar, { paddingTop: insets.top }]} onPress={(e) => e.stopPropagation()}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <View style={styles.profile}>
                <Text style={styles.profileText}>{initials}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user?.fullName || 'Guest User'}</Text>
                <Text style={styles.userEmail}>{user?.title || 'User'}</Text>
              </View>
              <Pressable style={styles.closeButton} onPress={onClose}>
                <AppIcon name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>Content</Text>
              {menuItems.map((item, index) => (
                <Pressable
                  key={index}
                  style={styles.menuItem}
                  onPress={() => handleMenuItemPress(item)}
                >
                  <AppIcon name={item.icon as any} size={22} color={colors.text} />
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </Pressable>
              ))}

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Account</Text>
              {accountItems.map((item, index) => (
                <Pressable
                  key={index}
                  style={[styles.menuItem, item.label === 'Logout' && styles.logoutItem]}
                  onPress={() => handleMenuItemPress(item)}
                >
                  <AppIcon 
                    name={item.icon as any} 
                    size={22} 
                    color={item.label === 'Logout' ? colors.error : colors.text} 
                  />
                  <Text style={[styles.menuLabel, item.label === 'Logout' && styles.logoutText]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 2, height: 0 },
    elevation: 5,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  profile: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 16,
  },
  logoutItem: {
    backgroundColor: '#FEF2F2',
  },
  logoutText: {
    color: colors.error,
  },
});

import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppIcon } from './AppIcon';
import { clearSession, getStoredSession, type AuthSession } from '@/lib/auth';
import { colors } from '@/theme/colors';
import { getTypeTheme, type ItemType } from '@/theme/typeColors';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
}

type MenuItem = {
  icon: IoniconName;
  label: string;
  route?: string;
  tone?: ItemType | 'brand' | 'danger';
  action?: () => void | Promise<void>;
};

const CONTENT_ITEMS: MenuItem[] = [
  { icon: 'home-outline', label: 'Home', route: '/(tabs)/home', tone: 'brand' },
  { icon: 'document-text-outline', label: 'Notes', route: '/(tabs)/notes', tone: 'note' },
  { icon: 'newspaper-outline', label: 'Blogs', route: '/(tabs)/content', tone: 'blog' },
  { icon: 'document-outline', label: 'PDFs', route: '/(tabs)/content', tone: 'pdf' },
  { icon: 'link-outline', label: 'Links', route: '/(tabs)/content', tone: 'link' },
  { icon: 'alarm-outline', label: 'Alarms', route: '/(tabs)/alarms', tone: 'alarm' },
  { icon: 'notifications-outline', label: 'Reminders', route: '/(tabs)/content', tone: 'reminder' },
  { icon: 'book-outline', label: 'Library', route: '/(tabs)/content', tone: 'blog' },
  { icon: 'pricetag-outline', label: 'Tags', route: '/tags', tone: 'brand' },
];

function getToneColors(tone: MenuItem['tone'] = 'brand') {
  if (tone === 'danger') {
    return {
      primary: colors.error,
      muted: 'rgba(239, 68, 68, 0.1)',
      soft: 'rgba(239, 68, 68, 0.2)',
      dark: colors.error,
    };
  }
  if (tone === 'brand') {
    return {
      primary: colors.primary,
      muted: colors.primaryMuted,
      soft: colors.note.soft,
      dark: colors.primaryDark,
    };
  }
  const theme = getTypeTheme(tone);
  return {
    primary: theme.primary,
    muted: theme.muted,
    soft: theme.soft,
    dark: theme.dark,
  };
}

function MenuRow({
  item,
  index,
  visible,
  onPress,
}: {
  item: MenuItem;
  index: number;
  visible: boolean;
  onPress: () => void;
}) {
  const tone = getToneColors(item.tone);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-16)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 280,
          delay: 80 + index * 40,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 320,
          delay: 80 + index * 40,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacity.setValue(0);
      translateX.setValue(-16);
    }
  }, [visible, index, opacity, translateX]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }, { scale }] }}>
      <Pressable
        style={[
          styles.menuItem,
          {
            backgroundColor: tone.muted,
            borderColor: tone.soft,
          },
        ]}
        onPressIn={() => {
          Animated.spring(scale, {
            toValue: 0.97,
            useNativeDriver: true,
            speed: 40,
            bounciness: 4,
          }).start();
        }}
        onPressOut={() => {
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 40,
            bounciness: 6,
          }).start();
        }}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={item.label}
      >
        <View style={[styles.menuIcon, { backgroundColor: tone.primary }]}>
          <AppIcon name={item.icon} size={18} color="#fff" />
        </View>
        <Text style={[styles.menuLabel, { color: tone.dark }]} numberOfLines={1}>
          {item.label}
        </Text>
        <AppIcon name="chevron-forward" size={16} color={tone.primary} />
      </Pressable>
    </Animated.View>
  );
}

export function Sidebar({ visible, onClose }: SidebarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const sidebarWidth = Math.min(304, Math.max(260, width * 0.82));
  const [session, setSession] = useState<AuthSession | null>(null);
  const [mounted, setMounted] = useState(false);
  const slideAnim = useRef(new Animated.Value(-sidebarWidth)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadSession = async () => {
      const stored = await getStoredSession();
      setSession(stored);
    };
    loadSession();
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      slideAnim.setValue(-sidebarWidth);
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 180,
          mass: 0.9,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -sidebarWidth,
        duration: 220,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [visible, overlayAnim, slideAnim, sidebarWidth]);

  const user = session?.user;
  const initials = user?.fullName?.trim()?.charAt(0)?.toUpperCase() || 'A';

  const accountItems: MenuItem[] = [
    { icon: 'person-outline', label: 'Profile', route: '/(tabs)/settings', tone: 'brand' },
    { icon: 'settings-outline', label: 'Settings', route: '/(tabs)/settings', tone: 'brand' },
    {
      icon: 'log-out-outline',
      label: 'Logout',
      tone: 'danger',
      action: async () => {
        await clearSession();
        router.replace('/login' as any);
      },
    },
  ];

  const handleMenuItemPress = (item: MenuItem) => {
    onClose();
    setTimeout(() => {
      if (item.route) {
        router.push(item.route as any);
        return;
      }
      void item.action?.();
    }, 180);
  };

  return (
    <Modal
      visible={mounted}
      animationType="none"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sidebar,
            {
              width: sidebarWidth,
              transform: [{ translateX: slideAnim }],
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
              <View style={styles.profileBlock}>
                <View style={styles.profile}>
                  <Text style={styles.profileText}>{initials}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.brandMark}>apna notes</Text>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user?.fullName || 'Guest User'}
                  </Text>
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {user?.title || 'User'}
                  </Text>
                </View>
              </View>
              <Pressable
                style={styles.closeButton}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close menu"
              >
                <AppIcon name="close" size={20} color={colors.primary} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.menuContainer}
              contentContainerStyle={styles.menuContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionTitle}>Navigate</Text>
              {CONTENT_ITEMS.map((item, index) => (
                <MenuRow
                  key={item.label}
                  item={item}
                  index={index}
                  visible={visible}
                  onPress={() => handleMenuItemPress(item)}
                />
              ))}

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Account</Text>
              {accountItems.map((item, index) => (
                <MenuRow
                  key={item.label}
                  item={item}
                  index={CONTENT_ITEMS.length + index}
                  visible={visible}
                  onPress={() => handleMenuItemPress(item)}
                />
              ))}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.note.background,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: colors.shadowPrimary,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 6, height: 0 },
    elevation: 12,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.note.soft,
    backgroundColor: colors.surface,
  },
  profileBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
    paddingRight: 8,
  },
  profile: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  brandMark: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.note.soft,
  },
  menuContainer: {
    flex: 1,
  },
  menuContent: {
    padding: 16,
    paddingBottom: 28,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginTop: 8,
    marginBottom: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.note.soft,
    marginVertical: 10,
  },
});

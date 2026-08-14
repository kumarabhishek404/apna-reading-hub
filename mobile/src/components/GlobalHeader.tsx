import { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from './AppIcon';
import { useSidebar } from './SidebarContext';
import { getStoredSession } from '@/lib/auth';
import { colors } from '@/theme/colors';

interface GlobalHeaderProps {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  showProfile?: boolean;
  userInitials?: string;
}

export function GlobalHeader({
  title,
  showBack = false,
  onBackPress,
  showProfile = true,
  userInitials,
}: GlobalHeaderProps) {
  const insets = useSafeAreaInsets();
  const { openSidebar } = useSidebar();
  const [initials, setInitials] = useState(userInitials || 'A');

  useEffect(() => {
    if (userInitials) {
      setInitials(userInitials);
      return;
    }

    let active = true;
    const load = async () => {
      const session = await getStoredSession();
      const next = session?.user?.fullName?.trim()?.charAt(0)?.toUpperCase() || 'A';
      if (active) setInitials(next);
    };
    void load();
    return () => {
      active = false;
    };
  }, [userInitials]);

  const goToSettings = () => {
    router.push('/(tabs)/settings');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {showBack ? (
          <Pressable
            style={styles.iconButton}
            onPress={onBackPress}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <AppIcon name="chevron-back" size={22} color={colors.primary} />
          </Pressable>
        ) : (
          <Pressable
            style={styles.iconButton}
            onPress={openSidebar}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <AppIcon name="menu" size={22} color={colors.primary} />
          </Pressable>
        )}

        <Pressable
          style={styles.titleContainer}
          onPress={() => router.push('/(tabs)/home')}
          accessibilityRole="button"
          accessibilityLabel="Go home"
        >
          {title ? (
            <Text style={styles.title}>{title}</Text>
          ) : (
            <View>
              <Text style={styles.brandName}>apna notes</Text>
              <Text style={styles.brandHint}>your reading hub</Text>
            </View>
          )}
        </Pressable>

        {showProfile ? (
          <Pressable
            style={styles.profileButton}
            onPress={goToSettings}
            accessibilityRole="button"
            accessibilityLabel="Open profile settings"
          >
            <View style={styles.profileRing}>
              <View style={styles.profile}>
                <Text style={styles.profileText}>{initials}</Text>
              </View>
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.note.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.note.soft,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 56,
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.note.soft,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.2,
  },
  brandHint: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  profileButton: {
    marginLeft: 'auto',
  },
  profileRing: {
    width: 44,
    height: 44,
    borderRadius: 16,
    padding: 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.note.soft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profile: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});

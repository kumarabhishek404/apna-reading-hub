import { View, StyleSheet, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from './AppIcon';
import { useSidebar } from './SidebarContext';
import { colors } from '@/theme/colors';

interface GlobalHeaderProps {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  showProfile?: boolean;
}

export function GlobalHeader({
  title,
  showBack = false,
  onBackPress,
  showProfile = true,
}: GlobalHeaderProps) {
  const insets = useSafeAreaInsets();
  const { openSidebar } = useSidebar();

  const goToSettings = () => {
    router.push('/settings');
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
            style={styles.iconButton}
            onPress={goToSettings}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <AppIcon name="settings-outline" size={22} color={colors.primary} />
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
});

import { View, StyleSheet, Text, Pressable } from 'react-native';
import { AppIcon } from './AppIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { useSidebar } from './SidebarContext';

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
  userInitials = 'A',
}: GlobalHeaderProps) {
  const insets = useSafeAreaInsets();
  const { openSidebar } = useSidebar();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {showBack ? (
          <Pressable style={styles.iconButton} onPress={onBackPress}>
            <AppIcon name="chevron-back" size={24} color={colors.text} />
          </Pressable>
        ) : (
          <Pressable style={styles.iconButton} onPress={openSidebar}>
            <AppIcon name="menu" size={24} color={colors.primary} />
          </Pressable>
        )}

        <View style={styles.titleContainer}>
          {title ? (
            <Text style={styles.title}>{title}</Text>
          ) : (
            <Text style={styles.brandName}>apna notes</Text>
          )}
        </View>

        {showProfile && (
          <View style={styles.profileContainer}>
            <View style={styles.profile}>
              <Text style={styles.profileText}>{userInitials}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 48,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  profileContainer: {
    marginLeft: 'auto',
  },
  profile: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

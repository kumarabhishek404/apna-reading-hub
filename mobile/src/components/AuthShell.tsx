import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '@/components/AppIcon';
import { colors, borderRadius, spacing } from '@/theme/colors';
import type { ItemType } from '@/theme/typeColors';
import { getTypeTheme, TYPE_LABELS } from '@/theme/typeColors';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const TYPE_CHIPS: Array<{ type: ItemType; icon: IoniconName }> = [
  { type: 'note', icon: 'document-text-outline' },
  { type: 'blog', icon: 'newspaper-outline' },
  { type: 'link', icon: 'link-outline' },
  { type: 'pdf', icon: 'document-outline' },
  { type: 'reminder', icon: 'notifications-outline' },
  { type: 'alarm', icon: 'alarm-outline' },
];

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  accent = colors.primary,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** Top card accent bar color */
  accent?: string;
  children: ReactNode;
}) {
  const { width } = useWindowDimensions();
  const compact = width < 360;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.atmosphere} pointerEvents="none">
        <LinearGradient
          colors={[colors.note.background, colors.background, colors.blog.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.orb, styles.orbNote]} />
        <View style={[styles.orb, styles.orbBlog]} />
        <View style={[styles.orb, styles.orbLink]} />
        <View style={[styles.orb, styles.orbReminder]} />
      </View>

      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            compact && styles.containerCompact,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandBlock}>
            <View style={styles.logoMark}>
              <LinearGradient
                colors={[colors.note.primary, colors.note.light]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <AppIcon name="book-outline" size={22} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.brandName}>apna notes</Text>
            <Text style={styles.brandHint}>your reading hub</Text>

            <View style={styles.chipRow}>
              {TYPE_CHIPS.map(({ type, icon }) => {
                const theme = getTypeTheme(type);
                return (
                  <View
                    key={type}
                    style={[
                      styles.chip,
                      { backgroundColor: theme.muted, borderColor: theme.soft },
                    ]}
                  >
                    <AppIcon name={icon} size={12} color={theme.primary} />
                    {!compact ? (
                      <Text style={[styles.chipLabel, { color: theme.dark }]}>
                        {TYPE_LABELS[type]}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <View style={[styles.cardAccent, { backgroundColor: accent }]} />
            <Text style={[styles.eyebrow, { color: accent }]}>{eyebrow}</Text>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.note.background,
  },
  atmosphere: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.55,
  },
  orbNote: {
    width: 220,
    height: 220,
    top: -60,
    right: -70,
    backgroundColor: colors.note.soft,
  },
  orbBlog: {
    width: 160,
    height: 160,
    top: 120,
    left: -70,
    backgroundColor: colors.blog.soft,
  },
  orbLink: {
    width: 140,
    height: 140,
    bottom: 180,
    right: -40,
    backgroundColor: colors.link.soft,
  },
  orbReminder: {
    width: 120,
    height: 120,
    bottom: 40,
    left: 20,
    backgroundColor: colors.reminder.soft,
  },
  wrapper: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl,
    gap: spacing.xl,
  },
  containerCompact: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  brandBlock: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoMark: {
    marginBottom: 4,
    borderRadius: 18,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowPrimary,
        shadowOpacity: 1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 4 },
    }),
  },
  logoGradient: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: -0.6,
  },
  brandHint: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
    maxWidth: 340,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  chipLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.note.soft,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowPrimary,
        shadowOpacity: 1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 12 },
      },
      android: { elevation: 8 },
    }),
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 4,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

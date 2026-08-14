import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { getTypeLabel, getTypeTheme, type ItemType } from '@/theme/typeColors';

type TypeThemedScreenProps = {
  type: ItemType;
  title: string;
  children: ReactNode;
  headerRight?: ReactNode;
  scroll?: boolean;
  fallbackHref?: string;
};

export function TypeThemedScreen({
  type,
  title,
  children,
  headerRight,
  scroll = false,
  fallbackHref = '/(tabs)/content',
}: TypeThemedScreenProps) {
  const theme = getTypeTheme(type);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const horizontalPad = width < 360 ? 16 : 20;

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(fallbackHref as any);
  };

  const body = (
    <>
      <View style={styles.headerRow}>
        <Pressable
          style={[
            styles.backButton,
            { backgroundColor: theme.muted, borderColor: theme.soft },
          ]}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <AppIcon name="chevron-back" size={22} color={theme.primary} />
        </Pressable>
        {headerRight}
      </View>

      <View style={[styles.typeBadge, { backgroundColor: theme.muted }]}>
        <View style={[styles.typeDot, { backgroundColor: theme.primary }]} />
        <Text style={[styles.typeBadgeText, { color: theme.primary }]}>
          {getTypeLabel(type)}
        </Text>
      </View>

      <Text
        style={[styles.title, { color: theme.dark, fontSize: width < 360 ? 26 : 30 }]}
        numberOfLines={2}
      >
        {title}
      </Text>
      {children}
    </>
  );

  const contentStyle = [
    styles.container,
    {
      paddingHorizontal: horizontalPad,
      paddingBottom: Math.max(insets.bottom, 16) + 24,
    },
  ];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={contentStyle}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {body}
          </ScrollView>
        ) : (
          <View style={[styles.flex, contentStyle]}>{body}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingTop: 12,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});

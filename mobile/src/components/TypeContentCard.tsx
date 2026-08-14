import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { getTypeLabel, getTypeTheme, type ItemType } from '@/theme/typeColors';

type TypeContentCardProps = {
  type: ItemType;
  title: string;
  meta?: string;
  onPress?: () => void;
  actions?: ReactNode;
  showKindBadge?: boolean;
};

export function TypeContentCard({
  type,
  title,
  meta,
  onPress,
  actions,
  showKindBadge = true,
}: TypeContentCardProps) {
  const theme = getTypeTheme(type);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.background,
          borderColor: theme.soft,
        },
      ]}
    >
      <View style={[styles.accent, { backgroundColor: theme.primary }]} />
      <Pressable style={styles.body} onPress={onPress} disabled={!onPress}>
        {showKindBadge ? (
          <View style={[styles.kindBadge, { backgroundColor: theme.primary }]}>
            <Text style={styles.kindText}>{getTypeLabel(type)}</Text>
          </View>
        ) : null}
        <Text style={[styles.title, { color: theme.dark }]}>{title}</Text>
        {meta ? <Text style={styles.meta} numberOfLines={2}>{meta}</Text> : null}
      </Pressable>
      {actions ? <View style={[styles.actions, { borderLeftColor: theme.soft }]}>{actions}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: colors.text,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  accent: {
    width: 5,
  },
  body: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  kindBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  kindText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 10,
    paddingLeft: 4,
    borderLeftWidth: 1,
  },
});

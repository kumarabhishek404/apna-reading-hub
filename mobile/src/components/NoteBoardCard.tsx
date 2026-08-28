import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { memo } from 'react';
import { AppIcon } from '@/components/AppIcon';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { colors } from '@/theme/colors';

export type BoardCardPalette = {
  bg: string;
  title: string;
  date: string;
  body: string;
  tagBorder: string;
  tagText: string;
  pillBg: string;
  accent: string;
};

export const NOTE_CARD_PALETTES: BoardCardPalette[] = [
  {
    bg: '#EEF2FF',
    title: '#0F172A',
    date: '#64748B',
    body: '#475569',
    tagBorder: '#C7D2FE',
    tagText: '#3730A3',
    pillBg: '#FDE68A',
    accent: '#4F46E5',
  },
  {
    bg: '#F7F4EE',
    title: '#0F172A',
    date: '#64748B',
    body: '#57534E',
    tagBorder: '#E7E0D4',
    tagText: '#92400E',
    pillBg: '#FDE68A',
    accent: '#B45309',
  },
  {
    bg: '#F4EEF8',
    title: '#0F172A',
    date: '#64748B',
    body: '#57534E',
    tagBorder: '#E9D5FF',
    tagText: '#6B21A8',
    pillBg: '#FDE68A',
    accent: '#7C3AED',
  },
  {
    bg: '#ECF6F1',
    title: '#0F172A',
    date: '#64748B',
    body: '#3F4F46',
    tagBorder: '#CDEAD7',
    tagText: '#166534',
    pillBg: '#FDE68A',
    accent: '#15803D',
  },
  {
    bg: '#F8EEF2',
    title: '#0F172A',
    date: '#64748B',
    body: '#57534E',
    tagBorder: '#F8D4DC',
    tagText: '#9F1239',
    pillBg: '#FDE68A',
    accent: '#BE123C',
  },
  {
    bg: '#F1F5F9',
    title: '#0F172A',
    date: '#64748B',
    body: '#475569',
    tagBorder: '#D8E0EA',
    tagText: '#334155',
    pillBg: '#FDE68A',
    accent: colors.primary,
  },
];

export const REMINDER_CARD_PALETTE: BoardCardPalette = {
  bg: '#FFF4EB',
  title: '#0F172A',
  date: '#9A6B4A',
  body: '#7C4A2E',
  tagBorder: '#FEDFC8',
  tagText: '#C2410C',
  pillBg: '#FDE68A',
  accent: '#EA580C',
};

export function paletteForId(id: string): BoardCardPalette {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return NOTE_CARD_PALETTES[hash % NOTE_CARD_PALETTES.length];
}

export function formatBoardDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
  return `${weekday} ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

type NoteBoardCardProps = {
  dateLabel: string;
  title: string;
  snippet?: string;
  images?: string[];
  tags?: string[];
  scheduleLabel?: string;
  palette: BoardCardPalette;
  onPress: () => void;
};

export const NoteBoardCard = memo(function NoteBoardCard({
  dateLabel,
  title,
  snippet,
  images = [],
  tags = [],
  scheduleLabel,
  palette,
  onPress,
}: NoteBoardCardProps) {
  const thumbs = images.slice(0, 2).map((uri) => resolveMediaUrl(uri)).filter(Boolean) as string[];
  const visibleSnippet =
    snippet && snippet.replace(/\s+/g, ' ').trim().toLowerCase() !== title.replace(/\s+/g, ' ').trim().toLowerCase()
      ? snippet
      : undefined;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: palette.bg, borderColor: palette.tagBorder }]}
      accessibilityRole="button"
    >
      <View style={[styles.accent, { backgroundColor: palette.accent }]} />
      {dateLabel ? (
        <Text style={[styles.date, { color: palette.date }]} pointerEvents="none">
          {dateLabel}
        </Text>
      ) : null}
      <Text style={[styles.title, { color: palette.title }]} numberOfLines={2} pointerEvents="none">
        {title}
      </Text>
      {scheduleLabel ? (
        <View style={[styles.schedule, { backgroundColor: palette.pillBg }]}>
          <AppIcon name="time-outline" size={12} color="#1C1917" />
          <Text style={styles.scheduleText}>{scheduleLabel}</Text>
        </View>
      ) : null}
      {thumbs.length > 0 ? (
        <View style={styles.thumbs}>
          {thumbs.map((uri) => (
            <Image key={uri} source={{ uri }} style={styles.thumb} />
          ))}
        </View>
      ) : null}
      {visibleSnippet ? (
        <Text
          style={[styles.snippet, { color: palette.body }]}
          numberOfLines={4}
          selectable={false}
          pointerEvents="none"
        >
          {visibleSnippet}
        </Text>
      ) : null}
      {tags.length > 0 ? (
        <View style={styles.tags}>
          {tags.slice(0, 3).map((tag) => (
            <View
              key={tag}
              style={[styles.tag, { borderColor: palette.tagBorder, backgroundColor: 'rgba(255,255,255,0.7)' }]}
            >
              <Text style={[styles.tagText, { color: palette.tagText }]}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 14,
    paddingLeft: 16,
    gap: 8,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 14,
    bottom: 14,
    width: 3,
    borderRadius: 2,
  },
  date: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  snippet: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  thumbs: {
    flexDirection: 'row',
    gap: 6,
  },
  thumb: {
    flex: 1,
    height: 72,
    borderRadius: 12,
    backgroundColor: 'rgba(15,23,42,0.06)',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  schedule: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scheduleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: 0.3,
  },
});

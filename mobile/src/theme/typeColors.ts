import { colors } from './colors';

export type ItemType = 'note' | 'blog' | 'link' | 'pdf' | 'reminder' | 'alarm';

export interface TypeColorTheme {
  primary: string;
  light: string;
  dark: string;
  muted: string;
  background: string;
  soft: string;
  onPrimary: string;
}

export const TYPE_LABELS: Record<ItemType, string> = {
  note: 'Note',
  blog: 'Blog',
  link: 'Link',
  pdf: 'PDF',
  reminder: 'Reminder',
  alarm: 'Alarm',
};

export function getTypeColor(type: ItemType): TypeColorTheme {
  return colors[type];
}

export function getTypeTheme(type: ItemType): TypeColorTheme {
  return colors[type];
}

export function getTypePrimaryColor(type: ItemType): string {
  return colors[type].primary;
}

export function getTypeLightColor(type: ItemType): string {
  return colors[type].light;
}

export function getTypeDarkColor(type: ItemType): string {
  return colors[type].dark;
}

export function getTypeMutedColor(type: ItemType): string {
  return colors[type].muted;
}

export function getTypeBackgroundColor(type: ItemType): string {
  return colors[type].background;
}

export function getTypeLabel(type: ItemType): string {
  return TYPE_LABELS[type];
}

export function resolveItemType(value: string | null | undefined): ItemType | null {
  if (!value) return null;
  const key = value.toLowerCase() as ItemType;
  if (key in TYPE_LABELS) return key;
  return null;
}

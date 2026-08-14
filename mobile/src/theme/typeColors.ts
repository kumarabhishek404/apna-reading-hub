import { colors } from './colors';

export type ItemType = 'note' | 'blog' | 'link' | 'pdf' | 'reminder';

export interface TypeColorTheme {
  primary: string;
  light: string;
  dark: string;
  muted: string;
}

export function getTypeColor(type: ItemType): TypeColorTheme {
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

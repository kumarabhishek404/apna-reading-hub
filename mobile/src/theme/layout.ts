import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const TAB_BAR_INNER_HEIGHT = 64;
export const TAB_BAR_FLOAT_MARGIN = 16;

/** Extra space so tab-screen lists clear the floating tab bar on all devices. */
export const TAB_BAR_BASE_HEIGHT = TAB_BAR_INNER_HEIGHT + TAB_BAR_FLOAT_MARGIN;

export function useTabContentPaddingBottom(extra = 24) {
  const insets = useSafeAreaInsets();
  return TAB_BAR_BASE_HEIGHT + Math.max(insets.bottom, 8) + extra;
}

export function useFabBottomOffset(extra = 12) {
  const insets = useSafeAreaInsets();
  return TAB_BAR_BASE_HEIGHT + Math.max(insets.bottom, 8) + extra;
}

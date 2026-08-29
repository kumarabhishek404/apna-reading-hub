import { useEffect, useRef } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '@/components/AppIcon';
import { colors } from '@/theme/colors';

export type AttachAction = 'camera' | 'library' | 'file';

export function AttachMenu({
  accentColor = colors.primary,
  open,
  onToggle,
  onSelect,
}: {
  accentColor?: string;
  open: boolean;
  onToggle: () => void;
  onSelect: (action: AttachAction) => void;
}) {
  const triggerRef = useRef<View>(null);
  const anchor = useRef({ x: 16, y: 200, width: 36, height: 40 });
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  function measureThen(fn: () => void) {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      anchor.current = { x, y, width, height };
      fn();
    });
  }

  function pick(action: AttachAction) {
    onToggle();
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => onSelect(action), 20);
  }

  const menuWidth = 148;
  const menuHeight = 138;
  const left = Math.max(8, anchor.current.x);
  const top = Math.max(8, anchor.current.y - menuHeight - 8);

  return (
    <View style={styles.wrap}>
      <View ref={triggerRef} collapsable={false}>
        <Pressable
          style={[styles.trigger, open && styles.triggerOpen]}
          onPress={() => measureThen(onToggle)}
          accessibilityLabel={open ? 'Close attach menu' : 'Attach photo, camera, or file'}
        >
          <AppIcon name="attach-outline" size={18} color={open ? '#fff' : accentColor} />
        </Pressable>
      </View>
      <Modal visible={open} transparent animationType="none" onRequestClose={onToggle}>
        <Pressable style={styles.backdrop} onPress={onToggle} />
        <View style={[styles.menu, { left, top, width: menuWidth }]}>
          <Pressable style={styles.item} onPress={() => pick('camera')} accessibilityLabel="Take photo">
            <AppIcon name="camera-outline" size={18} color={accentColor} />
            <Text style={styles.label}>Camera</Text>
          </Pressable>
          <Pressable style={styles.item} onPress={() => pick('library')} accessibilityLabel="Add images">
            <AppIcon name="image-outline" size={18} color={accentColor} />
            <Text style={styles.label}>Photo</Text>
          </Pressable>
          <Pressable style={styles.item} onPress={() => pick('file')} accessibilityLabel="Add file">
            <AppIcon name="document-outline" size={18} color={accentColor} />
            <Text style={styles.label}>File</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  menu: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 6,
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  trigger: {
    width: 36,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.note.muted,
  },
  triggerOpen: {
    backgroundColor: colors.primary,
  },
});

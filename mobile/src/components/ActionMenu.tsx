import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from './AppIcon';

interface Action {
  label: string;
  icon: string;
  color: string;
  onPress: () => void;
}

interface ActionMenuProps {
  visible: boolean;
  onClose: () => void;
  actions: Action[];
}

export function ActionMenu({ visible, onClose, actions }: ActionMenuProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.menu}>
          {actions.map((action, index) => (
            <Pressable
              key={index}
              style={[styles.actionItem, index === actions.length - 1 && styles.lastItem]}
              onPress={() => {
                action.onPress();
                onClose();
              }}
            >
              <AppIcon name={action.icon} size={20} color={action.color} />
              <Text style={[styles.actionText, { color: action.color }]}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '80%',
    maxWidth: 280,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

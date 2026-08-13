import React from 'react';
import { View, StyleSheet, Text, Pressable, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { AppIcon } from './AppIcon';
import { colors, borderRadius, typography } from '@/theme/colors';

interface ModernHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  style?: any;
  blurAmount?: number;
}

export function ModernHeader({
  title,
  subtitle,
  onBack,
  rightAction,
  style,
  blurAmount = 20,
}: ModernHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={blurAmount} tint="light" style={styles.blurContainer}>
        <View style={styles.content}>
          <View style={styles.leftContent}>
            {onBack && (
              <Pressable 
                style={styles.backButton} 
                onPress={onBack}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <AppIcon name="chevron-back" size={24} color={colors.text} />
              </Pressable>
            )}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          </View>
          {rightAction && <View style={styles.rightContent}>{rightAction}</View>}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.blur,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  blurContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  rightContent: {
    marginLeft: 12,
  },
});
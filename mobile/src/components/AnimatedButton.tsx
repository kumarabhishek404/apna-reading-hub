import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, shadows, animation, typography } from '@/theme/colors';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: any;
}

export function AnimatedButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  disabled = false,
  loading = false,
  style,
}: AnimatedButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!disabled && !loading) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: animation.fast,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: animation.fast,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: animation.normal,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: animation.normal,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const getButtonStyle = () => {
    const baseStyle = {
      ...styles.button,
      ...styles[size],
      ...(disabled && styles.disabled),
    };

    switch (variant) {
      case 'primary':
        return { ...baseStyle, ...styles.primary };
      case 'secondary':
        return { ...baseStyle, ...styles.secondary };
      case 'outline':
        return { ...baseStyle, ...styles.outline };
      case 'ghost':
        return { ...baseStyle, ...styles.ghost };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = () => {
    const baseStyle = {
      ...styles.text,
      ...styles[`text_${size}`],
    };

    switch (variant) {
      case 'primary':
        return { ...baseStyle, ...styles.textPrimary };
      case 'secondary':
        return { ...baseStyle, ...styles.textSecondary };
      case 'outline':
        return { ...baseStyle, ...styles.textOutline };
      case 'ghost':
        return { ...baseStyle, ...styles.textGhost };
      default:
        return baseStyle;
    }
  };

  const ButtonContent = variant === 'primary' || variant === 'secondary' 
    ? LinearGradient 
    : View;

  const gradientColors = variant === 'primary' 
    ? [colors.primary, colors.primaryLight]
    : [colors.secondary, colors.secondaryLight];

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
      >
        <ButtonContent
          colors={variant === 'primary' || variant === 'secondary' ? gradientColors : undefined}
          style={getButtonStyle()}
        >
          <Animated.View style={{ opacity: opacityAnim, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? (
              <Text style={getTextStyle()}>...</Text>
            ) : (
              <>
                {icon && <Text style={getTextStyle()}>{icon}</Text>}
                <Text style={getTextStyle()}>{title}</Text>
              </>
            )}
          </Animated.View>
        </ButtonContent>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  small: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  medium: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  primary: {
    ...shadows.primary,
  },
  secondary: {
    ...shadows.secondary,
  },
  outline: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  ghost: {
    backgroundColor: 'transparent',
    ...shadows.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...typography.label.large,
    fontWeight: '600',
  },
  text_small: {
    fontSize: 13,
  },
  text_medium: {
    fontSize: 15,
  },
  text_large: {
    fontSize: 17,
  },
  textPrimary: {
    color: '#FFFFFF',
  },
  textSecondary: {
    color: '#FFFFFF',
  },
  textOutline: {
    color: colors.text,
  },
  textGhost: {
    color: colors.primary,
  },
});
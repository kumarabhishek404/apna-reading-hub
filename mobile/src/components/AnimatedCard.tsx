import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, shadows, animation } from '@/theme/colors';

interface AnimatedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  containerStyle?: any;
  gradient?: boolean;
  gradientColors?: string[];
  shadow?: 'sm' | 'md' | 'lg' | 'xl' | 'primary' | 'secondary';
  scaleOnPress?: boolean;
}

export function AnimatedCard({
  children,
  onPress,
  style,
  containerStyle,
  gradient = false,
  gradientColors = [colors.gradientStart, colors.gradientEnd] as const,
  shadow = 'md',
  scaleOnPress = true,
}: AnimatedCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (scaleOnPress) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.96,
          duration: animation.fast,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.9,
          duration: animation.fast,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handlePressOut = () => {
    if (scaleOnPress) {
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

  const CardComponent = gradient ? LinearGradient : View;

  return (
    <Animated.View style={[containerStyle, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.card,
          shadows[shadow],
          pressed && styles.pressed,
          style,
        ]}
      >
        {gradient ? (
          <LinearGradient
            colors={gradientColors as any}
            style={styles.cardContent}
          >
            <Animated.View style={{ opacity: opacityAnim }}>
              {children}
            </Animated.View>
          </LinearGradient>
        ) : (
          <View style={styles.cardContent}>
            <Animated.View style={{ opacity: opacityAnim }}>
              {children}
            </Animated.View>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  cardContent: {
    padding: 16,
  },
  pressed: {
    opacity: 0.8,
  },
});
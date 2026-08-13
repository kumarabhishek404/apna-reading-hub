import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { animation } from '@/theme/colors';

interface FadeInProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: any;
}

export function FadeIn({ children, duration = animation.normal, delay = 0, style }: FadeInProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, duration, delay]);

  return (
    <Animated.View style={[{ opacity: fadeAnim }, style]}>
      {children}
    </Animated.View>
  );
}

export function SlideIn({ 
  children, 
  direction = 'up',
  duration = animation.normal, 
  delay = 0, 
  style 
}: FadeInProps & { direction?: 'up' | 'down' | 'left' | 'right' }) {
  const translateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Set initial position based on direction
    const initialTranslate = direction === 'up' ? 20 : direction === 'down' ? -20 : direction === 'left' ? 20 : -20;
    translateAnim.setValue(initialTranslate);

    Animated.parallel([
      Animated.timing(translateAnim, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateAnim, opacityAnim, duration, delay, direction]);

  const transformStyle = {
    translateY: direction === 'up' || direction === 'down' ? translateAnim : 0,
    translateX: direction === 'left' || direction === 'right' ? translateAnim : 0,
  };

  return (
    <Animated.View style={[{ opacity: opacityAnim, transform: [transformStyle] }, style]}>
      {children}
    </Animated.View>
  );
}
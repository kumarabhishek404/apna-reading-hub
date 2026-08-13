import React, { useRef, useState } from 'react';
import { FlatList, FlatListProps, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View, Animated } from 'react-native';
import { colors, animation } from '@/theme/colors';

interface AnimatedFlatListProps<T> extends FlatListProps<T> {
  animationType?: 'fade' | 'slide' | 'scale';
  staggerDelay?: number;
}

export function AnimatedFlatList<T>({
  animationType = 'fade',
  staggerDelay = 50,
  contentContainerStyle,
  ...props
}: AnimatedFlatListProps<T>) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isScrolling, setIsScrolling] = useState(false);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.setValue(event.nativeEvent.contentOffset.y);
    setIsScrolling(true);
  };

  const handleScrollEnd = () => {
    setIsScrolling(false);
  };

  const renderItem = ({ item, index }: { item: T; index: number }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    React.useEffect(() => {
      const animationDelay = index * staggerDelay;
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: animation.normal,
          delay: animationDelay,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: animation.normal,
          delay: animationDelay,
          useNativeDriver: true,
        }),
      ]).start();
    }, [fadeAnim, slideAnim, index, staggerDelay]);

    const animatedStyle = {
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }],
    };

    return (
      <Animated.View style={animatedStyle}>
        {props.renderItem?.({ item, index } as any)}
      </Animated.View>
    );
  };

  return (
    <FlatList
      {...props}
      renderItem={renderItem}
      onScroll={handleScroll}
      onScrollEndDrag={handleScrollEnd}
      onMomentumScrollEnd={handleScrollEnd}
      scrollEventThrottle={16}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
    />
  );
}

// Simple fade-in list item wrapper
export function FadeInListItem({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: animation.normal,
      delay,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, delay]);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
});
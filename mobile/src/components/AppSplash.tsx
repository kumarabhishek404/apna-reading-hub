import { useEffect, useRef } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { HomeAtmosphere } from '@/components/HomeAtmosphere';
import { colors } from '@/theme/colors';

const LOGO = require('../../assets/splash-icon.png');
const LOGO_SIZE = 176;
const MARK_SIZE = 228;

export function AppSplash({
  ready,
  onPainted,
  onFinished,
}: {
  ready: boolean;
  onPainted: () => void;
  onFinished: () => void;
}) {
  const extras = useSharedValue(0);
  const glow = useSharedValue(0);
  const fill = useSharedValue(0);
  const exit = useSharedValue(1);
  const mountedAt = useRef(Date.now());
  const painted = useRef(false);

  useEffect(() => {
    if (!ready) return;
    const remaining = Math.max(420, 2200 - (Date.now() - mountedAt.current));
    const timer = setTimeout(() => {
      exit.value = withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(onFinished)();
      });
    }, remaining);
    return () => clearTimeout(timer);
  }, [exit, onFinished, ready]);

  const revealExtras = () => {
    extras.value = withDelay(40, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
    glow.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    fill.value = withTiming(1, { duration: 1600, easing: Easing.out(Easing.cubic) });
  };

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: exit.value,
  }));

  const extrasStyle = useAnimatedStyle(() => ({
    opacity: extras.value,
  }));

  const copyStyle = useAnimatedStyle(() => ({
    opacity: extras.value,
    transform: [{ translateY: interpolate(extras.value, [0, 1], [10, 0]) }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.08]) }],
    opacity: interpolate(glow.value, [0, 1], [0.28, 0.55]) * extras.value,
  }));

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(glow.value, [0, 1], [1.02, 1.14]) }],
    opacity: interpolate(glow.value, [0, 1], [0.18, 0.4]) * extras.value,
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: interpolate(fill.value, [0, 1], [22, 120]),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      onLayout={() => {
        if (painted.current) return;
        painted.current = true;
        requestAnimationFrame(() => {
          onPainted();
          revealExtras();
        });
      }}
      style={[styles.root, wrapStyle]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, extrasStyle]}>
        <HomeAtmosphere />
      </Animated.View>

      <View style={styles.logoStage}>
        <View style={styles.mark}>
          <Animated.View style={[styles.halo, haloStyle]} />
          <Animated.View style={[styles.ring, ringStyle]} />
          <View style={styles.logoBadge}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          </View>
        </View>
      </View>

      <Animated.View style={[styles.copy, copyStyle]}>
        <Text style={styles.name}>Apna Notes</Text>
        <Text style={styles.tagline}>Your Personal Notebook</Text>
      </Animated.View>

      <Animated.View style={[styles.footer, extrasStyle]}>
        <View style={styles.track}>
          <Animated.View style={[styles.bar, barStyle]}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    backgroundColor: '#EEF2FA',
  },
  logoStage: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    width: MARK_SIZE,
    height: MARK_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: MARK_SIZE,
    height: MARK_SIZE,
    borderRadius: MARK_SIZE / 2,
    backgroundColor: 'rgba(234, 88, 12, 0.16)',
  },
  ring: {
    position: 'absolute',
    width: 204,
    height: 204,
    borderRadius: 102,
    backgroundColor: 'rgba(34, 64, 154, 0.14)',
  },
  logoBadge: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  copy: {
    position: 'absolute',
    top: '50%',
    marginTop: MARK_SIZE / 2 + 12,
    left: 32,
    right: 32,
    alignItems: 'center',
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  tagline: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 56 : 48,
    alignItems: 'center',
  },
  track: {
    width: 120,
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(34, 64, 154, 0.12)',
  },
  bar: {
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
});

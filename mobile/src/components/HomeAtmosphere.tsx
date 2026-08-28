import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';

type OrbSpec = {
  size: number;
  color: string;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
};

const ORBS: OrbSpec[] = [
  { size: 280, color: 'rgba(34, 64, 154, 0.18)', top: -90, right: -80, driftX: -28, driftY: 36, duration: 9000, delay: 0 },
  { size: 190, color: 'rgba(2, 132, 199, 0.16)', top: 70, left: -80, driftX: 24, driftY: 22, duration: 11000, delay: 400 },
  { size: 160, color: 'rgba(234, 88, 12, 0.12)', bottom: 140, right: -50, driftX: -18, driftY: -28, duration: 10000, delay: 800 },
  { size: 130, color: 'rgba(124, 58, 237, 0.12)', bottom: 40, left: 24, driftX: 16, driftY: -20, duration: 8500, delay: 200 },
  { size: 90, color: 'rgba(59, 91, 204, 0.2)', top: 210, right: 40, driftX: 12, driftY: -16, duration: 7000, delay: 600 },
];

const SPARKS: Array<{
  top?: number;
  bottom?: number;
  left?: number | `${number}%`;
  right?: string;
  delay: number;
}> = [
  { top: 120, left: '22%', delay: 0 },
  { top: 180, right: '18%', delay: 700 },
  { top: 320, left: '12%', delay: 1400 },
  { bottom: 180, right: '28%', delay: 400 },
  { bottom: 90, left: '38%', delay: 1100 },
];

function FloatingOrb({ spec }: { spec: OrbSpec }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      spec.delay,
      withRepeat(
        withTiming(1, { duration: spec.duration, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, [progress, spec.delay, spec.duration]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, spec.driftX]) },
      { translateY: interpolate(progress.value, [0, 1], [0, spec.driftY]) },
      { scale: interpolate(progress.value, [0, 1], [1, 1.08]) },
    ],
    opacity: interpolate(progress.value, [0, 1], [0.55, 0.9]),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.orb,
        {
          width: spec.size,
          height: spec.size,
          backgroundColor: spec.color,
          top: spec.top,
          left: spec.left,
          right: spec.right,
          bottom: spec.bottom,
        },
        style,
      ]}
    />
  );
}

function AuroraBand() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 14000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.32, 0.58]),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-36, 48]) },
      { translateY: interpolate(progress.value, [0, 1], [-12, 18]) },
      { rotate: `${interpolate(progress.value, [0, 1], [-12, 10])}deg` },
    ],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.auroraWrap, style]}>
      <LinearGradient
        colors={['transparent', 'rgba(59, 91, 204, 0.16)', 'rgba(2, 132, 199, 0.1)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.aurora}
      />
    </Animated.View>
  );
}

function Spark({
  top,
  left,
  right,
  bottom,
  delay,
}: {
  top?: number;
  left?: number | `${number}%`;
  right?: string;
  bottom?: number;
  delay: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }), -1, true),
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.15, 0.7]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.7, 1.15]) }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.spark, { top, left, right, bottom }, style]}
    />
  );
}

export function HomeAtmosphere() {
  return (
    <View pointerEvents="none" style={styles.wrap}>
      <LinearGradient
        colors={['#E8EEF8', '#F7F9FC', '#EEF4FB', '#F4F1EA']}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(34, 64, 154, 0.08)', 'transparent', 'rgba(234, 88, 12, 0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <AuroraBand />
      {ORBS.map((spec, index) => (
        <FloatingOrb key={index} spec={spec} />
      ))}
      {SPARKS.map((spark, index) => (
        <Spark key={index} {...spark} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: colors.note.background,
  },
  auroraWrap: {
    position: 'absolute',
    top: '18%',
    left: -80,
    right: -80,
    height: 220,
  },
  aurora: {
    flex: 1,
    borderRadius: 120,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  spark: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryLight,
  },
});

import { useEffect } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

import { Palette, Radius } from '@/constants/theme';

// Grey placeholder shape that pulses gently — used everywhere a spinner
// used to be, sized/shaped per screen to roughly match the real content
// so the layout doesn't visibly jump once data arrives.
export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.base, style, animatedStyle]} />;
}

// A generic "card" skeleton — thumbnail + a couple of lines — reused by
// News, Opportunities, and Journey while their real data loads.
export function SkeletonCardRow() {
  return (
    <View style={styles.row}>
      <Skeleton style={styles.thumb} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton style={styles.lineWide} />
        <Skeleton style={styles.lineMedium} />
        <Skeleton style={styles.lineNarrow} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View style={{ gap: 4 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCardRow key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Palette.dividerLight,
    borderRadius: Radius.cardSmall,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  lineWide: {
    height: 14,
    width: '90%',
    borderRadius: 6,
  },
  lineMedium: {
    height: 12,
    width: '70%',
    borderRadius: 6,
  },
  lineNarrow: {
    height: 12,
    width: '40%',
    borderRadius: 6,
  },
});

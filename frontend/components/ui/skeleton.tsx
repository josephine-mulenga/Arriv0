import { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleProp, View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

import { Palette, Radius } from '@/constants/theme';

// Grey placeholder shape with a lighter highlight bar sweeping left to
// right — used everywhere a spinner used to be, sized/shaped per screen to
// roughly match the real content so the layout doesn't visibly jump once
// data arrives.
export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const [width, setWidth] = useState(0);
  const translateX = useSharedValue(-1);

  useEffect(() => {
    translateX.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }), -1, false);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * width }],
  }));

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View style={[styles.base, style]} onLayout={onLayout}>
      {width > 0 && (
        <Animated.View style={[styles.highlight, { width: width * 0.6 }, animatedStyle]} />
      )}
    </View>
  );
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
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(255,255,255,0.55)',
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

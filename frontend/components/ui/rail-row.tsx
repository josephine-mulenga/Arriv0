import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

import { Palette } from '@/constants/theme';

interface RailRowProps {
  dotColor: string;
  dotFilled: boolean;
  dotSize?: number;
  ringWidth?: number;
  isLast?: boolean;
  index?: number;
  children: React.ReactNode;
}

// The dot-plus-connecting-line rail shared by Timeline and Milestones: a
// 14px-wide column with a status dot near the top and a track line filling
// the rest of the row's height, sitting beside the row's card.
export function RailRow({
  dotColor,
  dotFilled,
  dotSize = 11,
  ringWidth = 0,
  isLast = false,
  index = 0,
  children,
}: RailRowProps) {
  const dotScale = useSharedValue(1);

  useEffect(() => {
    if (dotFilled) {
      dotScale.value = withSequence(withSpring(1.35, { damping: 6, stiffness: 400 }), withSpring(1));
    }
  }, [dotFilled]);

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(320)} style={styles.row}>
      <View style={styles.rail}>
        <View
          style={[
            styles.dotWrap,
            { marginTop: 20 },
          ]}>
          <Animated.View
            style={[
              styles.dot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: dotFilled ? dotColor : Palette.white,
                borderWidth: ringWidth,
                borderColor: ringWidth ? dotColor : 'transparent',
              },
              dotAnimatedStyle,
            ]}
          />
        </View>
        {!isLast && <View style={styles.line} />}
      </View>
      <View style={styles.card}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  rail: {
    width: 14,
    alignItems: 'center',
  },
  dotWrap: {
    alignItems: 'center',
  },
  dot: {},
  line: {
    flex: 1,
    width: 2,
    backgroundColor: Palette.track,
    marginTop: 4,
    marginBottom: 4,
  },
  card: {
    flex: 1,
    marginLeft: 10,
    marginBottom: 10,
  },
});

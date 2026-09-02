import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { CheckCircleIcon, CircleIcon } from 'phosphor-react-native';

import { Palette } from '@/constants/theme';

interface AnimatedCheckProps {
  done: boolean;
  size?: number;
  doneColor?: string;
  undoneColor?: string;
}

// A checkbox glyph that pops with a spring bounce the moment it becomes
// done, instead of silently swapping icons — used anywhere a step gets
// manually confirmed (Timeline steps, the deadline-detail checklist).
export function AnimatedCheck({
  done,
  size = 20,
  doneColor = Palette.green,
  undoneColor = Palette.chevron,
}: AnimatedCheckProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (done) {
      scale.value = withSequence(withSpring(1.4, { damping: 6, stiffness: 400 }), withSpring(1));
    }
  }, [done]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      {done ? (
        <CheckCircleIcon size={size} color={doneColor} weight="fill" />
      ) : (
        <CircleIcon size={size} color={undoneColor} />
      )}
    </Animated.View>
  );
}

import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  children: React.ReactNode;
}

// Generic press-scale bounce for selection rows (segmented controls, option
// cards, yes/no toggles) that don't need their own bespoke animation.
// Never use Pressable's `style={({pressed}) => ...}` callback form on the
// result of this — Reanimated's animated-component wrapper doesn't support
// it, and the whole style (backgrounds, padding, borders) silently fails
// to apply.
export function PressableScale({ style, scaleTo = 0.95, children, ...rest }: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressableBase
      {...rest}
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, { damping: 14, stiffness: 320 });
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 10, stiffness: 200 });
        rest.onPressOut?.(e);
      }}
      style={[style, animatedStyle]}>
      {children}
    </AnimatedPressableBase>
  );
}

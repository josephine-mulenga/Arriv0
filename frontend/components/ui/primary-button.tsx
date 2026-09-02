import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { Palette, Radius, Type } from '@/constants/theme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Note: Pressable's `style={({pressed}) => ...}` callback form silently
// breaks when the component is wrapped by Animated.createAnimatedComponent
// — Reanimated expects a plain style array/object, not a function, and the
// whole style (including background/padding) fails to apply, making the
// button invisible. Press feedback is driven entirely through shared
// values instead, never through that callback.
export function PrimaryButton({ label, onPress, disabled, style }: PrimaryButtonProps) {
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: pressed.value > 0.5 ? Palette.purpleDark : Palette.purple,
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(0.94, { damping: 12, stiffness: 320 });
        pressed.value = withTiming(1, { duration: 80 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 9, stiffness: 200 });
        pressed.value = withTiming(0, { duration: 150 });
      }}
      style={[styles.button, disabled && styles.disabled, style, animatedStyle]}>
      <Text style={styles.label}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Palette.purple,
    borderRadius: Radius.button,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: Palette.white,
    fontFamily: Type.headingSemiBold,
    fontSize: 16,
  },
});

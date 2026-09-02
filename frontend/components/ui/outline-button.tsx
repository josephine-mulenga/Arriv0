import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { Palette, Radius, Type } from '@/constants/theme';

interface OutlineButtonProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// See primary-button.tsx: Pressable's `style={({pressed}) => ...}` callback
// breaks silently under Animated.createAnimatedComponent, so press feedback
// is driven entirely through shared values instead.
export function OutlineButton({ label, onPress, style }: OutlineButtonProps) {
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: pressed.value > 0.5 ? Palette.borderPress : Palette.borderInput,
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.94, { damping: 12, stiffness: 320 });
        pressed.value = withTiming(1, { duration: 80 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 9, stiffness: 200 });
        pressed.value = withTiming(0, { duration: 150 });
      }}
      style={[styles.button, style, animatedStyle]}>
      <Text style={styles.label}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1.5,
    borderColor: Palette.borderInput,
    borderRadius: Radius.button,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.white,
  },
  label: {
    color: Palette.inkBody,
    fontFamily: Type.headingSemiBold,
    fontSize: 16,
  },
});

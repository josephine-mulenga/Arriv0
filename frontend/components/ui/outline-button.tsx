import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Palette, Radius, Type } from '@/constants/theme';

interface OutlineButtonProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function OutlineButton({ label, onPress, style }: OutlineButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 14, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 10, stiffness: 200 });
      }}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style, animatedStyle]}>
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
  pressed: {
    borderColor: Palette.borderPress,
  },
  label: {
    color: Palette.inkBody,
    fontFamily: Type.headingSemiBold,
    fontSize: 16,
  },
});

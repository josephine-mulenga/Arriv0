import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { Palette, Radius, Type } from '@/constants/theme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Note: Pressable's `style={({pressed}) => ...}` callback form silently
// breaks when the component is wrapped by Animated.createAnimatedComponent
// — Reanimated expects a plain style array/object, not a function, and the
// whole style (including background/padding) fails to apply, making the
// button invisible. Press feedback is driven entirely through shared
// values instead, never through that callback.
export function PrimaryButton({ label, onPress, disabled, loading, style }: PrimaryButtonProps) {
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);
  const isDisabled = disabled || loading;

  // Driving disabled/pressed/default entirely off one shared-value-backed
  // style (rather than layering a separate opacity-based `disabled` style
  // in the style array) avoids the array's last-entry-wins merge silently
  // overriding it — this is also what fixes the button reading as a washed-
  // out pale lavender: a solid purple faded by opacity looks pastel on a
  // white screen, whereas a distinct neutral gray reads as "not ready yet"
  // while keeping the enabled color fully solid, vivid purple always.
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: isDisabled ? Palette.borderInput : pressed.value > 0.5 ? Palette.purpleDark : Palette.purple,
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isDisabled}
      onPressIn={() => {
        scale.value = withSpring(0.94, { damping: 12, stiffness: 320 });
        pressed.value = withTiming(1, { duration: 80 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 9, stiffness: 200 });
        pressed.value = withTiming(0, { duration: 150 });
      }}
      style={[styles.button, style, animatedStyle]}>
      {loading ? (
        <ActivityIndicator color={isDisabled ? Palette.inkPlaceholder : Palette.white} />
      ) : (
        <Text style={[styles.label, isDisabled && styles.labelDisabled]}>{label}</Text>
      )}
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
  label: {
    color: Palette.white,
    fontFamily: Type.headingSemiBold,
    fontSize: 16,
  },
  labelDisabled: {
    color: Palette.inkPlaceholder,
  },
});

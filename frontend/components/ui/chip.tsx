import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { CheckIcon } from 'phosphor-react-native';

import { Palette, Radius, Type } from '@/constants/theme';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  // Opt-in only — every existing single-select usage (filter chips, year
  // chips) is unaffected. Set on a chip group where more than one option
  // can genuinely be true at once, so a checkmark (rather than just a
  // color flip) makes it clear multiple can stay selected together.
  showCheck?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Single-select pill used for year chips, category chips, filter chips.
export function Chip({ label, selected, onPress, showCheck }: ChipProps) {
  const scale = useSharedValue(1);
  const bg = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    bg.value = withTiming(selected ? 1 : 0, { duration: 180 });
    if (selected) {
      scale.value = withSequence(withSpring(1.08, { damping: 8, stiffness: 400 }), withSpring(1));
    }
  }, [selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: bg.value > 0.5 ? Palette.purple : Palette.dividerLight,
    transform: [{ scale: scale.value }],
  }));
  const animatedLabelStyle = useAnimatedStyle(() => ({
    color: bg.value > 0.5 ? Palette.white : Palette.inkMuted,
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.94, { damping: 14, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(selected ? 1.02 : 1, { damping: 10, stiffness: 200 });
      }}
      style={[styles.chip, showCheck && styles.chipWithCheck, animatedStyle]}>
      {showCheck && selected ? <CheckIcon size={13} color={Palette.white} weight="bold" /> : null}
      <Animated.Text style={[styles.label, animatedLabelStyle]}>{label}</Animated.Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: Radius.chip,
    paddingVertical: 7,
    paddingHorizontal: 15,
  },
  chipWithCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  label: {
    fontFamily: Type.bodySemiBold,
    fontSize: 13,
  },
});

import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { Palette, Radius, Type } from '@/constants/theme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function PrimaryButton({ label, onPress, disabled, style }: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
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
  pressed: {
    backgroundColor: Palette.purpleDark,
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

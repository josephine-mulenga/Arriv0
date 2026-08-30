import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { Palette, Radius, Type } from '@/constants/theme';

interface OutlineButtonProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function OutlineButton({ label, onPress, style }: OutlineButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
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

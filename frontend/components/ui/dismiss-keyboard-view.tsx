import { Keyboard, Pressable, StyleProp, ViewStyle } from 'react-native';

interface DismissKeyboardViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

// Wrap a screen's content with this so tapping anywhere that isn't itself
// an interactive element (a field, a button) dismisses the keyboard —
// child Pressables/TextInputs still claim their own touches first, so
// this only fires on genuinely empty space.
export function DismissKeyboardView({ children, style }: DismissKeyboardViewProps) {
  return (
    <Pressable style={[{ flex: 1 }, style]} onPress={Keyboard.dismiss} accessible={false}>
      {children}
    </Pressable>
  );
}

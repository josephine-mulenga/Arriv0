import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { EyeIcon, EyeSlashIcon, type Icon } from 'phosphor-react-native';

import { Palette, Radius, Type } from '@/constants/theme';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  icon?: Icon;
  isPassword?: boolean;
  error?: string;
  containerStyle?: ViewStyle;
}

// Shared input for auth screens (and anywhere else that wants the same
// look): consistent height/border/radius/shadow, an optional password-
// reveal toggle, and — the important part — an error slot that is ALWAYS
// present and ALWAYS the same height, whether or not there's an error.
// Conditionally rendering the error text (mounting/unmounting it) is what
// causes a form to visibly shift as the user types; keeping the element
// permanently in the layout and only fading its content in/out avoids that
// entirely, no matter how the surrounding validation logic changes later.
export function TextField({
  icon: IconComponent,
  isPassword,
  error,
  containerStyle,
  secureTextEntry,
  ...rest
}: TextFieldProps) {
  const [reveal, setReveal] = useState(false);
  const errorOpacity = useSharedValue(0);

  useEffect(() => {
    errorOpacity.value = withTiming(error ? 1 : 0, { duration: 160 });
  }, [error]);

  const errorAnimatedStyle = useAnimatedStyle(() => ({ opacity: errorOpacity.value }));

  return (
    <View style={containerStyle}>
      <View style={styles.row}>
        {IconComponent ? <IconComponent size={18} color="#A9A7BE" /> : null}
        <TextInput
          style={styles.input}
          placeholderTextColor={Palette.inkPlaceholder}
          secureTextEntry={isPassword ? !reveal : secureTextEntry}
          {...rest}
        />
        {isPassword ? (
          <Pressable onPress={() => setReveal((v) => !v)} hitSlop={8}>
            {reveal ? <EyeSlashIcon size={18} color="#A9A7BE" /> : <EyeIcon size={18} color="#A9A7BE" />}
          </Pressable>
        ) : null}
      </View>
      <Animated.Text style={[styles.errorText, errorAnimatedStyle]} numberOfLines={1}>
        {error || ' '}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    borderWidth: 1,
    borderColor: Palette.borderInput,
    backgroundColor: Palette.white,
    borderRadius: Radius.input,
    paddingHorizontal: 15,
    shadowColor: Palette.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.045,
    shadowRadius: 6,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontFamily: Type.bodyRegular,
    fontSize: 15,
    color: Palette.ink,
  },
  errorText: {
    marginTop: 4,
    height: 16,
    fontFamily: Type.bodyRegular,
    fontSize: 12,
    color: Palette.danger,
  },
});

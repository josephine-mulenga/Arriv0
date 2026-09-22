import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppleLogoIcon, GoogleLogoIcon, WindowsLogoIcon } from 'phosphor-react-native';

import { Palette, Radius, Type } from '@/constants/theme';

interface SocialLoginRowProps {
  onGoogle: () => void;
  onApple: () => void;
  onMicrosoft: () => void;
}

export function SocialLoginRow({ onGoogle, onApple, onMicrosoft }: SocialLoginRowProps) {
  return (
    <View>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.row}>
        <Pressable style={styles.button} onPress={onGoogle} hitSlop={4}>
          <GoogleLogoIcon size={20} weight="bold" color={Palette.ink} />
        </Pressable>
        <Pressable style={styles.button} onPress={onApple} hitSlop={4}>
          <AppleLogoIcon size={22} weight="fill" color={Palette.ink} />
        </Pressable>
        <Pressable style={styles.button} onPress={onMicrosoft} hitSlop={4}>
          <WindowsLogoIcon size={20} weight="bold" color={Palette.ink} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Palette.divider,
  },
  dividerText: {
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.inkPlaceholder,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: Palette.borderInput,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.045,
    shadowRadius: 6,
    elevation: 1,
  },
});

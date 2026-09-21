import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WarningCircleIcon } from 'phosphor-react-native';

import { Palette, Type } from '@/constants/theme';

// Shared "something failed to load" block — plain-English message plus a
// Try again button, never a raw error/stack trace shown to the user.
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.container}>
      <WarningCircleIcon size={32} color="#CFC9F5" />
      <Text style={styles.message}>{message}</Text>
      <Pressable style={styles.button} onPress={onRetry}>
        <Text style={styles.buttonText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 10,
  },
  message: {
    fontFamily: Type.bodyRegular,
    fontSize: 13.5,
    lineHeight: 19,
    color: Palette.inkMuted,
    textAlign: 'center',
  },
  button: {
    marginTop: 4,
    backgroundColor: Palette.purple,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  buttonText: {
    fontFamily: Type.bodySemiBold,
    fontSize: 13,
    color: Palette.white,
  },
});

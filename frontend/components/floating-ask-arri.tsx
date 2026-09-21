import { StyleSheet } from 'react-native';
import { router, usePathname } from 'expo-router';

import { PressableScale } from '@/components/ui/pressable-scale';
import { ArrivoLogo } from '@/components/arrivo-logo';
import { Palette } from '@/constants/theme';

// Persistent shortcut into chat from every tab screen — hidden on chat
// itself (tapping it there would just re-push the same screen) and while
// the tab bar transitions, so it never floats over its own destination.
export function FloatingAskArri() {
  const pathname = usePathname();
  if (pathname === '/chat') return null;

  return (
    <PressableScale style={styles.button} onPress={() => router.push('/chat')} scaleTo={0.9}>
      <ArrivoLogo size={26} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 18,
    bottom: 96,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: Palette.purpleCardBorder,
  },
});

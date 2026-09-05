import { Platform, StyleSheet } from 'react-native';
import { router, usePathname } from 'expo-router';
import { RobotIcon } from 'phosphor-react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/AuthContext';

// Persistent floating entry point into Arri AI chat — web only. Native
// already surfaces chat from Home, and a floating overlay there would
// fight with the bottom tab bar.
export function WebChatBubble() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (Platform.OS !== 'web' || pathname === '/chat' || !user) {
    return null;
  }

  return (
    <PressableScale style={styles.bubble} onPress={() => router.push('/chat')} scaleTo={0.9}>
      <RobotIcon size={26} color={Palette.white} weight="fill" />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'fixed' as 'absolute',
    bottom: 28,
    right: 28,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Palette.purple,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 20px rgba(108,99,255,0.35)',
    zIndex: 1000,
  },
});

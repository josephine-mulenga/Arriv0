import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Palette } from '@/constants/theme';

const MAX_CONTENT_WIDTH = 520;

// On native this is a total no-op passthrough — zero visual change to the
// phone apps. On web, once the browser is wider than a phone, the app was
// stretching edge-to-edge (every screen's spacing/type scale is tuned for a
// phone viewport), so this centers everything into a phone-width column with
// a hairline border — same "no shadows, hairline borders" language the rest
// of the design system already uses — instead of a fake desktop redesign.
export function WebShell({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();

  if (Platform.OS !== 'web' || width <= MAX_CONTENT_WIDTH) {
    return <>{children}</>;
  }

  return (
    <View style={styles.backdrop}>
      <View style={styles.column}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Palette.dividerLight,
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    backgroundColor: Palette.white,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Palette.border,
  },
});

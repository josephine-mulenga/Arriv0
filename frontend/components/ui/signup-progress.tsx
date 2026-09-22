import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Palette } from '@/constants/theme';

const TOTAL_STEPS = 3;

// Shared 3-segment progress bar across the signup flow (account, academic
// profile, personalization) — each screen passes its own step so they all
// stay visually consistent without duplicating the bar's styling three
// times. No padding of its own: it sits next to a fixed-width back button
// inside a row the screen already pads, so it needs `flex: 1` from the
// caller to fill the remaining width rather than baking in a margin that
// would double up with the row's own and push it past the screen edge.
export function SignupProgress({ step, style }: { step: 1 | 2 | 3; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.row, style]}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View key={i} style={[styles.segment, i < step && styles.segmentFilled]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  segment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: Palette.track,
    overflow: 'hidden',
  },
  segmentFilled: {
    backgroundColor: Palette.purple,
  },
});

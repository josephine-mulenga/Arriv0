import { StyleSheet, View } from 'react-native';

import { Palette } from '@/constants/theme';

const TOTAL_STEPS = 3;

// Shared 3-segment progress bar across the signup flow (account, academic
// profile, personalization) — each screen passes its own step so they all
// stay visually consistent without duplicating the bar's styling three times.
export function SignupProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <View style={styles.row}>
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
    paddingHorizontal: 26,
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

import { StyleSheet, View } from 'react-native';

import { Palette } from '@/constants/theme';

interface RailRowProps {
  dotColor: string;
  dotFilled: boolean;
  dotSize?: number;
  ringWidth?: number;
  isLast?: boolean;
  children: React.ReactNode;
}

// The dot-plus-connecting-line rail shared by Timeline and Milestones: a
// 14px-wide column with a status dot near the top and a track line filling
// the rest of the row's height, sitting beside the row's card.
export function RailRow({
  dotColor,
  dotFilled,
  dotSize = 11,
  ringWidth = 0,
  isLast = false,
  children,
}: RailRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        <View
          style={[
            styles.dotWrap,
            { marginTop: 20 },
          ]}>
          <View
            style={[
              styles.dot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: dotFilled ? dotColor : Palette.white,
                borderWidth: ringWidth,
                borderColor: ringWidth ? dotColor : 'transparent',
              },
            ]}
          />
        </View>
        {!isLast && <View style={styles.line} />}
      </View>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  rail: {
    width: 14,
    alignItems: 'center',
  },
  dotWrap: {
    alignItems: 'center',
  },
  dot: {},
  line: {
    flex: 1,
    width: 2,
    backgroundColor: Palette.track,
    marginTop: 4,
    marginBottom: 4,
  },
  card: {
    flex: 1,
    marginLeft: 10,
    marginBottom: 10,
  },
});

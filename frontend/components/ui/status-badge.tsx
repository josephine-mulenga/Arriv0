import { StyleSheet, Text, View } from 'react-native';

import { Type } from '@/constants/theme';

interface StatusBadgeProps {
  label: string;
  color: string;
  tint: string;
}

// radius-9 11px/700 pill — documents, search result tiles.
export function StatusBadge({ label, color, tint }: StatusBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: tint }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 9,
    paddingVertical: 4,
    paddingHorizontal: 9,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: Type.bodyBold,
    fontSize: 11,
  },
});

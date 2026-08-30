import { Pressable, StyleSheet, Text } from 'react-native';

import { Palette, Radius, Type } from '@/constants/theme';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

// Single-select pill used for year chips, category chips, filter chips.
export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected ? styles.chipSelected : styles.chipUnselected]}>
      <Text style={[styles.label, selected ? styles.labelSelected : styles.labelUnselected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: Radius.chip,
    paddingVertical: 7,
    paddingHorizontal: 15,
  },
  chipSelected: {
    backgroundColor: Palette.purple,
  },
  chipUnselected: {
    backgroundColor: Palette.dividerLight,
  },
  label: {
    fontFamily: Type.bodySemiBold,
    fontSize: 13,
  },
  labelSelected: {
    color: Palette.white,
  },
  labelUnselected: {
    color: Palette.inkMuted,
  },
});

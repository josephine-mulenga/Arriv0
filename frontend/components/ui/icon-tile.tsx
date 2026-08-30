import { StyleSheet, View } from 'react-native';
import type { Icon } from 'phosphor-react-native';

import { Radius } from '@/constants/theme';

interface IconTileProps {
  icon: Icon;
  size?: number;
  iconSize?: number;
  tint: string;
  color: string;
  weight?: 'regular' | 'fill';
  radius?: number;
}

// Tinted rounded-square icon container — feature rows, list tiles, search
// results, news thumbnails.
export function IconTile({
  icon: IconComponent,
  size = 44,
  iconSize = 20,
  tint,
  color,
  weight = 'regular',
  radius = Radius.iconTile,
}: IconTileProps) {
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: radius, backgroundColor: tint },
      ]}>
      <IconComponent size={iconSize} color={color} weight={weight} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

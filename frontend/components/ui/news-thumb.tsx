import { Image, StyleSheet, View } from 'react-native';

import { IconTile } from '@/components/ui/icon-tile';
import { ArrivoLogo } from '@/components/arrivo-logo';
import { Palette, Radius } from '@/constants/theme';
import { newsVisual } from '@/utils/newsVisuals';

interface NewsThumbProps {
  imageUrl?: string;
  tag?: string;
  size?: number;
}

// Every news card must show something visual — a real image_url wins,
// otherwise a themed icon fallback by tag, and for tags with no themed
// icon (general/unrecognized) the Arriv0 logo itself, never a blank tile.
export function NewsThumb({ imageUrl, tag, size = 74 }: NewsThumbProps) {
  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={[styles.image, { width: size, height: size }]} />;
  }
  const visual = newsVisual(tag);
  if (visual.icon) {
    return <IconTile icon={visual.icon} tint={visual.tint} color={visual.color} size={size} iconSize={Math.round(size * 0.38)} />;
  }
  return (
    <View style={[styles.logoTile, { width: size, height: size, backgroundColor: visual.tint }]}>
      <ArrivoLogo size={Math.round(size * 0.5)} />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    borderRadius: Radius.iconTile,
    backgroundColor: Palette.dividerLight,
  },
  logoTile: {
    borderRadius: Radius.iconTile,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

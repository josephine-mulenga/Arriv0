import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

import { Palette } from '@/constants/theme';

// Decorative backdrop behind the floating auth card — a soft "marbled"
// blend of the app's own purple family (no new hues introduced), built
// from overlapping radial gradients rather than a flat linear one so it
// reads as marble/watercolor instead of a plain color band.
export function WebCardBackdrop() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
      <Defs>
        <RadialGradient id="base" cx="20%" cy="15%" r="85%">
          <Stop offset="0%" stopColor={Palette.purpleTint} stopOpacity={1} />
          <Stop offset="55%" stopColor={Palette.purpleCard} stopOpacity={1} />
          <Stop offset="100%" stopColor={Palette.dividerLight} stopOpacity={1} />
        </RadialGradient>
        <RadialGradient id="blobA" cx="85%" cy="10%" r="45%">
          <Stop offset="0%" stopColor={Palette.purple} stopOpacity={0.28} />
          <Stop offset="100%" stopColor={Palette.purple} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="blobB" cx="10%" cy="90%" r="50%">
          <Stop offset="0%" stopColor={Palette.purpleDark} stopOpacity={0.22} />
          <Stop offset="100%" stopColor={Palette.purpleDark} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="blobC" cx="92%" cy="85%" r="40%">
          <Stop offset="0%" stopColor={Palette.borderPress} stopOpacity={0.35} />
          <Stop offset="100%" stopColor={Palette.borderPress} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#base)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#blobA)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#blobB)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#blobC)" />
    </Svg>
  );
}

import {
  IdentificationCardIcon,
  BriefcaseIcon,
  GraduationCapIcon,
  type Icon,
} from 'phosphor-react-native';

import { Palette } from '@/constants/theme';

export interface NewsVisual {
  tint: string;
  color: string;
  icon: Icon | null;
}

// Every news card must show something visual, never a blank thumbnail — a
// real image_url wins when the backend has one; otherwise this picks a
// themed fallback by tag. `icon: null` signals "use the Arriv0 logo"
// (general/unrecognized tags) rather than a generic newspaper icon, per
// the explicit ask for a branded fallback there.
const TAG_VISUALS: Record<string, NewsVisual> = {
  'F1 Visa': { tint: Palette.purpleTint, color: Palette.purple, icon: IdentificationCardIcon },
  OPT: { tint: Palette.greenTint, color: Palette.green, icon: BriefcaseIcon },
  CPT: { tint: Palette.amberTint, color: Palette.amber, icon: BriefcaseIcon },
  'STEM OPT': { tint: Palette.redTint, color: Palette.red, icon: GraduationCapIcon },
};

export function newsVisual(tag?: string): NewsVisual {
  if (tag && TAG_VISUALS[tag]) return TAG_VISUALS[tag];
  return { tint: Palette.purpleTint, color: Palette.purple, icon: null };
}

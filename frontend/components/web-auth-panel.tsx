import { StyleSheet, Text, View } from 'react-native';
import {
  AirplaneLandingIcon,
  PathIcon,
  BellIcon,
  NewspaperIcon,
  type Icon,
} from 'phosphor-react-native';

import { Palette, Type } from '@/constants/theme';

const FEATURES: { icon: Icon; label: string }[] = [
  { icon: PathIcon, label: 'Track your OPT & CPT deadlines' },
  { icon: BellIcon, label: 'Never miss a DSO reminder' },
  { icon: NewspaperIcon, label: 'Stay current on visa news' },
];

// Desktop-only branding panel shown beside the auth/onboarding flow (see
// WebShell) — fills the space that used to just be empty backdrop, using
// the same "no shadows, hairline borders" language as the rest of the
// design system instead of a gradient hero image.
export function WebAuthPanel() {
  return (
    <View style={styles.root}>
      <View style={styles.rings}>
        <View style={[styles.ring, styles.ringOuter]} />
        <View style={[styles.ring, styles.ringMiddle]} />
        <View style={styles.mark}>
          <AirplaneLandingIcon size={30} color={Palette.white} weight="fill" />
        </View>
      </View>

      <Text style={styles.wordmark}>Arriv0</Text>
      <Text style={styles.tagline}>Everything for your F-1 journey, in one place.</Text>

      <View style={styles.features}>
        {FEATURES.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <View key={feature.label} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <IconComponent size={16} color={Palette.purple} weight="fill" />
              </View>
              <Text style={styles.featureLabel}>{feature.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const RING_OUTER = 220;
const RING_MIDDLE = 156;
const MARK_SIZE = 92;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surfaceSubtle,
    borderRightWidth: 1,
    borderRightColor: Palette.border,
    paddingHorizontal: 40,
  },
  rings: {
    width: RING_OUTER,
    height: RING_OUTER,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  ring: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: Palette.purpleCardBorder,
  },
  ringOuter: {
    width: RING_OUTER,
    height: RING_OUTER,
  },
  ringMiddle: {
    width: RING_MIDDLE,
    height: RING_MIDDLE,
    borderColor: Palette.borderPress,
  },
  mark: {
    width: MARK_SIZE,
    height: MARK_SIZE,
    borderRadius: MARK_SIZE / 2,
    backgroundColor: Palette.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: Type.headingBold,
    fontSize: 30,
    color: Palette.ink,
  },
  tagline: {
    marginTop: 10,
    fontFamily: Type.bodyRegular,
    fontSize: 14.5,
    lineHeight: 21,
    textAlign: 'center',
    color: Palette.inkMuted,
    maxWidth: 280,
  },
  features: {
    marginTop: 36,
    gap: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: Palette.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontFamily: Type.bodySemiBold,
    fontSize: 13.5,
    color: Palette.inkBody,
  },
});

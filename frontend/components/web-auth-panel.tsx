import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  AirplaneLandingIcon,
  PathIcon,
  BellIcon,
  NewspaperIcon,
  GraduationCapIcon,
  SuitcaseRollingIcon,
  GlobeIcon,
  MapPinIcon,
  CompassIcon,
  type Icon,
} from 'phosphor-react-native';

import { ArrivoLogo } from '@/components/arrivo-logo';
import { Palette, Type } from '@/constants/theme';

const FEATURES: { icon: Icon; label: string }[] = [
  { icon: PathIcon, label: 'Track your OPT & CPT deadlines' },
  { icon: BellIcon, label: 'Never miss a DSO reminder' },
  { icon: NewspaperIcon, label: 'Stay current on visa news' },
];

// Loosely scattered outline icons for background texture — travel + student
// life motifs, kept faint so they read as texture, not content.
const SCATTERED: { icon: Icon; top: number; left: number; size: number; rotate: string; opacity: number }[] = [
  { icon: GraduationCapIcon, top: 60, left: 48, size: 34, rotate: '-12deg', opacity: 0.14 },
  { icon: SuitcaseRollingIcon, top: 120, left: 340, size: 30, rotate: '8deg', opacity: 0.12 },
  { icon: GlobeIcon, top: 340, left: 60, size: 32, rotate: '0deg', opacity: 0.12 },
  { icon: CompassIcon, top: 420, left: 320, size: 28, rotate: '10deg', opacity: 0.14 },
  { icon: MapPinIcon, top: 480, left: 110, size: 24, rotate: '-6deg', opacity: 0.16 },
];

interface WebAuthPanelProps {
  // welcome/intro already carry their own wordmark + tagline in the phone
  // column, so the panel stays purely illustrative there to avoid showing
  // "Arriv0" twice — every other auth screen (signup, login, etc.) has no
  // branding of its own, so the panel carries the full identity block.
  showBranding: boolean;
}

export function WebAuthPanel({ showBranding }: WebAuthPanelProps) {
  const bob = useSharedValue(0);

  useEffect(() => {
    bob.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [bob]);

  const planeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bob.value * -6 },
      { translateX: bob.value * 4 },
      { rotate: '-38deg' },
    ],
  }));

  return (
    <View style={styles.root}>
      <View style={styles.blob} />

      {SCATTERED.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <View
            key={index}
            style={[
              styles.scattered,
              { top: item.top, left: item.left, transform: [{ rotate: item.rotate }] },
            ]}>
            <IconComponent size={item.size} color={Palette.purple} weight="light" style={{ opacity: item.opacity }} />
          </View>
        );
      })}

      <Animated.View entering={FadeIn.duration(600)} style={styles.graphic}>
        <Svg width={220} height={220} viewBox="0 0 220 220" style={StyleSheet.absoluteFill}>
          <Path
            d="M30,190 C70,150 110,120 190,30"
            stroke={Palette.borderPress}
            strokeWidth={2}
            strokeDasharray="6,9"
            fill="none"
          />
          <Circle cx={30} cy={190} r={5} fill={Palette.inkDisabled} />
        </Svg>
        <Animated.View style={[styles.planeWrap, planeStyle]}>
          <AirplaneLandingIcon size={26} color={Palette.purple} weight="fill" />
        </Animated.View>
        <View style={styles.destinationPin}>
          <MapPinIcon size={20} color={Palette.white} weight="fill" />
        </View>
      </Animated.View>

      {showBranding && (
        <Animated.View entering={FadeInUp.delay(150).duration(450)} style={styles.brandingBlock}>
          <View style={styles.logoRow}>
            <ArrivoLogo size={38} />
            <Text style={styles.wordmark}>Arriv0</Text>
          </View>
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
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surfaceSubtle,
    borderRightWidth: 1,
    borderRightColor: Palette.border,
    paddingHorizontal: 40,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    top: -140,
    right: -140,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: Palette.purpleTint,
    opacity: 0.6,
  },
  scattered: {
    position: 'absolute',
  },
  graphic: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planeWrap: {
    position: 'absolute',
    left: 88,
    top: 78,
  },
  destinationPin: {
    position: 'absolute',
    top: 8,
    right: 6,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Palette.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandingBlock: {
    marginTop: 20,
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wordmark: {
    fontFamily: Type.headingBold,
    fontSize: 26,
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
    marginTop: 28,
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

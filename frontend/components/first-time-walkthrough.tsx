import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { XIcon } from 'phosphor-react-native';

import { Palette, Radius, Type } from '@/constants/theme';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Dims {
  width: number;
  height: number;
}

interface Step {
  title: string;
  body: string;
  rect: (dims: Dims) => Rect;
}

// Tab bar and floating-button positions are approximated from their known
// fixed layout (5 even tab slots, 78px tab bar per (tabs)/_layout.tsx,
// floating button at right:18/bottom:96 per floating-ask-arri.tsx) rather
// than measured via refs — good enough to roughly frame each area for a
// one-time walkthrough, without reaching into React Navigation's internal
// tab bar rendering.
const STEPS: Step[] = [
  {
    title: 'This is your Arriv0 Brief',
    body: 'Your daily immigration update and next steps appear here.',
    rect: ({ width }) => ({ x: 10, y: 54, width: width - 20, height: 236 }),
  },
  {
    title: 'Your Journey',
    body: 'Track your entire F1 journey from arrival to OPT.',
    rect: ({ width, height }) => ({ x: (width / 5) * 1, y: height - 78, width: width / 5, height: 78 }),
  },
  {
    title: 'Immigration News',
    body: 'News filtered to what matters to YOU.',
    rect: ({ width, height }) => ({ x: (width / 5) * 2, y: height - 78, width: width / 5, height: 78 }),
  },
  {
    title: 'Opportunities',
    body: 'Internships matched to your profile.',
    rect: ({ width, height }) => ({ x: (width / 5) * 3, y: height - 78, width: width / 5, height: 78 }),
  },
  {
    title: 'Ask Arri',
    body: 'Your AI immigration assistant — ask anything, anytime.',
    rect: ({ width, height }) => ({ x: width - 18 - 62, y: height - 96 - 62, width: 62, height: 62 }),
  },
];

const PAD = 6;

export function FirstTimeWalkthrough({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const { width, height } = useWindowDimensions();
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const rect = current.rect({ width, height });

  const sx = Math.max(0, rect.x - PAD);
  const sy = Math.max(0, rect.y - PAD);
  const sw = Math.min(width - sx, rect.width + PAD * 2);
  const sh = Math.min(height - sy, rect.height + PAD * 2);

  const tooltipBelow = sy < height / 2;
  const tooltipTop = tooltipBelow ? Math.min(height - 190, sy + sh + 14) : Math.max(56, sy - 172);

  const handleNext = () => (isLast ? onDone() : setStep((s) => s + 1));

  return (
    <Animated.View
      style={StyleSheet.absoluteFill}
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(160)}
      pointerEvents="box-none">
      <View style={[styles.scrim, { top: 0, left: 0, right: 0, height: sy }]} />
      <View style={[styles.scrim, { top: sy + sh, left: 0, right: 0, bottom: 0 }]} />
      <View style={[styles.scrim, { top: sy, left: 0, width: sx, height: sh }]} />
      <View style={[styles.scrim, { top: sy, left: sx + sw, right: 0, height: sh }]} />
      <View pointerEvents="none" style={[styles.spotlightRing, { top: sy, left: sx, width: sw, height: sh }]} />

      <Animated.View key={step} entering={FadeIn.duration(200)} style={[styles.tooltip, { top: tooltipTop }]}>
        <Pressable style={styles.skipIcon} onPress={onDone} hitSlop={8}>
          <XIcon size={16} color={Palette.inkFaint} />
        </Pressable>
        <Text style={styles.stepCount}>
          {step + 1} of {STEPS.length}
        </Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.body}>{current.body}</Text>
        <View style={styles.footerRow}>
          <Pressable onPress={onDone} hitSlop={8}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
          <Pressable style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>{isLast ? 'Done' : 'Next'}</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    backgroundColor: 'rgba(15,15,26,0.72)',
  },
  spotlightRing: {
    position: 'absolute',
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: Palette.purple,
    shadowColor: Palette.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 12,
  },
  tooltip: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: Palette.white,
    borderRadius: Radius.cardLarge,
    padding: 18,
    shadowColor: Palette.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  skipIcon: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Palette.dividerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCount: {
    fontFamily: Type.bodyBold,
    fontSize: 12,
    letterSpacing: 0.6,
    color: Palette.purple,
  },
  title: {
    marginTop: 6,
    marginRight: 30,
    fontFamily: Type.headingSemiBold,
    fontSize: 17,
    color: Palette.ink,
  },
  body: {
    marginTop: 6,
    fontFamily: Type.bodyRegular,
    fontSize: 13.5,
    lineHeight: 19,
    color: Palette.inkBody,
  },
  footerRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipText: {
    fontFamily: Type.bodySemiBold,
    fontSize: 13,
    color: Palette.inkFaint,
  },
  nextButton: {
    backgroundColor: Palette.purple,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 20,
  },
  nextButtonText: {
    fontFamily: Type.bodySemiBold,
    fontSize: 13.5,
    color: Palette.white,
  },
});

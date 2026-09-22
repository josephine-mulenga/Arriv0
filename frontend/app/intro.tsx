import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { PathIcon, BriefcaseIcon, BellIcon, SparkleIcon, type Icon } from 'phosphor-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { IconTile } from '@/components/ui/icon-tile';
import { Palette, Type } from '@/constants/theme';

const features: { icon: Icon; text: string }[] = [
  { icon: PathIcon, text: 'Personalized timeline for your F-1 journey' },
  { icon: BriefcaseIcon, text: 'Track CPT & OPT deadlines' },
  { icon: BellIcon, text: 'Get important immigration updates' },
  { icon: SparkleIcon, text: 'AI guidance tailored to your situation' },
];

export default function IntroScreen() {
  return (
    <View style={styles.root}>
      <Animated.Text entering={FadeInDown.duration(400)} style={styles.title}>
        Everything you need,{'\n'}in one place.
      </Animated.Text>

      <View style={styles.featureList}>
        {features.map((item, index) => (
          <Animated.View
            key={index}
            entering={FadeInRight.delay(150 + index * 100).duration(400)}
            style={styles.featureRow}>
            <IconTile icon={item.icon} tint={Palette.purpleTint} color={Palette.purple} iconSize={21} />
            <Text style={styles.featureText}>{item.text}</Text>
          </Animated.View>
        ))}
      </View>

      <View style={styles.spacer} pointerEvents="none">
        <View style={[styles.decorCircle, styles.decorCircleLarge]} />
        <View style={[styles.decorCircle, styles.decorCircleSmall]} />
        <IconTile icon={SparkleIcon} tint={Palette.purpleCard} color={Palette.purple} size={64} iconSize={28} radius={20} />
      </View>

      <PrimaryButton label="Next" onPress={() => router.push('/signup')} />
      <Pressable onPress={() => router.push('/signup')} style={styles.skip}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <View style={styles.dots}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.dot, i === 0 ? styles.dotActive : styles.dotInactive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.white,
    paddingTop: 90,
    paddingHorizontal: 26,
    paddingBottom: 30,
  },
  title: {
    fontFamily: Type.headingBold,
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: -0.26,
    color: Palette.ink,
  },
  featureList: {
    marginTop: 40,
    gap: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureText: {
    flex: 1,
    fontFamily: Type.bodyRegular,
    fontSize: 14.5,
    lineHeight: 21,
    color: Palette.ink,
  },
  spacer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: Palette.purpleTint,
  },
  decorCircleLarge: {
    width: 220,
    height: 220,
    opacity: 0.5,
  },
  decorCircleSmall: {
    width: 130,
    height: 130,
    top: 40,
    left: 40,
    backgroundColor: Palette.purpleCard,
    opacity: 0.7,
  },
  skip: {
    marginTop: 16,
  },
  skipText: {
    textAlign: 'center',
    fontFamily: Type.headingSemiBold,
    fontSize: 14.5,
    color: Palette.purple,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
    marginTop: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    backgroundColor: Palette.purple,
  },
  dotInactive: {
    backgroundColor: '#DEDBF3',
  },
});

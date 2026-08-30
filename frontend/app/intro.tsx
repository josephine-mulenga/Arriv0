import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
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
      <Text style={styles.title}>Everything you need,{'\n'}in one place.</Text>

      <View style={styles.featureList}>
        {features.map((item, index) => (
          <View key={index} style={styles.featureRow}>
            <IconTile icon={item.icon} tint={Palette.purpleTint} color={Palette.purple} iconSize={21} />
            <Text style={styles.featureText}>{item.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.spacer} />

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
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: Palette.purple,
  },
  dotInactive: {
    backgroundColor: '#DEDBF3',
  },
});

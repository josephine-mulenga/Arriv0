import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { ArrivoLogo } from '@/components/arrivo-logo';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Palette, Type } from '@/constants/theme';

export default function WelcomeScreen() {
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Animated.View style={floatStyle}>
          <ArrivoLogo size={140} />
        </Animated.View>

        <Text style={styles.wordmark}>Arriv0</Text>

        <Text style={styles.tagline}>Your journey.{'\n'}Your guide.</Text>

        <Text style={styles.body}>
          Helping international students in the U.S. stay on track from day one to OPT.
        </Text>

        <View style={styles.spacer} />

        <View style={styles.buttonBlock}>
          <PrimaryButton label="Get Started" onPress={() => router.push('/intro')} />
          <Pressable onPress={() => router.push('/login')} style={styles.link}>
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkTextStrong}>Log in</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.white,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 120,
    paddingHorizontal: 34,
  },
  wordmark: {
    marginTop: 6,
    fontFamily: Type.headingBold,
    fontSize: 38,
    letterSpacing: -0.38,
    color: Palette.ink,
  },
  tagline: {
    marginTop: 20,
    fontFamily: Type.headingSemiBold,
    fontSize: 20,
    lineHeight: 27,
    textAlign: 'center',
    color: Palette.ink,
  },
  body: {
    marginTop: 20,
    fontFamily: Type.bodyRegular,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    color: Palette.inkMuted,
    maxWidth: 265,
  },
  spacer: {
    flex: 1,
  },
  buttonBlock: {
    width: '100%',
    paddingBottom: 40,
  },
  link: {
    marginTop: 18,
  },
  linkText: {
    textAlign: 'center',
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    color: Palette.inkFaint,
  },
  linkTextStrong: {
    fontFamily: Type.bodyBold,
    color: Palette.purple,
  },
});

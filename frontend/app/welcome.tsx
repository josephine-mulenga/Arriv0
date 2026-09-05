import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  BounceIn,
  FadeInUp,
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
import { DESKTOP_BREAKPOINT } from '@/constants/layout';

export default function WelcomeScreen() {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width > DESKTOP_BREAKPOINT;
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
      <View style={[styles.content, isDesktopWeb && styles.contentDesktop]}>
        <Animated.View entering={BounceIn.duration(900)} style={floatStyle}>
          <ArrivoLogo size={isDesktopWeb ? 100 : 140} />
        </Animated.View>

        <Animated.Text
          entering={FadeInUp.delay(300).duration(500)}
          style={[styles.wordmark, isDesktopWeb && styles.wordmarkDesktop]}>
          Arriv0
        </Animated.Text>

        <Animated.Text
          entering={FadeInUp.delay(450).duration(500)}
          style={[styles.tagline, isDesktopWeb && styles.taglineDesktop]}>
          Your journey.{isDesktopWeb ? ' ' : '\n'}Your guide.
        </Animated.Text>

        <Animated.Text
          entering={FadeInUp.delay(600).duration(500)}
          style={[styles.body, isDesktopWeb && styles.bodyDesktop]}>
          Helping international students in the U.S. stay on track from day one to OPT.
        </Animated.Text>

        {!isDesktopWeb && <View style={styles.spacer} />}

        <Animated.View
          entering={FadeInUp.delay(800).duration(500)}
          style={[styles.buttonBlock, isDesktopWeb && styles.buttonBlockDesktop]}>
          <PrimaryButton
            label="Get Started"
            onPress={() => router.push('/intro')}
            style={isDesktopWeb ? styles.desktopButton : undefined}
          />
          <Pressable onPress={() => router.push('/login')} style={styles.link}>
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkTextStrong}>Log in</Text>
            </Text>
          </Pressable>
        </Animated.View>
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
  contentDesktop: {
    justifyContent: 'center',
    paddingTop: 0,
  },
  wordmark: {
    marginTop: 6,
    fontFamily: Type.headingBold,
    fontSize: 38,
    letterSpacing: -0.38,
    color: Palette.ink,
  },
  wordmarkDesktop: {
    fontSize: 44,
    marginTop: 14,
  },
  tagline: {
    marginTop: 20,
    fontFamily: Type.headingSemiBold,
    fontSize: 20,
    lineHeight: 27,
    textAlign: 'center',
    color: Palette.ink,
  },
  taglineDesktop: {
    fontSize: 24,
    lineHeight: 30,
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
  bodyDesktop: {
    fontSize: 16.5,
    lineHeight: 26,
    maxWidth: 340,
  },
  spacer: {
    flex: 1,
  },
  buttonBlock: {
    width: '100%',
    paddingBottom: 40,
  },
  buttonBlockDesktop: {
    marginTop: 44,
    paddingBottom: 0,
    alignItems: 'center',
  },
  desktopButton: {
    minWidth: 260,
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

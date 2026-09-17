import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { WebLandingPage } from '@/components/web-landing-page';
import { Palette, Type } from '@/constants/theme';
import { useAuth } from '@/AuthContext';
import { supabase } from '@/supabase';

export default function WelcomeScreen() {
  const { user, initializing } = useAuth();
  const [checkingRecovery, setCheckingRecovery] = useState(Platform.OS === 'web');
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

  // If a password-reset link falls back to this screen (root layout's own
  // listener is what actually redirects it onward to
  // /reset-password-confirm), briefly hold off rendering the marketing page
  // so that redirect can happen before the user ever sees a flash of it.
  useEffect(() => {
    if (Platform.OS !== 'web' || user) return;
    let handled = false;

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (handled) return;
      if (event === 'PASSWORD_RECOVERY' || event === 'INITIAL_SESSION') {
        handled = true;
        setCheckingRecovery(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [user]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));

  // An already-authenticated session landing here — e.g. a bookmark, a
  // refresh — should never show the marketing/welcome screen. Send them
  // straight into the app. Navigating has to happen in an effect, not
  // directly in the render body — calling router.replace during render
  // triggers React's setState-during-render warning, since navigation
  // updates routing state the same way a setState call would.
  useEffect(() => {
    if (!initializing && user) {
      router.replace('/(tabs)');
    }
  }, [initializing, user]);

  if (!initializing && user) {
    return null;
  }

  if (checkingRecovery) {
    return <View style={styles.root} />;
  }

  // Web gets a full marketing homepage (separate from the app) instead of
  // this simple mobile welcome screen — native is completely untouched.
  if (Platform.OS === 'web') {
    return <WebLandingPage />;
  }

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Animated.View entering={BounceIn.duration(900)} style={floatStyle}>
          <ArrivoLogo size={140} />
        </Animated.View>

        <Animated.Text entering={FadeInUp.delay(300).duration(500)} style={styles.wordmark}>
          Arriv0
        </Animated.Text>

        <Animated.Text entering={FadeInUp.delay(450).duration(500)} style={styles.tagline}>
          Your journey.{'\n'}Your guide.
        </Animated.Text>

        <Animated.Text entering={FadeInUp.delay(600).duration(500)} style={styles.body}>
          Helping international students in the U.S. stay on track from day one to OPT.
        </Animated.Text>

        <View style={styles.spacer} />

        <Animated.View entering={FadeInUp.delay(800).duration(500)} style={styles.buttonBlock}>
          <PrimaryButton label="Get Started" onPress={() => router.push('/intro')} />
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

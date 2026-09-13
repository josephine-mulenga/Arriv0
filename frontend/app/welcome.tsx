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
import { finishOAuthSignIn } from '@/utils/oauth';

export default function WelcomeScreen() {
  const { user, initializing, loginWithOAuthSession } = useAuth();
  const [checkingOAuth, setCheckingOAuth] = useState(Platform.OS === 'web');
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

  // Google/Apple/Microsoft sign-in (and password-recovery links) are
  // supposed to land back on /auth-callback or /reset-password-confirm, but
  // if Supabase's redirect-URL allowlist doesn't exactly match those paths,
  // it silently falls back to the Site URL instead — which is this screen.
  // onAuthStateChange is the reliable way to tell the two apart: a recovery
  // link fires PASSWORD_RECOVERY specifically, and treating it as a normal
  // login (the previous version of this check did) would silently log the
  // user in with their OLD password instead of ever prompting for a new
  // one. INITIAL_SESSION fires once on subscribe with whatever session
  // already exists, so no separate getSession() call is needed.
  useEffect(() => {
    if (Platform.OS !== 'web' || user) return;
    let handled = false;

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (handled) return;
      if (event === 'PASSWORD_RECOVERY') {
        handled = true;
        router.replace('/reset-password-confirm');
        return;
      }
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        handled = true;
        finishOAuthSignIn(session, loginWithOAuthSession).catch(() => setCheckingOAuth(false));
        return;
      }
      if (event === 'INITIAL_SESSION' && !session) {
        handled = true;
        setCheckingOAuth(false);
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
  // straight into the app.
  if (!initializing && user) {
    router.replace('/(tabs)');
    return null;
  }

  if (checkingOAuth) {
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

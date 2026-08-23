import { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Dimensions } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  BounceIn,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ArrivoLogo } from '@/components/arrivo-logo';
import { StudyAbroadIllustration } from '@/components/study-abroad-illustration';
import { TripIllustration } from '@/components/trip-illustration';
import { CitySkylineIllustration } from '@/components/city-skyline-illustration';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WelcomeScreen() {
  const glow = useSharedValue(0);
  const planeFloat = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    planeFloat.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + glow.value * 0.08 }],
  }));

  const planeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -planeFloat.value * 10 },
      { translateX: planeFloat.value * 6 },
    ],
  }));

  const letters = 'Arriv0'.split('');
  const skylineWidth = Math.max(SCREEN_WIDTH, 420);

  return (
    <View style={styles.root}>
      {/* Sky gradient, richer multi-stop blend like the reference art */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} viewBox="0 0 400 850" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#8FB8FF" />
            <Stop offset="0.18" stopColor="#A9C9FF" />
            <Stop offset="0.4" stopColor="#C3B9FF" />
            <Stop offset="0.65" stopColor="#DCC4FA" />
            <Stop offset="1" stopColor="#F2E6FF" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="400" height="850" fill="url(#skyGradient)" />

        <Path
          d="M40 200 Q 120 150, 160 230 T 300 330 T 340 450"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeDasharray="6,10"
          fill="none"
          opacity="0.75"
        />
        <Circle cx="90" cy="420" r="5" fill="#F4B740" opacity="0.9" />
        <Circle cx="340" cy="450" r="5" fill="#6C63FF" opacity="0.9" />
      </Svg>

      {/* wide city skyline spanning the full screen width, pinned to the bottom */}
      <View style={styles.skylineWrap} pointerEvents="none">
        <CitySkylineIllustration width={skylineWidth} height={260} />
      </View>

      {/* floating plane */}
      <Animated.View style={[styles.plane, planeStyle]}>
        <TripIllustration size={140} />
      </Animated.View>

      {/* main content, stacks top to bottom */}
      <View style={styles.content}>
        <Animated.View style={glowStyle}>
          <ArrivoLogo size={130} />
        </Animated.View>

        <ThemedView style={styles.nameRow}>
          {letters.map((letter, index) => (
            <Animated.Text
              key={index}
              entering={BounceIn.delay(index * 120).duration(600)}
              style={styles.appNameLetter}>
              {letter}
            </Animated.Text>
          ))}
        </ThemedView>

        <Animated.View entering={FadeIn.delay(900).duration(600)}>
          <ThemedText style={styles.tagline}>Your journey. Your guide.</ThemedText>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(1200).duration(600)}>
          <ThemedText style={styles.description}>
            Helping international students in the U.S. stay on track from day one to OPT.
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(1500).duration(600)} style={styles.buttonBlock}>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/intro')}>
            <ThemedText style={styles.buttonText}>Get Started  →</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/login')} style={styles.link}>
            <ThemedText style={styles.linkText}>Already have an account? Log in</ThemedText>
          </TouchableOpacity>
        </Animated.View>

        {/* student illustration, moved up close to the buttons, enlarged */}
        <View style={styles.studentWrap} pointerEvents="none">
          <StudyAbroadIllustration size={230} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 24,
    gap: 4,
  },
  skylineWrap: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    right: 0,
    alignItems: 'center',
    opacity: 0.9,
  },
  plane: {
    position: 'absolute',
    top: 40,
    right: -10,
  },
  nameRow: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    marginTop: 2,
  },
  appNameLetter: {
    fontSize: 32,
    fontFamily: 'Fredoka_700Bold',
    color: '#1A1A2E',
  },
  tagline: {
    fontSize: 16,
    fontFamily: 'Fredoka_600SemiBold',
    color: '#1A1A2E',
    textAlign: 'center',
    marginTop: 2,
  },
  description: {
    textAlign: 'center',
    color: '#4A4A6A',
    marginTop: 6,
    paddingHorizontal: 16,
  },
  buttonBlock: {
    alignItems: 'center',
    marginTop: 14,
  },
  button: {
    backgroundColor: '#6C63FF',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  link: {
    marginTop: 12,
  },
  linkText: {
    color: '#6C63FF',
    textAlign: 'center',
  },
  studentWrap: {
    marginTop: 4,
  },
});
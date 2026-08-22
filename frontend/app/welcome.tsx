import { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
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

function FeatureCard({ icon, title, subtitle, style, delay }) {
  return (
    <Animated.View entering={FadeIn.delay(delay).duration(600)} style={[styles.featureCard, style]}>
      <ThemedText style={styles.featureIcon}>{icon}</ThemedText>
      <View>
        <ThemedText style={styles.featureTitle}>{title}</ThemedText>
        <ThemedText style={styles.featureSubtitle}>{subtitle}</ThemedText>
      </View>
    </Animated.View>
  );
}

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

  return (
    <ThemedView style={styles.container}>
      {/* Sky + skyline background */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} viewBox="0 0 400 850" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#C7D9FF" />
            <Stop offset="0.5" stopColor="#D9CEFF" />
            <Stop offset="1" stopColor="#EDE7FF" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="400" height="850" fill="url(#skyGradient)" />

        {/* dashed flight path */}
        <Path
          d="M40 250 Q 120 200, 160 280 T 300 380 T 340 500"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeDasharray="6,10"
          fill="none"
          opacity="0.7"
        />
        <Circle cx="90" cy="470" r="5" fill="#F4B740" opacity="0.9" />
        <Circle cx="340" cy="500" r="5" fill="#6C63FF" opacity="0.9" />

        {/* Statue of Liberty silhouette, bottom left */}
        <Path
          d="M55 780 L55 690 L60 685 L60 660 L52 655 L52 645 L58 640 L58 620
             L50 610 L66 610 L58 620 L58 640 L64 645 L64 655 L56 660 L56 685 L61 690
             L61 780 Z
             M40 780 L76 780 L76 800 L40 800 Z"
          fill="#8FA7D6"
          opacity="0.85"
        />
        <Path d="M58 605 L58 585 M50 597 L66 597" stroke="#8FA7D6" strokeWidth="3" strokeLinecap="round" opacity="0.85" />

        {/* City skyline */}
        <Rect x="0" y="770" width="400" height="80" fill="#7C6FE0" opacity="0.5" />
        <Rect x="90" y="700" width="26" height="150" fill="#6C63FF" opacity="0.55" />
        <Rect x="120" y="730" width="20" height="120" fill="#6C63FF" opacity="0.45" />
        <Rect x="250" y="710" width="30" height="140" fill="#6C63FF" opacity="0.55" />
        <Rect x="285" y="740" width="22" height="110" fill="#6C63FF" opacity="0.45" />
        <Rect x="320" y="690" width="24" height="160" fill="#6C63FF" opacity="0.6" />
        <Path d="M330 690 L332 675 L336 690 Z" fill="#6C63FF" opacity="0.6" />
      </Svg>

      {/* floating plane top */}
      <Animated.View style={[styles.plane, planeStyle]}>
        <Svg width="46" height="46" viewBox="0 0 24 24">
          <Path
            d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2.5 1.5V22l4-1 4 1v-1.5L13 19v-6.5l8 2.5z"
            fill="#FFFFFF"
          />
        </Svg>
      </Animated.View>

      {/* logo + wordmark */}
      <Animated.View style={glowStyle}>
        <ArrivoLogo size={90} />
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

      <Animated.View entering={FadeIn.delay(1500).duration(600)}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/intro')}>
          <ThemedText style={styles.buttonText}>Get Started  →</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/login')} style={styles.link}>
          <ThemedText style={styles.linkText}>Already have an account? Log in</ThemedText>
        </TouchableOpacity>
      </Animated.View>

      {/* floating feature cards */}
      <FeatureCard icon="🎓" title="F-1 Student" subtitle="Stay Compliant" style={styles.cardTopLeft} delay={1800} />
      <FeatureCard icon="🔔" title="Get Important" subtitle="Updates" style={styles.cardTopRight} delay={1950} />
      <FeatureCard icon="📅" title="Track OPT" subtitle="Deadlines" style={styles.cardBottomLeft} delay={2100} />
      <FeatureCard icon="✅" title="Achieve Your" subtitle="Goals" style={styles.cardBottomRight} delay={2250} />

      {/* student silhouette, bottom center */}
      <View style={styles.studentWrap} pointerEvents="none">
        <Svg width="70" height="120" viewBox="0 0 70 120">
          <Circle cx="35" cy="18" r="14" fill="#3D3D5C" />
          <Path d="M15 45 Q35 30 55 45 L58 115 L12 115 Z" fill="#6C63FF" />
          <Rect x="10" y="55" width="14" height="35" rx="4" fill="#3D3D5C" />
        </Svg>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 10,
    backgroundColor: 'transparent',
  },
  plane: {
    position: 'absolute',
    top: 90,
    left: 40,
  },
  nameRow: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    marginTop: 8,
  },
  appNameLetter: {
    fontSize: 36,
    fontFamily: 'Fredoka_700Bold',
    color: '#1A1A2E',
  },
  tagline: {
    fontSize: 18,
    fontFamily: 'Fredoka_600SemiBold',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    color: '#4A4A6A',
    marginBottom: 16,
    marginTop: 8,
    paddingHorizontal: 24,
  },
  button: {
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  link: {
    marginTop: 16,
  },
  linkText: {
    color: '#6C63FF',
    textAlign: 'center',
  },
  featureCard: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    maxWidth: 150,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  featureSubtitle: {
    fontSize: 11,
    color: '#6C63FF',
    fontWeight: '600',
  },
  cardTopLeft: {
    top: 130,
    left: 16,
  },
  cardTopRight: {
    top: 200,
    right: 16,
  },
  cardBottomLeft: {
    bottom: 160,
    left: 16,
  },
  cardBottomRight: {
    bottom: 220,
    right: 16,
  },
  studentWrap: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
  },
});
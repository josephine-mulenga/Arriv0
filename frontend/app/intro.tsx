import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ArrivoLogo } from '@/components/arrivo-logo';

const features = [
  { icon: '📅', text: 'Personalized timeline for your F1 journey' },
  { icon: '💼', text: 'Track CPT & OPT deadlines' },
  { icon: '📰', text: 'Get important immigration updates' },
  { icon: '🤖', text: 'AI guidance tailored to your situation' },
];

export default function IntroScreen() {
  return (
    <View style={styles.root}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} viewBox="0 0 400 850" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="introGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#A9C9FF" />
            <Stop offset="0.4" stopColor="#C3B9FF" />
            <Stop offset="0.75" stopColor="#DCC4FA" />
            <Stop offset="1" stopColor="#F2E6FF" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="400" height="850" fill="url(#introGradient)" />
        <Circle cx="340" cy="120" r="3" fill="#FFFFFF" opacity="0.8" />
        <Circle cx="50" cy="180" r="2.5" fill="#FFFFFF" opacity="0.6" />
        <Circle cx="280" cy="60" r="2" fill="#FFFFFF" opacity="0.7" />
      </Svg>

      <ThemedView style={styles.container}>
        <ArrivoLogo size={64} />

        <ThemedText style={styles.title}>Everything you need, in one place.</ThemedText>

        <ThemedView style={styles.featureList}>
          {features.map((item, index) => (
            <ThemedView key={index} style={styles.featureRow}>
              <ThemedText style={styles.icon}>{item.icon}</ThemedText>
              <ThemedText style={styles.featureText}>{item.text}</ThemedText>
            </ThemedView>
          ))}
        </ThemedView>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/signup')}>
          <ThemedText style={styles.buttonText}>Next  →</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/signup')} style={styles.link}>
          <ThemedText style={styles.linkText}>Skip</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 26,
    fontFamily: 'Fredoka_700Bold',
    color: '#1A1A2E',
    marginTop: 20,
    marginBottom: 20,
  },
  featureList: {
    gap: 20,
    marginBottom: 32,
    backgroundColor: 'transparent',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 12,
    borderRadius: 14,
  },
  icon: {
    fontSize: 24,
  },
  featureText: {
    flex: 1,
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 15,
    color: '#1A1A2E',
  },
  button: {
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'Fredoka_600SemiBold',
  },
  link: {
    alignItems: 'center',
    marginTop: 12,
  },
  linkText: {
    color: '#6C63FF',
    fontFamily: 'Fredoka_600SemiBold',
  },
});

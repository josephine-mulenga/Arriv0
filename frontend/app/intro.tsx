import { StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const features = [
  { icon: '📅', text: 'Personalized timeline for your F1 journey' },
  { icon: '💼', text: 'Track CPT & OPT deadlines' },
  { icon: '📰', text: 'Get important immigration updates' },
  { icon: '🤖', text: 'AI guidance tailored to your situation' },
];

export default function IntroScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Everything you need, in one place.</ThemedText>

      <ThemedView style={styles.featureList}>
        {features.map((item, index) => (
          <ThemedView key={index} style={styles.featureRow}>
            <ThemedText style={styles.icon}>{item.icon}</ThemedText>
            <ThemedText style={styles.featureText}>{item.text}</ThemedText>
          </ThemedView>
        ))}
      </ThemedView>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/signup')}>
        <ThemedText style={styles.buttonText}>Next</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/signup')} style={styles.link}>
        <ThemedText style={styles.linkText}>Skip</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    marginBottom: 24,
  },
  featureList: {
    gap: 20,
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  icon: {
    fontSize: 24,
  },
  featureText: {
    flex: 1,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  link: {
    alignItems: 'center',
    marginTop: 12,
  },
  linkText: {
    color: '#888',
  },
});
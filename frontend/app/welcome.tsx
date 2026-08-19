import { StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function WelcomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.logoCircle}>
        <ThemedText style={styles.logoLetter}>A</ThemedText>
      </ThemedView>

      <ThemedText type="title" style={styles.appName}>Arriv0</ThemedText>
      <ThemedText style={styles.tagline}>Your journey. Your guide.</ThemedText>
      <ThemedText style={styles.description}>
        Helping international students in the U.S. stay on track from day one to OPT.
      </ThemedText>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/intro')}>
        <ThemedText style={styles.buttonText}>Get Started</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/login')} style={styles.link}>
        <ThemedText style={styles.linkText}>Already have an account? Log in</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoLetter: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
  },
  appName: {
    fontSize: 32,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C63FF',
  },
  description: {
    textAlign: 'center',
    color: '#888',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  button: {
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 8,
    marginTop: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  link: {
    marginTop: 16,
  },
  linkText: {
    color: '#6C63FF',
  },
});

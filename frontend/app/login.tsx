import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { router, Link } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientHeaderBackground } from '@/components/gradient-header-background';
import { useAuth } from '@/AuthContext';

export default function LoginScreen() {
  const { login, loading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err) {
      // error is already captured by useAuth's error state
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={{ height: 100 }}>
        <GradientHeaderBackground />
      </View>

      <ThemedView style={styles.content}>
        <ThemedText style={styles.title}>Log in</ThemedText>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          <ThemedText style={styles.buttonText}>{loading ? 'Logging in...' : 'Log in'}</ThemedText>
        </TouchableOpacity>

        <Link href="/signup" style={styles.link}>
          <ThemedText>Don't have an account? Sign up</ThemedText>
        </Link>

        <Link href="/reset-password" style={styles.link}>
          <ThemedText>Forgot your password?</ThemedText>
        </Link>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 28,
    color: '#1A1A2E',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
  },
  button: {
    backgroundColor: '#6C63FF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
  },
  link: {
    marginTop: 12,
    alignSelf: 'center',
  },
});
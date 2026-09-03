import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { resetPassword } from '@/api';

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleReset = async () => {
    try {
      setLoading(true);
      setError(null);
      await resetPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
      <ThemedView style={styles.container}>
      <ThemedText type="title">Reset your password</ThemedText>

      {submitted ? (
        <ThemedText style={styles.successText}>
          If an account exists for {email}, we&apos;ve sent instructions to reset your password.
        </ThemedText>
      ) : (
        <>
          <ThemedText>Enter your email and we&apos;ll send you a link to reset your password.</ThemedText>

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />

          {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}

          <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
            <ThemedText style={styles.buttonText}>{loading ? 'Sending...' : 'Send reset link'}</ThemedText>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity onPress={() => router.push('/login')} style={styles.link}>
        <ThemedText>Back to log in</ThemedText>
      </TouchableOpacity>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
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
  successText: {
    textAlign: 'center',
  },
  link: {
    marginTop: 12,
    alignSelf: 'center',
  },
});
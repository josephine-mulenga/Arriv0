import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { EnvelopeSimpleIcon } from 'phosphor-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { DismissKeyboardView } from '@/components/ui/dismiss-keyboard-view';
import { Palette, Radius, Type } from '@/constants/theme';
import { resetPassword } from '@/api';

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    try {
      setLoading(true);
      setError(null);
      // Linking.createURL('reset-password-confirm') resolves correctly
      // against window.location.origin when tested directly, but the
      // actual email link was still landing on the bare domain - hardcode
      // the known-good absolute URL for web instead of depending on that
      // resolution happening correctly in every deployed context. Native
      // keeps its deep link, since https://arriv0.com wouldn't reopen the
      // app there.
      const redirectTo =
        Platform.OS === 'web' ? 'https://arriv0.com/reset-password-confirm' : Linking.createURL('reset-password-confirm');
      await resetPassword(email, redirectTo);
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
      <DismissKeyboardView>
      <View style={styles.content}>
        <Text style={styles.title}>Reset your password</Text>

        {submitted ? (
          <Text style={styles.successText}>
            If an account exists for {email}, we've sent instructions to reset your password.
          </Text>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you a link to reset your password.
            </Text>

            <View style={styles.inputRow}>
              <EnvelopeSimpleIcon size={17} color="#A9A7BE" />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Palette.inkPlaceholder}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <PrimaryButton
              label={loading ? 'Sending...' : 'Send reset link'}
              onPress={handleReset}
              disabled={loading || !email.trim()}
              style={styles.submitButton}
            />
          </>
        )}

        <Text style={styles.link} onPress={() => router.push('/login')}>
          Back to log in
        </Text>
      </View>
      </DismissKeyboardView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 26,
    gap: 11,
  },
  title: {
    fontFamily: Type.headingBold,
    fontSize: 28,
    color: Palette.ink,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    color: Palette.inkFaint,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Palette.borderInput,
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.input,
    paddingHorizontal: 14,
    height: 50,
  },
  input: {
    flex: 1,
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    color: Palette.ink,
  },
  errorText: {
    fontFamily: Type.bodyRegular,
    fontSize: 13,
    color: Palette.danger,
  },
  successText: {
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: Palette.inkBody,
  },
  submitButton: {
    marginTop: 8,
  },
  link: {
    marginTop: 18,
    alignSelf: 'center',
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    color: Palette.inkFaint,
  },
});

import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, Link, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { EnvelopeSimpleIcon, LockSimpleIcon } from 'phosphor-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { SocialLoginRow } from '@/components/ui/social-login-row';
import { DismissKeyboardView } from '@/components/ui/dismiss-keyboard-view';
import { ArrivoLogo } from '@/components/arrivo-logo';
import { Palette, Type } from '@/constants/theme';
import { useAuth } from '@/AuthContext';
import { resendConfirmation } from '@/api';
import { signInWithProvider, type SocialProvider } from '@/utils/socialAuth';

export default function LoginScreen() {
  const { login, loading, error } = useAuth();
  const { sessionExpired } = useLocalSearchParams<{ sessionExpired?: string }>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resent, setResent] = useState(false);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);

  // AuthContext maps most Supabase auth errors to plain copy already, but
  // this collapses everything else it might ever produce (a future
  // Supabase wording change, a stray technical detail) down to one fixed,
  // safe line too — the only two messages that ever reach the screen are
  // this generic one, or one of the two genuinely different, actionable
  // cases below. Never the backend's or Supabase's raw text.
  const needsConfirmation = !!error && error.toLowerCase().includes('confirm your email');
  const isNetworkError = !!error && error.toLowerCase().includes('check your internet');
  const displayError = !error
    ? undefined
    : needsConfirmation || isNetworkError
      ? error
      : 'Email or password is incorrect. Please try again.';

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleLogin = async () => {
    setResent(false);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch {
      // error is already captured by useAuth's error state
    }
  };

  const handleResend = async () => {
    try {
      await resendConfirmation(email.trim());
      setResent(true);
    } catch {
      // best-effort; the link stays available to retry
    }
  };

  const handleSocial = async (provider: SocialProvider) => {
    setSocialError(null);
    setSocialLoading(provider);
    try {
      await signInWithProvider(provider);
    } catch {
      setSocialError('Could not sign in. Please try again or use your email.');
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}>
      <DismissKeyboardView>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(420)}>
          <View style={styles.logoBlock}>
            <ArrivoLogo size={76} />
            <Text style={styles.tagline}>Your immigration journey starts here</Text>
          </View>

          <Text style={styles.title}>Log in</Text>

          {sessionExpired ? (
            <Text style={styles.noticeText}>Your session expired. Please log in again.</Text>
          ) : null}

          <TextField
            icon={EnvelopeSimpleIcon}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            containerStyle={styles.fieldGroup}
          />

          <TextField
            icon={LockSimpleIcon}
            isPassword
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            autoComplete="password"
            error={displayError}
            containerStyle={styles.fieldGroup}
          />

          {needsConfirmation && !resent && (
            <Pressable onPress={handleResend} style={styles.resendLink}>
              <Text style={styles.linkText}>
                <Text style={styles.linkTextStrong}>Resend confirmation email</Text>
              </Text>
            </Pressable>
          )}
          {resent && <Text style={styles.successText}>Confirmation email resent.</Text>}

          <Link href="/reset-password" style={styles.forgotLink}>
            <Text style={styles.linkText}>Forgot your password?</Text>
          </Link>

          <PrimaryButton
            label="Log in"
            onPress={handleLogin}
            loading={loading}
            disabled={!canSubmit}
            style={styles.submitButton}
          />

          <SocialLoginRow
            onGoogle={() => handleSocial('google')}
            onApple={() => handleSocial('apple')}
            onMicrosoft={() => handleSocial('azure')}
          />
          {socialLoading ? <Text style={styles.socialStatusText}>Connecting...</Text> : null}
          {socialError ? <Text style={styles.socialErrorText}>{socialError}</Text> : null}

          <Link href="/signup" style={styles.link}>
            <Text style={styles.linkText}>
              Don&apos;t have an account? <Text style={styles.linkTextStrong}>Sign up</Text>
            </Text>
          </Link>
        </Animated.View>
      </ScrollView>
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: 28,
    paddingBottom: 40,
  },
  logoBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  tagline: {
    marginTop: 14,
    fontFamily: Type.bodyRegular,
    fontSize: 14.5,
    color: Palette.inkFaint,
    textAlign: 'center',
  },
  title: {
    fontFamily: Type.headingBold,
    fontSize: 24,
    color: Palette.ink,
    marginBottom: 18,
  },
  fieldGroup: {
    marginBottom: 4,
  },
  noticeText: {
    fontFamily: Type.bodyRegular,
    fontSize: 13,
    color: Palette.inkMuted,
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  resendLink: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: 2,
    marginBottom: 6,
  },
  successText: {
    fontFamily: Type.bodyRegular,
    fontSize: 13,
    color: Palette.green,
    marginTop: 2,
  },
  submitButton: {
    marginTop: 14,
  },
  socialStatusText: {
    marginTop: 10,
    textAlign: 'center',
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.inkFaint,
  },
  socialErrorText: {
    marginTop: 10,
    textAlign: 'center',
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.danger,
  },
  link: {
    marginTop: 22,
    alignSelf: 'center',
  },
  linkText: {
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    color: Palette.inkFaint,
  },
  linkTextStrong: {
    fontFamily: Type.bodyBold,
    color: Palette.purple,
  },
});

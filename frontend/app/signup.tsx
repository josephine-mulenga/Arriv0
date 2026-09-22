import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, Link } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { CaretLeftIcon, UserIcon, EnvelopeSimpleIcon, LockSimpleIcon } from 'phosphor-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { SocialLoginRow } from '@/components/ui/social-login-row';
import { AnimatedCheck } from '@/components/ui/animated-check';
import { SignupProgress } from '@/components/ui/signup-progress';
import { DismissKeyboardView } from '@/components/ui/dismiss-keyboard-view';
import { ArrivoLogo } from '@/components/arrivo-logo';
import { Palette, Type } from '@/constants/theme';
import { setPendingPassword } from '@/utils/signupDraft';
import { signInWithProvider, type SocialProvider } from '@/utils/socialAuth';

// Mirrors the backend's password_must_be_strong validator (backend/main.py) exactly —
// the design spec shows only the first three rows, but the API rejects a password
// missing a special character, so that check has to surface here too or signup fails
// one screen later with no way for the user to see why.
const passwordRules = [
  { label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
  { label: 'One uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: 'One number', test: (pw: string) => /[0-9]/.test(pw) },
  { label: 'One special character', test: (pw: string) => /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(pw) },
];

// Requires a proper extension (.com, .edu, .org, ...) — not just "any text with an @".
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);

  const emailTouched = email.trim().length > 0;
  const isEmailValid = EMAIL_PATTERN.test(email.trim());
  const isPasswordValid = passwordRules.every((rule) => rule.test(password));
  const confirmTouched = confirmPassword.length > 0;
  const passwordsMatch = confirmPassword === password;
  const canContinue = name.trim().length > 0 && isEmailValid && isPasswordValid && confirmTouched && passwordsMatch;

  const handleContinue = () => {
    if (!canContinue || submitting) return;
    setSubmitting(true);
    setPendingPassword(password);
    router.push({
      pathname: '/academic-profile',
      params: { name, email },
    });
  };

  const handleSocial = async (provider: SocialProvider) => {
    setSocialError(null);
    setSocialLoading(provider);
    try {
      await signInWithProvider(provider);
    } catch {
      setSocialError('Could not sign up. Please try again or use your email.');
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}>
      <View style={styles.topRow}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <CaretLeftIcon size={18} color={Palette.ink} weight="bold" />
        </Pressable>
        <SignupProgress step={1} style={{ flex: 1 }} />
      </View>

      <DismissKeyboardView>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeIn.duration(420)}>
          <View style={styles.logoBlock}>
            <ArrivoLogo size={64} />
          </View>

          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Let&apos;s get you started.</Text>

          <TextField
            icon={UserIcon}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            containerStyle={styles.fieldGroup}
          />

          <TextField
            icon={EnvelopeSimpleIcon}
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            error={emailTouched && !isEmailValid ? 'Enter a valid email address, like you@example.com' : undefined}
            containerStyle={styles.fieldGroup}
          />

          <TextField
            icon={LockSimpleIcon}
            isPassword
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            autoComplete="new-password"
            containerStyle={styles.fieldGroup}
          />

          <TextField
            icon={LockSimpleIcon}
            isPassword
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoComplete="new-password"
            error={confirmTouched && !passwordsMatch ? "Passwords don't match" : undefined}
            containerStyle={styles.fieldGroup}
          />

          <View style={styles.checklist}>
            {passwordRules.map((rule) => {
              const passed = rule.test(password);
              return (
                <View key={rule.label} style={styles.checklistRow}>
                  <AnimatedCheck done={passed} size={15} />
                  <Text style={[styles.checklistText, passed && styles.checklistTextPassed]}>{rule.label}</Text>
                </View>
              );
            })}
          </View>

          <PrimaryButton
            label="Sign Up"
            onPress={handleContinue}
            loading={submitting}
            disabled={!canContinue}
            style={styles.submitButton}
          />

          <SocialLoginRow
            onGoogle={() => handleSocial('google')}
            onApple={() => handleSocial('apple')}
            onMicrosoft={() => handleSocial('azure')}
          />
          {socialLoading ? <Text style={styles.socialStatusText}>Connecting...</Text> : null}
          {socialError ? <Text style={styles.socialErrorText}>{socialError}</Text> : null}

          <Link href="/login" style={styles.link}>
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkTextStrong}>Log in</Text>
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
    paddingTop: 62,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: Palette.dividerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 26,
    paddingTop: 10,
  },
  logoBlock: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: Type.headingBold,
    fontSize: 26,
    textAlign: 'center',
    color: Palette.ink,
  },
  subtitle: {
    marginTop: 6,
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    textAlign: 'center',
    color: Palette.inkFaint,
    marginBottom: 22,
  },
  fieldGroup: {
    marginBottom: 4,
  },
  checklist: {
    gap: 7,
    marginTop: 6,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checklistText: {
    fontFamily: Type.bodyRegular,
    fontSize: 13,
    color: Palette.inkMuted,
  },
  checklistTextPassed: {
    color: Palette.green,
    fontFamily: Type.bodySemiBold,
  },
  submitButton: {
    marginTop: 6,
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
    marginTop: 20,
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

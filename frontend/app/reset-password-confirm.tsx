import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LockSimpleIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon } from 'phosphor-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Palette, Radius, Type } from '@/constants/theme';
import { supabase } from '@/supabase';

// Mirrors the backend's password_must_be_strong validator (backend/main.py)
// for consistent UX — this submission goes straight to Supabase, not
// through our backend, so this is the only place that check runs for it.
const passwordRules = [
  { label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
  { label: 'One uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: 'One number', test: (pw: string) => /[0-9]/.test(pw) },
  { label: 'One special character', test: (pw: string) => /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(pw) },
];

export default function ResetPasswordConfirmScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [checking, setChecking] = useState(true);
  const [linkValid, setLinkValid] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      // Web: supabase-js already parsed the recovery link into a session
      // on load (detectSessionInUrl). Native: it never auto-detects, so
      // exchange the code this route received as a param ourselves.
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setLinkValid(true);
        setChecking(false);
        return;
      }
      if (code && typeof code === 'string') {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        setLinkValid(!exchangeError);
      }
      setChecking(false);
    })();
  }, [code]);

  const isPasswordValid = passwordRules.every((rule) => rule.test(password));
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmit = isPasswordValid && passwordsMatch;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      // This page is opened in whatever browser handles email links, not
      // the app itself — logging into a web session here and dropping the
      // user into the web app isn't the goal. Just confirm the change and
      // send them back to the app to log in there.
      await supabase.auth.signOut();
      setDone(true);
    } catch (err: any) {
      setError(err?.message || 'Could not update your password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Palette.purple} />
      </View>
    );
  }

  if (!linkValid) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>This link has expired</Text>
        <Text style={styles.subtitle}>Request a new password reset link and try again.</Text>
        <PrimaryButton
          label="Back to reset password"
          onPress={() => router.replace('/reset-password')}
          style={styles.submitButton}
        />
      </View>
    );
  }

  if (done) {
    return (
      <View style={styles.centered}>
        <CheckCircleIcon size={48} color={Palette.green} weight="fill" />
        <Text style={styles.title}>Password changed</Text>
        <Text style={styles.subtitle}>Your password has been changed. Go back to the app and log in.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
      <View style={styles.content}>
        <Text style={styles.title}>Set a new password</Text>
        <Text style={styles.subtitle}>Choose a new password for your account.</Text>

        <View style={styles.inputRow}>
          <LockSimpleIcon size={17} color="#A9A7BE" />
          <TextInput
            style={styles.input}
            placeholder="New password"
            placeholderTextColor={Palette.inkPlaceholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
            {showPassword ? (
              <EyeSlashIcon size={17} color="#A9A7BE" />
            ) : (
              <EyeIcon size={17} color="#A9A7BE" />
            )}
          </Pressable>
        </View>

        <View style={styles.inputRow}>
          <LockSimpleIcon size={17} color="#A9A7BE" />
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            placeholderTextColor={Palette.inkPlaceholder}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />
          <Pressable onPress={() => setShowConfirmPassword((v) => !v)} hitSlop={8}>
            {showConfirmPassword ? (
              <EyeSlashIcon size={17} color="#A9A7BE" />
            ) : (
              <EyeIcon size={17} color="#A9A7BE" />
            )}
          </Pressable>
        </View>
        {confirmPassword.length > 0 && !passwordsMatch && (
          <Text style={styles.fieldError}>Passwords don&apos;t match</Text>
        )}

        <View style={styles.checklist}>
          {passwordRules.map((rule) => (
            <Text
              key={rule.label}
              style={[styles.checklistText, rule.test(password) && styles.checklistTextPassed]}>
              • {rule.label}
            </Text>
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PrimaryButton
          label={loading ? 'Updating...' : 'Update password'}
          onPress={handleSubmit}
          disabled={!canSubmit || loading}
          style={styles.submitButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.white,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 26,
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
    fontSize: 24,
    textAlign: 'center',
    color: Palette.ink,
  },
  subtitle: {
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    textAlign: 'center',
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
  fieldError: {
    marginTop: -4,
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.danger,
  },
  checklist: {
    gap: 4,
    marginTop: 2,
  },
  checklistText: {
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.inkFaint,
  },
  checklistTextPassed: {
    color: Palette.green,
  },
  errorText: {
    fontFamily: Type.bodyRegular,
    fontSize: 13,
    color: Palette.danger,
  },
  submitButton: {
    marginTop: 8,
  },
});

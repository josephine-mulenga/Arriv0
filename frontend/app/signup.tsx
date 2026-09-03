import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, Link } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  CaretLeftIcon,
  UserIcon,
  EnvelopeSimpleIcon,
  LockSimpleIcon,
  EyeIcon,
  EyeSlashIcon,
} from 'phosphor-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { AnimatedCheck } from '@/components/ui/animated-check';
import { Palette, Radius, Type } from '@/constants/theme';

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
  const [showPassword, setShowPassword] = useState(false);

  const isEmailValid = EMAIL_PATTERN.test(email.trim());
  const isPasswordValid = passwordRules.every((rule) => rule.test(password));
  const canContinue = name.trim().length > 0 && isEmailValid && isPasswordValid;

  const handleContinue = () => {
    router.push({
      pathname: '/personalize-profile',
      params: { name, email, password },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <CaretLeftIcon size={18} color={Palette.ink} weight="bold" />
      </Pressable>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Let&apos;s get you started.</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(80).duration(350)}>
          <View style={styles.inputRow}>
            <UserIcon size={17} color="#A9A7BE" />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={Palette.inkPlaceholder}
              value={name}
              onChangeText={setName}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(140).duration(350)}>
          <View style={styles.inputRow}>
            <EnvelopeSimpleIcon size={17} color="#A9A7BE" />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor={Palette.inkPlaceholder}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </Animated.View>
        {email.trim().length > 0 && !isEmailValid && (
          <Animated.Text entering={FadeInDown.duration(200)} style={styles.fieldError}>
            Enter a valid email address, like you@example.com
          </Animated.Text>
        )}

        <Animated.View entering={FadeInUp.delay(200).duration(350)}>
          <View style={styles.inputRow}>
            <LockSimpleIcon size={17} color="#A9A7BE" />
            <TextInput
              style={styles.input}
              placeholder="Password"
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
        </Animated.View>

        <View style={styles.checklist}>
          {passwordRules.map((rule, index) => {
            const passed = rule.test(password);
            return (
              <Animated.View
                key={rule.label}
                entering={FadeInUp.delay(240 + index * 40).duration(300)}
                style={styles.checklistRow}>
                <AnimatedCheck done={passed} size={15} />
                <Text style={[styles.checklistText, passed && styles.checklistTextPassed]}>
                  {rule.label}
                </Text>
              </Animated.View>
            );
          })}
        </View>

        <Animated.View entering={FadeInUp.delay(400).duration(350)}>
          <PrimaryButton
            label="Sign Up"
            onPress={handleContinue}
            disabled={!canContinue}
            style={styles.submitButton}
          />

          <Link href="/login" style={styles.link}>
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkTextStrong}>Log in</Text>
            </Text>
          </Link>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.white,
    paddingTop: 62,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: Palette.dividerLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 20,
  },
  content: {
    padding: 26,
    paddingTop: 18,
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
    marginBottom: 24,
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
    marginBottom: 11,
  },
  input: {
    flex: 1,
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    color: Palette.ink,
  },
  fieldError: {
    marginTop: -6,
    marginBottom: 11,
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.danger,
  },
  checklist: {
    gap: 7,
    marginTop: 4,
    marginBottom: 20,
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
    color: Palette.inkMuted,
  },
  submitButton: {
    marginTop: 4,
  },
  link: {
    marginTop: 16,
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

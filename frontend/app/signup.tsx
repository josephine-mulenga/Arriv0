import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import { router, Link } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientHeaderBackground } from '@/components/gradient-header-background';

const passwordRules = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'One number', test: (pw) => /[0-9]/.test(pw) },
  { label: 'One special character', test: (pw) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
  { label: 'No spaces', test: (pw) => pw.length > 0 && !/\s/.test(pw) },
];

function PasswordChecklist({ password }) {
  return (
    <View style={styles.checklist}>
      {passwordRules.map((rule) => {
        const passed = rule.test(password);
        return (
          <View key={rule.label} style={styles.checklistRow}>
            <View style={[styles.checkCircle, passed && styles.checkCirclePassed]}>
              {passed && <ThemedText style={styles.checkMark}>✓</ThemedText>}
            </View>
            <ThemedText style={[styles.checklistText, passed && styles.checklistTextPassed]}>
              {rule.label}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const isPasswordValid = passwordRules.every((rule) => rule.test(password));
  const canContinue = name.trim().length > 0 && email.trim().length > 0 && isPasswordValid;

  const handleContinue = () => {
    router.push({
      pathname: '/personalize-profile',
      params: { name, email, password },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <View style={{ height: 100 }}>
        <GradientHeaderBackground />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <ThemedText style={styles.title}>Create your account</ThemedText>
        <ThemedText style={styles.subtitle}>Let's get you started.</ThemedText>

        <TextInput style={styles.input} placeholder="Full name" value={name} onChangeText={setName} />
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

        <PasswordChecklist password={password} />

        <TouchableOpacity
          style={[styles.button, !canContinue && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}>
          <ThemedText style={styles.buttonText}>Continue</ThemedText>
        </TouchableOpacity>

        <Link href="/login" style={styles.link}>
          <ThemedText>Already have an account? Log in</ThemedText>
        </Link>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 12, paddingBottom: 40 },
  title: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 26,
    color: '#1A1A2E',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  checklist: { gap: 6, marginTop: -4, marginBottom: 4, paddingHorizontal: 4 },
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCirclePassed: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkMark: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  checklistText: {
    fontSize: 13,
    color: '#888',
  },
  checklistTextPassed: {
    color: '#4CAF50',
  },
  button: { backgroundColor: '#6C63FF', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { backgroundColor: '#C4C0F5' },
  buttonText: { color: '#fff', fontWeight: '600' },
  link: { marginTop: 12, alignSelf: 'center' },
});
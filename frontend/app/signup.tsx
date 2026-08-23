import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Linking, View, ScrollView } from 'react-native';
import { router, Link } from 'expo-router';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ArrivoLogo } from '@/components/arrivo-logo';
import { useAuth } from '@/AuthContext';

const cptOptions = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12+'];

export default function SignupScreen() {
  const { signup, login, loading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [visaType, setVisaType] = useState('F1');
  const [programStartDate, setProgramStartDate] = useState('');
  const [programEndDate, setProgramEndDate] = useState('');
  const [major, setMajor] = useState('');
  const [hasSsn, setHasSsn] = useState(false);
  const [hasBankAccount, setHasBankAccount] = useState(false);
  const [cptMonthsUsed, setCptMonthsUsed] = useState('0');

  const handleSignup = async () => {
    try {
      await signup(
        email,
        password,
        name,
        school,
        visaType,
        programStartDate,
        programEndDate,
        major,
        hasSsn,
        hasBankAccount,
        cptMonthsUsed
      );
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err) {
      // error is already captured by useAuth's error state
    }
  };

  return (
    <View style={styles.root}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} viewBox="0 0 400 900" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#A9C9FF" />
            <Stop offset="0.4" stopColor="#C3B9FF" />
            <Stop offset="0.75" stopColor="#DCC4FA" />
            <Stop offset="1" stopColor="#F2E6FF" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="400" height="900" fill="url(#signupGradient)" />
        <Circle cx="340" cy="100" r="3" fill="#FFFFFF" opacity="0.8" />
        <Circle cx="50" cy="160" r="2.5" fill="#FFFFFF" opacity="0.6" />
      </Svg>

      <ScrollView contentContainerStyle={styles.container}>
        <ArrivoLogo size={64} />
        <ThemedText style={styles.title}>Create your account</ThemedText>

        <ThemedView style={styles.card}>
          <TextInput style={styles.input} placeholder="Full name" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="School" value={school} onChangeText={setSchool} />
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
          <TextInput
            style={styles.input}
            placeholder="Program start date (YYYY-MM-DD)"
            value={programStartDate}
            onChangeText={setProgramStartDate}
          />
          <TextInput
            style={styles.input}
            placeholder="Program end date (YYYY-MM-DD)"
            value={programEndDate}
            onChangeText={setProgramEndDate}
          />

          <ThemedText style={styles.label}>What is your major / field of study?</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="e.g. Computer Science, Business Administration"
            value={major}
            onChangeText={setMajor}
          />

          <ThemedText style={styles.label}>Do you have a Social Security Number (SSN)?</ThemedText>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleButton, !hasSsn && styles.toggleButtonActive]}
              onPress={() => setHasSsn(false)}>
              <ThemedText style={[styles.toggleText, !hasSsn && styles.toggleTextActive]}>No</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, hasSsn && styles.toggleButtonActive]}
              onPress={() => setHasSsn(true)}>
              <ThemedText style={[styles.toggleText, hasSsn && styles.toggleTextActive]}>Yes</ThemedText>
            </TouchableOpacity>
          </View>

          <ThemedText style={styles.label}>Do you have a US bank account?</ThemedText>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleButton, !hasBankAccount && styles.toggleButtonActive]}
              onPress={() => setHasBankAccount(false)}>
              <ThemedText style={[styles.toggleText, !hasBankAccount && styles.toggleTextActive]}>No</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, hasBankAccount && styles.toggleButtonActive]}
              onPress={() => setHasBankAccount(true)}>
              <ThemedText style={[styles.toggleText, hasBankAccount && styles.toggleTextActive]}>Yes</ThemedText>
            </TouchableOpacity>
          </View>

          <ThemedText style={styles.label}>How many months of full-time CPT have you used?</ThemedText>
          <ThemedText style={styles.hint}>CPT is curricular practical training / internship work</ThemedText>
          <View style={styles.cptRow}>
            {cptOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.cptChip, cptMonthsUsed === option && styles.cptChipActive]}
                onPress={() => setCptMonthsUsed(option)}>
                <ThemedText style={[styles.cptChipText, cptMonthsUsed === option && styles.cptChipTextActive]}>
                  {option}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}

          <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
            <ThemedText style={styles.buttonText}>{loading ? 'Creating account...' : 'Sign up'}</ThemedText>
          </TouchableOpacity>

          <Link href="/login" style={styles.link}>
            <ThemedText style={styles.linkText}>Already have an account? Log in</ThemedText>
          </Link>

          <ThemedText style={styles.legalText}>
            By signing up, you agree to our{' '}
            <ThemedText
              style={styles.legalLink}
              onPress={() => Linking.openURL('https://www.freeprivacypolicy.com/live/6d431a24-221e-4dfc-aa18-ebd77fc28f93')}>
              Privacy Policy
            </ThemedText>{' '}
            and{' '}
            <ThemedText
              style={styles.legalLink}
              onPress={() => Linking.openURL('https://www.freeprivacypolicy.com/live/994c0a00-5d88-47e1-99a9-1ef79f7be6f8')}>
              Terms of Service
            </ThemedText>
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Fredoka_700Bold',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  label: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 14,
    color: '#1A1A2E',
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: '#888',
    marginTop: -8,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F0EEFF',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#6C63FF',
  },
  toggleText: {
    fontFamily: 'Fredoka_600SemiBold',
    color: '#1A1A2E',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  cptRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cptChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F0EEFF',
  },
  cptChipActive: {
    backgroundColor: '#6C63FF',
  },
  cptChipText: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 13,
    color: '#1A1A2E',
  },
  cptChipTextActive: {
    color: '#FFFFFF',
  },
  button: {
    backgroundColor: '#6C63FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Fredoka_600SemiBold',
  },
  errorText: { color: 'red' },
  link: { marginTop: 12, alignSelf: 'center' },
  linkText: { color: '#6C63FF', fontFamily: 'Fredoka_600SemiBold' },
  legalText: { fontSize: 12, textAlign: 'center', marginTop: 12, color: '#888' },
  legalLink: { fontSize: 12, color: '#6C63FF', textDecorationLine: 'underline' },
});

import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Link, router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/AuthContext';

export default function SignupScreen() {
  const { signup, loading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [visaType, setVisaType] = useState('F1');
  const [yearLevel, setYearLevel] = useState('Freshman');
  const [programEndDate, setProgramEndDate] = useState('');

  const yearLevelMap = { Freshman: 1, Sophomore: 2, Junior: 3, Senior: 4 };

const handleSignup = async () => {
  try {
    await signup(email, password, name, school, visaType, yearLevelMap[yearLevel], programEndDate);
    router.replace('/(tabs)');
  } catch (err) {
    // error is already captured by useAuth's error state
  }
};

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Create your account</ThemedText>

      <TextInput
        style={styles.input}
        placeholder="Full name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="School"
        value={school}
        onChangeText={setSchool}
      />
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
        placeholder="Program end date (YYYY-MM-DD)"
        value={programEndDate}
        onChangeText={setProgramEndDate}
      />

      {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}

      <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
        <ThemedText style={styles.buttonText}>{loading ? 'Creating account...' : 'Sign up'}</ThemedText>
      </TouchableOpacity>

      <Link href="/login" style={styles.link}>
        <ThemedText>Already have an account? Log in</ThemedText>
      </Link>
      
    </ThemedView>
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
});
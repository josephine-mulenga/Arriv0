import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { router, Link } from 'expo-router';
import { EnvelopeSimpleIcon, LockSimpleIcon } from 'phosphor-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Palette, Radius, Type } from '@/constants/theme';
import { useAuth } from '@/AuthContext';

export default function LoginScreen() {
  const { login, loading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch {
      // error is already captured by useAuth's error state
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.title}>Log in</Text>

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

        <View style={styles.inputRow}>
          <LockSimpleIcon size={17} color="#A9A7BE" />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Palette.inkPlaceholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PrimaryButton
          label={loading ? 'Logging in...' : 'Log in'}
          onPress={handleLogin}
          disabled={loading}
          style={styles.submitButton}
        />

        <Link href="/signup" style={styles.link}>
          <Text style={styles.linkText}>Don&apos;t have an account? <Text style={styles.linkTextStrong}>Sign up</Text></Text>
        </Link>

        <Link href="/reset-password" style={styles.link}>
          <Text style={styles.linkText}>Forgot your password?</Text>
        </Link>
      </View>
    </View>
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
  submitButton: {
    marginTop: 8,
  },
  link: {
    marginTop: 12,
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

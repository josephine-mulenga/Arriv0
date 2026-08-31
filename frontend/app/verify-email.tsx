import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { EnvelopeSimpleOpenIcon } from 'phosphor-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { OutlineButton } from '@/components/ui/outline-button';
import { Palette, Type } from '@/constants/theme';
import { resendConfirmation } from '@/api';
import { useAuth } from '@/AuthContext';

export default function VerifyEmailScreen() {
  const { email, password } = useLocalSearchParams<{ email: string; password: string }>();
  const { login, loading, error } = useAuth();
  const [resent, setResent] = useState(false);

  const handleContinue = async () => {
    try {
      await login(email, password);
      router.replace('/notification-permission');
    } catch {
      // useAuth's error state already reflects "please confirm your email"
      // if it's still unconfirmed — the user just needs to click the link first
    }
  };

  const handleResend = async () => {
    try {
      await resendConfirmation(email);
      setResent(true);
    } catch {
      // best-effort; the button stays available to retry
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.iconSquare}>
        <EnvelopeSimpleOpenIcon size={44} color={Palette.purple} weight="fill" />
      </View>

      <Text style={styles.title}>Check your email</Text>
      <Text style={styles.body}>
        We sent a confirmation link to{'\n'}
        <Text style={styles.emailText}>{email}</Text>
        {'\n\n'}Click the link, then come back here to continue.
      </Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {resent ? <Text style={styles.successText}>Confirmation email resent.</Text> : null}

      <View style={styles.spacer} />

      <View style={styles.buttonBlock}>
        <PrimaryButton
          label={loading ? "Checking..." : "I've confirmed — Continue"}
          onPress={handleContinue}
          disabled={loading}
        />
        <OutlineButton label="Resend email" onPress={handleResend} style={styles.resendButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.white,
    alignItems: 'center',
    paddingTop: 120,
    paddingHorizontal: 34,
  },
  iconSquare: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: Palette.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 26,
    fontFamily: Type.headingBold,
    fontSize: 24,
    color: Palette.ink,
  },
  body: {
    marginTop: 14,
    fontFamily: Type.bodyRegular,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    color: Palette.inkMuted,
  },
  emailText: {
    fontFamily: Type.bodyBold,
    color: Palette.ink,
  },
  errorText: {
    marginTop: 16,
    fontFamily: Type.bodyRegular,
    fontSize: 13,
    textAlign: 'center',
    color: Palette.danger,
  },
  successText: {
    marginTop: 16,
    fontFamily: Type.bodyRegular,
    fontSize: 13,
    textAlign: 'center',
    color: Palette.green,
  },
  spacer: {
    flex: 1,
  },
  buttonBlock: {
    width: '100%',
    paddingBottom: 40,
  },
  resendButton: {
    marginTop: 11,
  },
});

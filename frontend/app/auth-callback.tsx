import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircleIcon, WarningCircleIcon } from 'phosphor-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Palette, Type } from '@/constants/theme';
import { supabase } from '@/supabase';
import { useAuth } from '@/AuthContext';

type Status = 'checking' | 'loggedIn' | 'confirmedNoSession' | 'error';

export default function AuthCallbackScreen() {
  const { loginWithToken } = useAuth();
  const { code, error: errorParam, error_description } = useLocalSearchParams<{
    code?: string;
    error?: string;
    error_description?: string;
  }>();
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    (async () => {
      // Supabase's own /auth/v1/verify endpoint already confirmed the email
      // server-side before redirecting here - it only appends an explicit
      // error param when that step itself failed (link already used,
      // expired, etc). A missing session below does NOT mean confirmation
      // failed; it just means this client didn't pick one up.
      if (errorParam) {
        setStatus('error');
        return;
      }

      // Web: supabase-js already parsed the confirmation link into a
      // session on load (detectSessionInUrl). Otherwise: exchange the code
      // this route received as a param ourselves (mirrors
      // reset-password-confirm.tsx's handling of the same kind of link).
      let session = (await supabase.auth.getSession()).data.session;
      if (!session && code && typeof code === 'string') {
        const { data } = await supabase.auth.exchangeCodeForSession(code);
        session = data.session;
      }

      if (!session) {
        setStatus('confirmedNoSession');
        return;
      }

      const { access_token: accessToken, user: sessionUser } = session;
      // AuthContext now sources its session directly from this same
      // Supabase client (persistSession + autoRefreshToken), so this
      // session IS the app's session - signing out here would immediately
      // destroy the login this screen just confirmed. loginWithToken just
      // makes the app's state update right away rather than waiting on
      // AuthContext's onAuthStateChange listener to notice it.
      await loginWithToken(accessToken, sessionUser.id, sessionUser.email);
      setStatus('loggedIn');
      router.replace('/(tabs)');
    })();
  }, [code, errorParam]);

  if (status === 'checking' || status === 'loggedIn') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Palette.purple} />
        <Text style={styles.subtitle}>Confirming your email…</Text>
      </View>
    );
  }

  if (status === 'error') {
    const description =
      typeof error_description === 'string'
        ? decodeURIComponent(error_description.replace(/\+/g, ' '))
        : 'This confirmation link is invalid or has expired.';

    return (
      <View style={styles.centered}>
        <WarningCircleIcon size={48} color={Palette.danger} weight="fill" />
        <Text style={styles.title}>Couldn&apos;t confirm your email</Text>
        <Text style={styles.subtitle}>{description}</Text>
        <PrimaryButton label="Back to log in" onPress={() => router.replace('/login')} style={styles.button} />
      </View>
    );
  }

  // confirmedNoSession — the email is confirmed, this client just didn't
  // come away with a session (e.g. the link was opened in a different
  // browser than the one used to sign up). No button here on purpose - this
  // page is opened in whatever browser handles email links, not the app
  // itself, so a "Log in" button would just open a web login the user isn't
  // meant to use. They need to go back to the native app to log in.
  return (
    <View style={styles.centered}>
      <CheckCircleIcon size={48} color={Palette.green} weight="fill" />
      <Text style={styles.title}>Email Confirmed</Text>
      <Text style={styles.subtitle}>Your email has been confirmed. You can now log in on the app.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 26,
    backgroundColor: Palette.white,
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
  button: {
    marginTop: 8,
  },
});

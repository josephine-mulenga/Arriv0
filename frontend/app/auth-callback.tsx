import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Palette, Type } from '@/constants/theme';
import { useAuth } from '@/AuthContext';
import { supabase } from '@/supabase';
import { finishOAuthSignIn } from '@/utils/oauth';

// Web-only landing spot for the Google/Apple/Microsoft redirect — native
// never navigates here, it catches the redirect directly in
// utils/oauth.ts's openAuthSessionAsync call. On web the whole page
// reloads at this URL with the session encoded in it; supabase-js picks
// that up automatically (detectSessionInUrl) by the time this runs.
export default function AuthCallbackScreen() {
  const { loginWithOAuthSession } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        router.replace('/login?sessionExpired=1');
        return;
      }
      try {
        await finishOAuthSignIn(data.session, loginWithOAuthSession);
      } catch {
        router.replace('/login?sessionExpired=1');
      }
    })();
  }, []);

  return (
    <View style={styles.root}>
      <ActivityIndicator size="large" color={Palette.purple} />
      <Text style={styles.text}>Finishing sign-in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: Palette.white,
  },
  text: {
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    color: Palette.inkFaint,
  },
});

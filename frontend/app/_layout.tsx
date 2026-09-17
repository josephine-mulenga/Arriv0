import { useFonts, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import {
  NunitoSans_400Regular,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
} from '@expo-google-fonts/nunito-sans';
import { DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import 'react-native-reanimated';
import { PostHogProvider } from 'posthog-react-native';

import { AuthProvider } from '@/AuthContext';
import { PreferencesProvider } from '@/PreferencesContext';
import { WebShell } from '@/components/web-shell';
import { supabase } from '@/supabase';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    NunitoSans_400Regular,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
  });

  // A password-reset link is supposed to land on /reset-password-confirm,
  // but Supabase only honors that if the exact URL is in its Redirect URLs
  // allowlist — otherwise it silently falls back to whatever the project's
  // Site URL is set to (often the bare domain, or even /login), and no
  // screen there is expecting a recovery session. Subscribing here instead
  // of on any one screen means it doesn't matter which page the fallback
  // actually lands on — the moment supabase-js parses a recovery session
  // out of the URL, this fires and sends the user to the real reset form.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/reset-password-confirm');
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <Head>
        <title>Arriv0</title>
      </Head>
      <PostHogProvider
        apiKey="phc_kQjqcUwzQm5XNN3WBrRLtLGs6xbdYcTcLaicppDTBdrf"
        options={{ host: 'https://us.i.posthog.com' }}>
        <AuthProvider>
          <PreferencesProvider>
            <ThemeProvider value={DefaultTheme}>
              <WebShell>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="modal" options={{ headerShown: true, presentation: 'modal', title: 'Modal' }} />
                </Stack>
              </WebShell>
              <StatusBar style="dark" />
            </ThemeProvider>
          </PreferencesProvider>
        </AuthProvider>
      </PostHogProvider>
    </View>
  );
}
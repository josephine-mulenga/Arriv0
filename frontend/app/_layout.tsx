import { useFonts, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import {
  NunitoSans_400Regular,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
} from '@expo-google-fonts/nunito-sans';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import 'react-native-reanimated';
import { PostHogProvider } from 'posthog-react-native';

import { AuthProvider } from '@/AuthContext';
import { PreferencesProvider } from '@/PreferencesContext';
import { WebShell } from '@/components/web-shell';

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
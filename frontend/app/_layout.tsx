import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { PostHogProvider } from 'posthog-react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/AuthContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <PostHogProvider
      apiKey="phc_kQjqcUwzQm5XNN3WBrRLtLGs6xbdYcTcLaicppDTBdrf"
      options={{ host: 'https://us.i.posthog.com' }}>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    </PostHogProvider>
  );
}
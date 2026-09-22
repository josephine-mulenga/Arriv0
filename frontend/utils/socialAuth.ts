import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

import { supabase } from '@/supabase';

export type SocialProvider = 'google' | 'apple' | 'azure';

// Routes through the same /auth-callback screen email confirmation and
// password-reset links already use to land a session back in the app -
// this only works once Google/Apple/Microsoft (Azure) are each enabled as
// providers in the Supabase dashboard; the request itself is correct
// either way, but will surface a provider-not-enabled error until then.
export async function signInWithProvider(provider: SocialProvider) {
  const redirectTo =
    Platform.OS === 'web' ? 'https://arriv0.com/auth-callback' : Linking.createURL('auth-callback');
  const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
  if (error) throw error;
}

import { Platform } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/supabase';
import { getUserProfile } from '@/api';

export type SocialProvider = 'google' | 'apple' | 'azure';

// On web, signInWithOAuth navigates the whole page away to the provider and
// back to /auth-callback — there's nothing left to do here, so this
// resolves to null and /auth-callback finishes the login once the browser
// lands back with a session in the URL.
//
// On native there's no page to redirect — a system browser sheet opens,
// completes against the provider, and redirects to our custom URL scheme,
// which WebBrowser.openAuthSessionAsync catches directly and hands back to
// this function to finish (exchange the code for a session) without ever
// navigating away from the app.
export async function signInWithProvider(provider: SocialProvider): Promise<Session | null> {
  const redirectTo = Linking.createURL('auth-callback');

  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) throw error;
    return null;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('Could not start sign-in.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') {
    throw new Error('Sign-in was cancelled.');
  }

  const { queryParams } = Linking.parse(result.url);
  const code = queryParams?.code;
  if (!code || typeof code !== 'string') {
    throw new Error('Sign-in did not return a valid code.');
  }

  const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
  return sessionData.session;
}

export const SOCIAL_PROVIDER_LABELS: Record<SocialProvider, string> = {
  google: 'Google',
  apple: 'Apple',
  azure: 'Microsoft',
};

// Shared by the login/signup button handlers (native) and /auth-callback
// (web): stores the new Supabase session in AuthContext, then routes to
// Home if a profile row already exists for this user, or to the
// OAuth-specific onboarding form if this is their first time in.
export async function finishOAuthSignIn(
  session: Session,
  loginWithOAuthSession: (session: Session) => Promise<void>
) {
  await loginWithOAuthSession(session);
  try {
    await getUserProfile(session.user.id, session.access_token);
    router.replace('/(tabs)');
  } catch (err: any) {
    if (err?.status === 404) {
      const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
      router.replace({ pathname: '/oauth-complete-profile', params: { name } });
    } else {
      throw err;
    }
  }
}

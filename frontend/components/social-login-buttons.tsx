import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { GoogleLogoIcon, AppleLogoIcon, WindowsLogoIcon, type Icon } from 'phosphor-react-native';

import { Palette, Radius, Type } from '@/constants/theme';
import { useAuth } from '@/AuthContext';
import { signInWithProvider, finishOAuthSignIn, SOCIAL_PROVIDER_LABELS, type SocialProvider } from '@/utils/oauth';

const providers: { key: SocialProvider; Icon: Icon }[] = [
  { key: 'google', Icon: GoogleLogoIcon },
  { key: 'apple', Icon: AppleLogoIcon },
  { key: 'azure', Icon: WindowsLogoIcon },
];

export function SocialLoginButtons() {
  const { loginWithOAuthSession } = useAuth();
  const [pending, setPending] = useState<SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePress = async (provider: SocialProvider) => {
    setError(null);
    setPending(provider);
    try {
      const session = await signInWithProvider(provider);
      // On web, signInWithOAuth navigates the page away — there's nothing
      // left to finish here, /auth-callback picks it up on the way back.
      if (session) {
        await finishOAuthSignIn(session, loginWithOAuthSession);
      }
    } catch (err: any) {
      setError(err?.message || 'Sign-in failed. Please try again.');
      setPending(null);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.buttonRow}>
        {providers.map(({ key, Icon: ProviderIcon }) => (
          <Pressable
            key={key}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={() => handlePress(key)}
            disabled={pending !== null}
            accessibilityLabel={`Continue with ${SOCIAL_PROVIDER_LABELS[key]}`}>
            {pending === key ? (
              <ActivityIndicator size="small" color={Palette.ink} />
            ) : (
              <ProviderIcon size={20} color={Palette.ink} />
            )}
          </Pressable>
        ))}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: 18,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Palette.divider,
  },
  dividerText: {
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.inkFaint,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: Palette.borderInput,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: Palette.surfaceSubtle,
  },
  errorText: {
    marginTop: 10,
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.danger,
    textAlign: 'center',
  },
});

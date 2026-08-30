import { useState, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Chip } from '@/components/ui/chip';
import { Palette, Radius, Type } from '@/constants/theme';
import { useAuth } from '@/AuthContext';
import { updateNotificationSettings, getTimezones } from '@/api';

export default function NotificationSettingsScreen() {
  const { user, token } = useAuth();

  const [notificationTime, setNotificationTime] = useState('09:00');
  const [timezone, setTimezone] = useState('America/New_York');
  const [timezones, setTimezones] = useState<{ label: string; value: string }[]>([]);
  const [timezonesLoading, setTimezonesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTimezones = async () => {
      try {
        const data = await getTimezones(token);
        setTimezones(data.timezones ?? []);
      } catch {
        // fall back to the default timezone if the list can't load
      } finally {
        setTimezonesLoading(false);
      }
    };
    fetchTimezones();
  }, [token]);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSaved(false);
      await updateNotificationSettings(user.id, notificationTime, timezone, token);
      setSaved(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <CaretLeftIcon size={20} color={Palette.ink} weight="bold" />
        </Pressable>
        <Text style={styles.title}>Notification settings</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.bodyText}>Choose when you&apos;d like to receive your daily status update.</Text>

        <Text style={styles.label}>Time (24hr, HH:MM)</Text>
        <TextInput
          style={styles.input}
          placeholder="09:00"
          placeholderTextColor={Palette.inkPlaceholder}
          value={notificationTime}
          onChangeText={setNotificationTime}
        />

        <Text style={styles.label}>Timezone</Text>
        {timezonesLoading ? (
          <Text style={styles.bodyText}>Loading timezones...</Text>
        ) : (
          <View style={styles.timezoneRow}>
            {timezones.map((tz) => (
              <Chip
                key={tz.value}
                label={tz.label}
                selected={timezone === tz.value}
                onPress={() => setTimezone(tz.value)}
              />
            ))}
          </View>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {saved ? <Text style={styles.successText}>Saved!</Text> : null}

        <PrimaryButton
          label={loading ? 'Saving...' : 'Save'}
          onPress={handleSave}
          disabled={loading}
          style={styles.submitButton}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 62,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontFamily: Type.headingBold,
    fontSize: 20,
    color: Palette.ink,
  },
  content: { padding: 26, paddingTop: 0, gap: 12 },
  bodyText: {
    fontFamily: Type.bodyRegular,
    fontSize: 13.5,
    color: Palette.inkMuted,
  },
  label: {
    fontFamily: Type.bodyBold,
    fontSize: 12.5,
    color: Palette.inkMuted,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Palette.borderInput,
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.input,
    paddingHorizontal: 14,
    height: 48,
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    color: Palette.ink,
  },
  timezoneRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  errorText: { fontFamily: Type.bodyRegular, color: Palette.danger, fontSize: 13 },
  successText: { fontFamily: Type.bodyRegular, color: Palette.green, fontSize: 13 },
  submitButton: { marginTop: 8 },
});

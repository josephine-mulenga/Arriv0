import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/AuthContext';
import { updateNotificationSettings } from '@/api';

const timezones = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'];

export default function NotificationSettingsScreen() {
  const { user, token } = useAuth();

  const [notificationTime, setNotificationTime] = useState('09:00');
  const [timezone, setTimezone] = useState('America/New_York');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSaved(false);
      await updateNotificationSettings(user.id, notificationTime, timezone, token);
      setSaved(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <ThemedText style={styles.backButton}>← Back</ThemedText>
      </TouchableOpacity>

      <ThemedText type="title">Notification settings</ThemedText>
      <ThemedText>Choose when you'd like to receive your daily status update.</ThemedText>

      <ThemedText style={styles.label}>Time (24hr, HH:MM)</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="09:00"
        value={notificationTime}
        onChangeText={setNotificationTime}
      />

      <ThemedText style={styles.label}>Timezone</ThemedText>
      <ThemedView style={styles.timezoneRow}>
        {timezones.map((tz) => (
          <TouchableOpacity
            key={tz}
            onPress={() => setTimezone(tz)}
            style={[styles.tzButton, timezone === tz && styles.tzButtonActive]}>
            <ThemedText style={timezone === tz && styles.tzTextActive}>
              {tz.split('/')[1].replace('_', ' ')}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ThemedView>

      {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
      {saved && <ThemedText style={styles.successText}>Saved!</ThemedText>}

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
        <ThemedText style={styles.buttonText}>{loading ? 'Saving...' : 'Save'}</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 50,
    gap: 12,
  },
  backButton: {
    color: '#6C63FF',
    fontWeight: '600',
    marginBottom: 8,
  },
  label: {
    fontWeight: '600',
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
  },
  timezoneRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tzButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F7',
  },
  tzButtonActive: {
    backgroundColor: '#6C63FF',
  },
  tzTextActive: {
    color: '#FFFFFF',
  },
  button: {
    backgroundColor: '#6C63FF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
  },
  successText: {
    color: 'green',
  },
});
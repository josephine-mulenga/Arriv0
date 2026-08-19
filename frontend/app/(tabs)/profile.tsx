import { StyleSheet, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';

import { getUserProfile } from '@/api';
import { useAuth } from '@/AuthContext';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile(user.id, token);
        setProfileData(data);
      } catch (err) {
        console.log('Error fetching profile:', err.message);
      }
    };

    if (token && user) {
      fetchProfile();
    }
  }, [token, user]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={<ThemedView style={{ height: 250 }} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">My Profile</ThemedText>
      </ThemedView>

      {profileData ? (
        <ThemedView style={styles.infoCard}>
          <ThemedView style={styles.row}>
            <ThemedText style={styles.label}>Name</ThemedText>
            <ThemedText>{profileData.name}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.row}>
            <ThemedText style={styles.label}>School</ThemedText>
            <ThemedText>{profileData.school}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.row}>
            <ThemedText style={styles.label}>Visa Type</ThemedText>
            <ThemedText>{profileData.visa_type}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.row}>
            <ThemedText style={styles.label}>Program Start</ThemedText>
            <ThemedText>{profileData.program_start_date}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.row}>
            <ThemedText style={styles.label}>Program End</ThemedText>
            <ThemedText>{profileData.program_end_date}</ThemedText>
          </ThemedView>
        </ThemedView>
      ) : (
        <ThemedText style={{ paddingHorizontal: 16 }}>Loading...</ThemedText>
      )}

      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => router.push('/notification-settings')}>
        <ThemedText style={styles.settingsButtonText}>⚙️ Notification Settings</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <ThemedText style={styles.logoutButtonText}>Log Out</ThemedText>
      </TouchableOpacity>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F5F5F7',
    borderRadius: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  label: {
    fontWeight: '600',
    color: '#888',
  },
  settingsButton: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  logoutButton: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#D32F2F',
    fontWeight: '600',
  },
});
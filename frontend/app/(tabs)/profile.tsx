import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useState, useCallback } from 'react';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { getUserProfile } from '@/api';
import { useAuth } from '@/AuthContext';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientHeaderBackground } from '@/components/gradient-header-background';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Avatar({ name }) {
  return (
    <View style={styles.avatar}>
      <ThemedText style={styles.avatarText}>{getInitials(name)}</ThemedText>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);

  useFocusEffect(
    useCallback(() => {
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
    }, [token, user])
  );

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#C7D9FF', dark: '#2A2450' }}
      headerImage={<GradientHeaderBackground logoSize={50} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText style={styles.screenTitle}>My Profile</ThemedText>
      </ThemedView>

      {profileData ? (
        <>
          <ThemedView style={styles.avatarSection}>
            <Avatar name={profileData.name} />
            <ThemedText style={styles.avatarName}>{profileData.name}</ThemedText>
          </ThemedView>

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

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push('/edit-profile')}>
            <ThemedText style={styles.editButtonText}>✏️ Edit Profile</ThemedText>
          </TouchableOpacity>
        </>
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
  screenTitle: {
    fontSize: 26,
    fontFamily: 'Fredoka_700Bold',
    color: '#1A1A2E',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    color: '#FFFFFF',
    fontFamily: 'Fredoka_700Bold',
    fontSize: 24,
  },
  avatarName: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 16,
    color: '#1A1A2E',
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F0EEFF',
    borderRadius: 20,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  label: {
    fontFamily: 'Fredoka_600SemiBold',
    color: '#6C63FF',
  },
  editButton: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F0EEFF',
    alignItems: 'center',
  },
  editButtonText: {
    color: '#6C63FF',
    fontFamily: 'Fredoka_600SemiBold',
  },
  settingsButton: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F0EEFF',
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#6C63FF',
    fontFamily: 'Fredoka_600SemiBold',
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
    fontFamily: 'Fredoka_600SemiBold',
  },
});
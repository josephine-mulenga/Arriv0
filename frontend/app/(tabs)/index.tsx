import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View, TouchableOpacity } from 'react-native';
import { getAIStatus, getUserProfile, getStatus } from '@/api';
import { useAuth } from '@/AuthContext';
import { Image } from 'expo-image';
import Svg, { Circle } from 'react-native-svg';
import { router } from 'expo-router';
import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  const { user, token } = useAuth();
  const [statusData, setStatusData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [progressData, setProgressData] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getAIStatus(token);
        setStatusData(data);
      } catch (err) {
        console.log('Error fetching status:', err.message);
      }
    };

    const fetchProfile = async () => {
      try {
        const data = await getUserProfile(user.id, token);
        setProfileData(data);
      } catch (err) {
        console.log('Error fetching profile:', err.message);
      }
    };

    const fetchProgress = async () => {
      try {
        const data = await getStatus(token);
        console.log('Progress data:', data);
        setProgressData(data.program_progress);
      } catch (err) {
        console.log('Error fetching progress:', err.message);
      }
    };

    if (token && user) {
      fetchStatus();
      fetchProfile();
      fetchProgress();
    }
  }, [token, user]);

  const percentage = progressData ? progressData.percentage : 0;
  const daysRemaining = progressData ? progressData.days_remaining : null;

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image source={require('@/assets/images/partial-react-logo.png')} style={styles.reactLogo} />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome{profileData ? `, ${profileData.name}` : ''}!</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.statusContainer}>
        <ThemedText type="subtitle">Today's Status</ThemedText>
        <ThemedText>{statusData ? statusData.ai_message : 'Loading...'}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.ringContainer}>
        <View style={{ width: 150, height: 150, alignItems: 'center', justifyContent: 'center' }}>
          <Svg height="150" width="150" style={{ position: 'absolute' }}>
            <Circle cx="75" cy="75" r="60" stroke="#e0e0e0" strokeWidth="10" fill="none" />
            <Circle
              cx="75"
              cy="75"
              r="60"
              stroke="purple"
              strokeWidth="10"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 60}`}
              strokeDashoffset={`${2 * Math.PI * 60 * (1 - percentage / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 75 75)"
            />
          </Svg>
          <ThemedText type="title">{daysRemaining !== null ? daysRemaining : '--'}</ThemedText>
          <ThemedText>days left</ThemedText>
        </View>
      </ThemedView>

      <TouchableOpacity style={styles.chatButton} onPress={() => router.push('/chat')}>
        <ThemedText style={styles.chatButtonText}>💬 Ask Arrivo a question</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/notification-settings')} style={styles.settingsLink}>
        <ThemedText style={styles.settingsLinkText}>⚙️ Notification settings</ThemedText>
      </TouchableOpacity>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  statusContainer: { gap: 8, marginBottom: 16, paddingHorizontal: 16 },
  stepContainer: { gap: 8, marginBottom: 8 },
  reactLogo: { height: 178, width: 290, bottom: 0, left: 0, position: 'absolute' },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#dcdcdc',
    borderRadius: 16,
    marginHorizontal: 16,
  },
  newsContainer: {
    gap: 8,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F5F5F7',
    borderRadius: 16,
    marginHorizontal: 16,
  },
  newsTag: { color: 'purple', fontWeight: '600' },
  chatButton: {
    backgroundColor: '#6C63FF',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  chatButtonText: { color: '#FFFFFF', fontWeight: '600' },
  settingsLink: { alignItems: 'center', marginBottom: 16 },
  settingsLinkText: { color: '#888' },
});
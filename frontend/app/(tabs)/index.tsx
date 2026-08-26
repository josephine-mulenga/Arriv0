import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View, TouchableOpacity } from 'react-native';
import { getAIStatus, getUserProfile, getStatus, getOnboardingScore } from '@/api';
import { useAuth } from '@/AuthContext';
import Svg, { Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ArrivoLogo } from '@/components/arrivo-logo';

export default function HomeScreen() {
  const { user, token } = useAuth();
  const [statusData, setStatusData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [onboardingData, setOnboardingData] = useState(null);

  const glow = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + glow.value * 0.06 }],
  }));

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
        setProgressData(data.program_progress);
      } catch (err) {
        console.log('Error fetching progress:', err.message);
      }
    };

    const fetchOnboarding = async () => {
      try {
        const data = await getOnboardingScore(token);
        setOnboardingData(data);
      } catch (err) {
        console.log('Error fetching onboarding score:', err.message);
      }
    };

    if (token && user) {
      fetchStatus();
      fetchProfile();
      fetchProgress();
      fetchOnboarding();
    }
  }, [token, user]);

  const percentage = progressData ? progressData.percentage : 0;
  const daysRemaining = progressData ? progressData.days_remaining : null;

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#C7D9FF', dark: '#2A2450' }}
      headerImage={
        <View style={{ width: '100%', height: '100%' }}>
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice">
            <Defs>
              <LinearGradient id="homeHeaderGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#A9C9FF" />
                <Stop offset="0.5" stopColor="#C3B9FF" />
                <Stop offset="1" stopColor="#DCC4FA" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="400" height="250" fill="url(#homeHeaderGradient)" />
            <Circle cx="330" cy="60" r="3" fill="#FFFFFF" opacity="0.8" />
            <Circle cx="60" cy="90" r="2.5" fill="#FFFFFF" opacity="0.6" />
            <Circle cx="200" cy="40" r="2" fill="#FFFFFF" opacity="0.7" />
          </Svg>
          <View style={styles.logoHeaderWrap} pointerEvents="none">
            <Animated.View style={glowStyle}>
              <ArrivoLogo size={80} />
            </Animated.View>
          </View>
        </View>
      }>

      <ThemedView style={styles.titleContainer}>
        <ThemedText style={styles.welcomeTitle}>
          Welcome{profileData ? `, ${profileData.name}` : ''}!
        </ThemedText>
        <ThemedText style={styles.wave}>👋</ThemedText>
      </ThemedView>

      <ThemedView style={styles.statusContainer}>
        <ThemedText style={styles.sectionTitle}>Today's Status</ThemedText>
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
              stroke="#6C63FF"
              strokeWidth="10"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 60}`}
              strokeDashoffset={`${2 * Math.PI * 60 * (1 - percentage / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 75 75)"
            />
          </Svg>
          <ThemedText style={styles.ringNumber}>{daysRemaining !== null ? daysRemaining : '--'}</ThemedText>
          <ThemedText>days left</ThemedText>
        </View>
      </ThemedView>

      {onboardingData && (
        <ThemedView style={styles.onboardingCard}>
          <ThemedView style={styles.onboardingHeaderRow}>
            <ThemedText style={styles.sectionTitle}>Your Progress</ThemedText>
            <ThemedView
              style={[
                styles.levelBadge,
                { backgroundColor: onboardingData.level_color || '#6C63FF' },
              ]}>
              <ThemedText style={styles.levelBadgeText}>{onboardingData.level}</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.progressBarTrack}>
            <ThemedView
              style={[
                styles.progressBarFill,
                {
                  width: `${onboardingData.score}%`,
                  backgroundColor: onboardingData.level_color || '#6C63FF',
                },
              ]}
            />
          </ThemedView>
          <ThemedText style={styles.scoreText}>{onboardingData.score}% complete</ThemedText>

          {onboardingData.next_step && (
            <ThemedText style={styles.nextStepText}>
              Next step: {onboardingData.next_step}
            </ThemedText>
          )}
        </ThemedView>
      )}

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
  logoHeaderWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  welcomeTitle: {
    fontSize: 26,
    fontFamily: 'Fredoka_700Bold',
    color: '#1A1A2E',
  },
  wave: {
    fontSize: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Fredoka_600SemiBold',
    marginBottom: 2,
  },
  statusContainer: {
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  ringNumber: {
    fontSize: 28,
    fontFamily: 'Fredoka_700Bold',
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#F0EEFF',
    borderRadius: 20,
    marginHorizontal: 16,
  },
  onboardingCard: {
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F0EEFF',
    borderRadius: 20,
  },
  onboardingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  levelBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Fredoka_600SemiBold',
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: '#E0DDF5',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 10,
    borderRadius: 5,
  },
  scoreText: {
    fontSize: 13,
    color: '#4A4A6A',
  },
  nextStepText: {
    fontSize: 14,
    fontFamily: 'Fredoka_600SemiBold',
    color: '#6C63FF',
    marginTop: 4,
  },
  chatButton: {
    backgroundColor: '#6C63FF',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Fredoka_600SemiBold',
  },
  settingsLink: {
    alignItems: 'center',
    marginBottom: 16,
  },
  settingsLinkText: {
    color: '#888',
  },
});
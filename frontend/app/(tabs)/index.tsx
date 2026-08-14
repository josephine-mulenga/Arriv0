import { useEffect, useState } from 'react';
import { getAIStatus } from '@/api';
import { useAuth } from '@/AuthContext';
import { Image } from 'expo-image';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';

export default function HomeScreen() {
  const { token } = useAuth();
  const [statusData, setStatusData] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getAIStatus(token);
        console.log('Status data:', data);
        setStatusData(data);
      } catch (err) {
        console.log('Error fetching status:', err.message);
      }
    };

    if (token) {
      fetchStatus();
    }
  }, [token]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome to Arrivo!</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.statusContainer}>
        <ThemedText type="subtitle">Today's Status</ThemedText>
        <ThemedText>{statusData ? statusData.ai_message : 'Loading...'}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.ringContainer}>
        <View style={{ width: 150, height: 150, alignItems: 'center', justifyContent: 'center' }}>
          <Svg height="150" width="150" style={{ position: 'absolute' }}>
            <Circle
              cx="75"
              cy="75"
              r="60"
              stroke="#e0e0e0"
              strokeWidth="10"
              fill="none"
            />
            <Circle
              cx="75"
              cy="75"
              r="60"
              stroke="purple"
              strokeWidth="10"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 60}`}
              strokeDashoffset={`${2 * Math.PI * 60 * (1 - Math.min((statusData?.days_until_opt || 0) / 365, 1))}`}
              strokeLinecap="round"
              transform="rotate(-90 75 75)"
            />
          </Svg>
          <ThemedText type="title">{statusData ? statusData.days_until_opt : '--'}</ThemedText>
          <ThemedText>days left</ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.newsContainer}>
        <ThemedText type="subtitle">Immigration News</ThemedText>
        <ThemedText style={styles.newsTag}>Affects you directly</ThemedText>
        <ThemedText>
          USCIS announced a temporary extension to the OPT application processing timeline, giving students more flexibility if their program end date is approaching soon.
        </ThemedText>
      </ThemedView>

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  paddingHorizontal: 16,
},
statusContainer: {
  gap: 8,
  marginBottom: 16,
  paddingHorizontal: 16,
},
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
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
  newsTag: {
    color: 'purple',
    fontWeight: '600',
  },
});

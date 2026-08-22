import { StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { getMilestones } from '@/api';
import { useAuth } from '@/AuthContext';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientHeaderBackground } from '@/components/gradient-header-background';

export default function MilestonesScreen() {
  const { token } = useAuth();
  const [milestonesData, setMilestonesData] = useState(null);

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        const data = await getMilestones(1, token);
        setMilestonesData(data);
      } catch (err) {
        console.log('Error fetching milestones:', err.message);
      }
    };
    if (token) fetchMilestones();
  }, [token]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#C7D9FF', dark: '#2A2450' }}
      headerImage={<GradientHeaderBackground logoSize={50} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText style={styles.screenTitle}>Milestones</ThemedText>
      </ThemedView>

      {milestonesData ? (
        <>
          <ThemedView style={styles.progressSummary}>
            <ThemedText style={styles.progressText}>
              {milestonesData.completed} of {milestonesData.total} complete ({milestonesData.percentage}%)
            </ThemedText>
          </ThemedView>

          {milestonesData.milestones.map((item) => (
            <ThemedView key={item.id} style={styles.milestoneCard}>
              <ThemedText style={styles.cardTitle}>{item.icon} {item.title}</ThemedText>
              <ThemedText>{item.description}</ThemedText>

              {item.status === 'done' && (
                <ThemedText style={styles.doneText}>✅ Completed, nice work!</ThemedText>
              )}
              {item.status === 'up next' && (
                <ThemedText style={styles.upNextText}>🔜 Up next</ThemedText>
              )}
              {item.status === 'locked' && (
                <ThemedText style={styles.lockedText}>🔒 Locked</ThemedText>
              )}
            </ThemedView>
          ))}
        </>
      ) : (
        <ThemedText style={{ paddingHorizontal: 16 }}>Loading...</ThemedText>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 26,
    fontFamily: 'Fredoka_700Bold',
    color: '#1A1A2E',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Fredoka_600SemiBold',
  },
  progressSummary: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F0EEFF',
    borderRadius: 20,
    alignItems: 'center',
  },
  progressText: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 16,
  },
  milestoneCard: {
    gap: 4,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#F0EEFF',
  },
  doneText: { color: 'green', fontWeight: '600' },
  upNextText: { color: '#6C63FF', fontWeight: '600' },
  lockedText: { color: '#999999', fontWeight: '600' },
});

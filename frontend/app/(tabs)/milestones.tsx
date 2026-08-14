import { StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { getMilestones } from '@/api';
import { useAuth } from '@/AuthContext';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';



export default function MilestonesScreen() {
  const { token } = useAuth();
  const [milestonesData, setMilestonesData] = useState(null);

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        const data = await getMilestones(1, token);
        console.log('Milestones data:', data);
        setMilestonesData(data);
      } catch (err) {
        console.log('Error fetching milestones:', err.message);
      }
    };

    if (token) {
      fetchMilestones();
    }
  }, [token]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={<ThemedView style={{ height: 250 }} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Milestones</ThemedText>
      </ThemedView>

      {milestonesData ? (
      <>
        <ThemedView style={styles.progressSummary}>
          <ThemedText type="subtitle">
            {milestonesData.completed} of {milestonesData.total} complete ({milestonesData.percentage}%)
          </ThemedText>
        </ThemedView>

        {milestonesData.milestones.map((item) => (
          <ThemedView key={item.id} style={styles.milestoneCard}>
            <ThemedText type="subtitle">{item.icon} {item.title}</ThemedText>
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
  milestoneCard: {
    gap: 4,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F5F5F7',
  },
  doneText: {
    color: 'green',
    fontWeight: '600',
  },
  upNextText: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  lockedText: {
    color: '#999999',
    fontWeight: '600',
  },
});
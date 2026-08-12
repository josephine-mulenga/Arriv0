import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const milestones = [
  { title: 'Arrived in the US', status: 'done' },
  { title: 'Completed SEVIS check-in', status: 'done' },
  { title: 'Opened a US bank account', status: 'done' },
  { title: 'Applied for CPT', status: 'up next' },
  { title: 'Applied for OPT', status: 'locked' },
  { title: 'Started OPT employment', status: 'locked' },
  { title: 'Applied for STEM OPT extension', status: 'locked' },
];

export default function MilestonesScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={<ThemedView style={{ height: 250 }} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Milestones</ThemedText>
      </ThemedView>

      {milestones.map((item, index) => (
        <ThemedView key={index} style={styles.milestoneCard}>
          <ThemedText type="subtitle">{item.title}</ThemedText>

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
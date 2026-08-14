import { useEffect, useState } from 'react';
import { getTimeline } from '@/api';
import { useAuth } from '@/AuthContext';
import { StyleSheet, TouchableOpacity, Linking } from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';





export default function TimelineScreen() {
  const yearLevelMap = { Freshman: 1, Sophomore: 2, Junior: 3, Senior: 4 };
  const [activeTab, setActiveTab] = useState('Freshman');
  const { token } = useAuth();
  const [timelineData, setTimelineData] = useState(null);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const data = await getTimeline(yearLevelMap[activeTab], token);
        console.log('Timeline data:', data);
        setTimelineData(data);
      } catch (err) {
        console.log('Error fetching timeline:', err.message);
      }
    };

    if (token) {
      fetchTimeline();
    }
  }, [activeTab, token]);
  const tabs = ['Freshman', 'Sophomore', 'Junior', 'Senior'];

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={<ThemedView style={{ height: 250 }} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Timeline</ThemedText>
      </ThemedView>

      <ThemedView style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}>
            <ThemedText style={activeTab === tab && styles.tabTextActive}>{tab}</ThemedText>
          </TouchableOpacity>
        ))}
      </ThemedView>

      <ThemedView style={styles.checklistContainer}>
        <ThemedText type="subtitle">{activeTab} Checklist</ThemedText>
        {timelineData && <ThemedText style={styles.statusMessage}>{timelineData.status}</ThemedText>}

        {timelineData ? (
          timelineData.steps.map((step, index) => (
            <TouchableOpacity
              key={index}
              disabled={!step.link}
              onPress={() => step.link && Linking.openURL(step.link)}>
              <ThemedText style={step.done ? styles.stepDone : styles.stepPending}>
                {step.done ? '✅' : '⬜'} {step.task}
              </ThemedText>
            </TouchableOpacity>
          ))
        ) : (
          <ThemedText>Loading...</ThemedText>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F7',
  },
  tabButtonActive: {
    backgroundColor: '#6C63FF',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  checklistContainer: {
    gap: 8,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#F5F5F7',
    borderRadius: 16,
  },
  checklistItem: {
  color: '#6C63FF',
  marginBottom: 4,
},
});
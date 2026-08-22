import { StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useEffect, useState } from 'react';
import { getTimeline } from '@/api';
import { useAuth } from '@/AuthContext';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientHeaderBackground } from '@/components/gradient-header-background';

export default function TimelineScreen() {
  const yearLevelMap = { Freshman: 1, Sophomore: 2, Junior: 3, Senior: 4 };
  const [activeTab, setActiveTab] = useState('Freshman');
  const { token } = useAuth();
  const [timelineData, setTimelineData] = useState(null);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const data = await getTimeline(yearLevelMap[activeTab], token);
        setTimelineData(data);
      } catch (err) {
        console.log('Error fetching timeline:', err.message);
      }
    };
    if (token) fetchTimeline();
  }, [activeTab, token]);

  const tabs = ['Freshman', 'Sophomore', 'Junior', 'Senior'];

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#C7D9FF', dark: '#2A2450' }}
      headerImage={<GradientHeaderBackground logoSize={50} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText style={styles.screenTitle}>Timeline</ThemedText>
      </ThemedView>

      <ThemedView style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}>
            <ThemedText style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</ThemedText>
          </TouchableOpacity>
        ))}
      </ThemedView>

      <ThemedView style={styles.checklistContainer}>
        <ThemedText style={styles.sectionTitle}>{activeTab} Checklist</ThemedText>
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
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 26,
    fontFamily: 'Fredoka_700Bold',
    color: '#1A1A2E',
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
    borderRadius: 10,
    backgroundColor: '#F0EEFF',
  },
  tabButtonActive: {
    backgroundColor: '#6C63FF',
  },
  tabText: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 13,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  checklistContainer: {
    gap: 8,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#F0EEFF',
    borderRadius: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Fredoka_600SemiBold',
  },
  statusMessage: {
    fontStyle: 'italic',
    marginBottom: 8,
  },
  stepDone: {
    color: '#4CAF50',
    marginBottom: 4,
  },
  stepPending: {
    color: '#6C63FF',
    marginBottom: 4,
  },
});
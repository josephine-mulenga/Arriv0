import { StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useEffect, useState } from 'react';
import { getTimeline } from '@/api';
import { useAuth } from '@/AuthContext';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientHeaderBackground } from '@/components/gradient-header-background';

export default function TimelineScreen() {
  const { token } = useAuth();
  const [timelineData, setTimelineData] = useState(null);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const data = await getTimeline(token);
        setTimelineData(data);
      } catch (err) {
        console.log('Error fetching timeline:', err.message);
      }
    };
    if (token) fetchTimeline();
  }, [token]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#C7D9FF', dark: '#2A2450' }}
      headerImage={<GradientHeaderBackground logoSize={50} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText style={styles.screenTitle}>Timeline</ThemedText>
      </ThemedView>

      {timelineData ? (
        <>
          <ThemedView style={styles.yearBadge}>
            <ThemedText style={styles.yearBadgeText}>You're a {timelineData.year}</ThemedText>
          </ThemedView>

          {(timelineData.opt_window_start || timelineData.opt_window_end || timelineData.grace_period_end) && (
            <ThemedView style={styles.optBanner}>
              {timelineData.opt_window_start && (
                <ThemedText style={styles.optBannerText}>
                  OPT window opens: {timelineData.opt_window_start}
                </ThemedText>
              )}
              {timelineData.opt_window_end && (
                <ThemedText style={styles.optBannerText}>
                  OPT application deadline: {timelineData.opt_window_end}
                </ThemedText>
              )}
              {timelineData.grace_period_end && (
                <ThemedText style={styles.optBannerText}>
                  Grace period ends: {timelineData.grace_period_end}
                </ThemedText>
              )}
            </ThemedView>
          )}

          <ThemedView style={styles.checklistContainer}>
            <ThemedText style={styles.sectionTitle}>Your Checklist</ThemedText>
            {timelineData.status && (
              <ThemedText style={styles.statusMessage}>{timelineData.status}</ThemedText>
            )}

            {timelineData.steps.map((step, index) => (
              <TouchableOpacity
                key={index}
                disabled={!step.link}
                onPress={() => step.link && Linking.openURL(step.link)}
                style={styles.stepRow}>
                <ThemedText style={step.done ? styles.stepDone : styles.stepPending}>
                  {step.done ? '✅' : '⬜'} {step.task}
                </ThemedText>
                {step.date_range && (
                  <ThemedText style={styles.dateRangeText}>{step.date_range}</ThemedText>
                )}
              </TouchableOpacity>
            ))}
          </ThemedView>
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
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 26,
    fontFamily: 'Fredoka_700Bold',
    color: '#1A1A2E',
  },
  yearBadge: {
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#6C63FF',
  },
  yearBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 13,
  },
  optBanner: {
    gap: 4,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFF4E5',
  },
  optBannerText: {
    fontSize: 13,
    color: '#8A5A00',
    fontFamily: 'Fredoka_600SemiBold',
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
  stepRow: {
    marginBottom: 10,
  },
  stepDone: {
    color: '#4CAF50',
  },
  stepPending: {
    color: '#6C63FF',
  },
  dateRangeText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 22,
    marginTop: 2,
  },
});
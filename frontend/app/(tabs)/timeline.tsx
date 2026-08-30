import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  CircleIcon,
  WarningCircleIcon,
  CloudSlashIcon,
} from 'phosphor-react-native';

import { getTimeline } from '@/api';
import { useAuth } from '@/AuthContext';
import { Chip } from '@/components/ui/chip';
import { RailRow } from '@/components/ui/rail-row';
import { Palette, Radius, Spacing, Type } from '@/constants/theme';
import { router } from 'expo-router';

interface TimelineStep {
  task: string;
  done: boolean;
  link?: string;
  date_range?: string;
  warning?: boolean;
}

interface TimelineData {
  year: string;
  status: string;
  steps: TimelineStep[];
}

const yearNameToNumber: Record<string, number> = {
  Freshman: 1,
  Sophomore: 2,
  Junior: 3,
  Senior: 4,
};

function stepStatus(step: TimelineStep) {
  if (step.warning) {
    return { label: 'Hard deadline', color: Palette.amber, icon: WarningCircleIcon, filled: true };
  }
  if (step.done) {
    return { label: 'Completed', color: Palette.green, icon: CheckCircleIcon, filled: true };
  }
  return { label: 'Not started', color: Palette.inkDisabled, icon: CircleIcon, filled: false };
}

export default function TimelineScreen() {
  const { token } = useAuth();
  const [data, setData] = useState<TimelineData | null>(null);
  const [offline, setOffline] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchTimeline();
  }, [token]);

  const fetchTimeline = async () => {
    try {
      const result = await getTimeline(token);
      setData(result);
      setOffline(false);
      setSelectedYear(yearNameToNumber[result.year] ?? 1);
    } catch {
      setOffline(true);
    }
  };

  const currentYear = data ? yearNameToNumber[data.year] ?? 1 : 1;
  const viewingOtherYear = selectedYear !== null && selectedYear !== currentYear;

  const upcoming = data ? data.steps.filter((s) => !s.done) : [];
  const completed = data ? data.steps.filter((s) => s.done) : [];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Timeline</Text>
        <Pressable style={styles.searchButton} onPress={() => router.push('/search')}>
          <MagnifyingGlassIcon size={18} color={Palette.inkBody} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipRow}>
        {[1, 2, 3, 4].map((year) => (
          <Chip
            key={year}
            label={`Year ${year}`}
            selected={selectedYear === year}
            onPress={() => setSelectedYear(year)}
          />
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {offline && (
          <View style={styles.offlineBanner}>
            <CloudSlashIcon size={22} color={Palette.amber} />
            <View style={{ flex: 1 }}>
              <Text style={styles.offlineTitle}>Showing your saved timeline</Text>
              <Text style={styles.offlineBody}>
                You&apos;re offline, so this is the last copy Arriv0 saved. Dates don&apos;t change
                often, but new rule updates won&apos;t appear until you reconnect.
              </Text>
              <Pressable style={styles.retryButton} onPress={fetchTimeline}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          </View>
        )}

        {viewingOtherYear ? (
          <Text style={styles.otherYearNote}>
            Only your current year&apos;s timeline is available right now — check back as you
            progress through the program.
          </Text>
        ) : (
          <View style={offline ? styles.skeletonWrap : undefined}>
            {upcoming.length > 0 && (
              <>
                <Text style={styles.groupHeader}>UPCOMING</Text>
                {upcoming.map((step, index) => (
                  <StepRow key={index} step={step} isLast={index === upcoming.length - 1 && completed.length === 0} />
                ))}
              </>
            )}

            {completed.length > 0 && (
              <>
                <Text style={styles.groupHeader}>COMPLETED</Text>
                {completed.map((step, index) => (
                  <StepRow key={index} step={step} isLast={index === completed.length - 1} />
                ))}
              </>
            )}

            {!data && !offline && <Text style={styles.emptyText}>Loading your timeline...</Text>}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StepRow({ step, isLast }: { step: TimelineStep; isLast: boolean }) {
  const status = stepStatus(step);
  const StatusIcon = status.icon;

  return (
    <RailRow dotColor={status.color} dotFilled={status.filled} isLast={isLast}>
      <Pressable
        style={[styles.card, { borderLeftColor: status.color }]}
        onPress={() => step.link && Linking.openURL(step.link)}>
        <Text style={styles.cardTitle}>{step.task}</Text>
        {step.date_range ? <Text style={styles.cardDate}>{step.date_range}</Text> : null}
        <View style={styles.cardFooter}>
          <Text style={[styles.cardStatusLabel, { color: status.color }]}>{status.label}</Text>
          <StatusIcon size={20} color={status.color} weight={status.filled ? 'fill' : 'regular'} />
        </View>
      </Pressable>
    </RailRow>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 62,
    paddingHorizontal: Spacing.screenPadding,
  },
  title: {
    fontFamily: Type.headingBold,
    fontSize: 22,
    color: Palette.ink,
  },
  searchButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Palette.dividerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipScroll: {
    height: 64,
    flexGrow: 0,
    flexShrink: 0,
  },
  chipRow: {
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 16,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 108,
  },
  groupHeader: {
    fontFamily: Type.headingSemiBold,
    fontSize: 12.5,
    color: Palette.inkPlaceholder,
    letterSpacing: 0.7,
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    borderLeftWidth: 4,
    borderRadius: Radius.cardSmall,
    padding: 14,
  },
  cardTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 14,
    color: Palette.ink,
  },
  cardDate: {
    marginTop: 3,
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.inkPlaceholder,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cardStatusLabel: {
    fontFamily: Type.bodyBold,
    fontSize: 12,
  },
  emptyText: {
    fontFamily: Type.bodyRegular,
    fontSize: 13,
    color: Palette.inkPlaceholder,
  },
  otherYearNote: {
    fontFamily: Type.bodyRegular,
    fontSize: 13.5,
    lineHeight: 21,
    color: Palette.inkMuted,
    marginTop: 8,
  },
  offlineBanner: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Palette.amberTint,
    borderWidth: 1,
    borderColor: Palette.amberBorder,
    borderRadius: 18,
    padding: 16,
    marginBottom: Spacing.sectionGap,
  },
  offlineTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 14.5,
    color: Palette.ink,
  },
  offlineBody: {
    marginTop: 4,
    fontFamily: Type.bodyRegular,
    fontSize: 13,
    lineHeight: 19,
    color: Palette.inkBody,
  },
  retryButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: Palette.ink,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  retryText: {
    fontFamily: Type.bodySemiBold,
    fontSize: 12.5,
    color: Palette.white,
  },
  skeletonWrap: {
    opacity: 0.55,
  },
});

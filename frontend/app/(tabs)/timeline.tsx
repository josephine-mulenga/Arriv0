import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  CircleIcon,
  WarningCircleIcon,
  CloudSlashIcon,
  SparkleIcon,
} from 'phosphor-react-native';

import { getTimeline } from '@/api';
import { useAuth } from '@/AuthContext';
import { Chip } from '@/components/ui/chip';
import { RailRow } from '@/components/ui/rail-row';
import { Palette, Radius, Spacing, Type } from '@/constants/theme';
import { router } from 'expo-router';
import { getStepCompletion, setStepCompletion } from '@/utils/step-completion';

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
  current_year_level: number;
  viewing_year_level: number;
}

function stepStatus(step: TimelineStep, effectiveDone: boolean) {
  if (step.warning) {
    return { label: 'Hard deadline', color: Palette.amber, icon: WarningCircleIcon, filled: true };
  }
  if (effectiveDone) {
    return { label: 'Completed', color: Palette.green, icon: CheckCircleIcon, filled: true };
  }
  return { label: 'Not started', color: Palette.inkDisabled, icon: CircleIcon, filled: false };
}

export default function TimelineScreen() {
  const { token } = useAuth();
  const [data, setData] = useState<TimelineData | null>(null);
  const [offline, setOffline] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  // Steps with no real backend signal (no linked profile field) start
  // unconfirmed and stay that way until the student explicitly taps them —
  // never auto-marked done just because time has passed.
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});

  // Refetch on every focus, not just on mount — tabs stay mounted when you
  // switch away, so a plain useEffect would keep showing stale done/locked
  // status after answering questions elsewhere (e.g. Complete Your Profile).
  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      fetchTimeline(selectedYear ?? undefined);
    }, [token])
  );

  useEffect(() => {
    if (!token || selectedYear === null) return;
    if (data && data.viewing_year_level === selectedYear) return;
    fetchTimeline(selectedYear);
  }, [selectedYear]);

  const fetchTimeline = async (year?: number) => {
    try {
      const result = await getTimeline(token, year);
      setData(result);
      setOffline(false);
      if (year === undefined) setSelectedYear(result.current_year_level ?? 1);
    } catch {
      setOffline(true);
    }
  };

  const deadlineKey = data ? `timeline-year-${data.viewing_year_level}` : null;

  useEffect(() => {
    if (!deadlineKey) return;
    getStepCompletion(deadlineKey).then(setConfirmed);
  }, [deadlineKey]);

  const isEffectivelyDone = (step: TimelineStep) => step.done || !!confirmed[step.task];

  const handleToggleConfirm = async (step: TimelineStep) => {
    if (step.done || !deadlineKey) return; // real backend facts aren't user-editable
    const next = !confirmed[step.task];
    setConfirmed((prev) => ({ ...prev, [step.task]: next }));
    await setStepCompletion(deadlineKey, step.task, next);
  };

  const upcoming = data ? data.steps.filter((s) => !isEffectivelyDone(s)) : [];
  const completed = data ? data.steps.filter((s) => isEffectivelyDone(s)) : [];
  const showCptGuide = data ? data.steps.some((s) => s.task.toLowerCase().includes('cpt')) : false;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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

        {offline && (
          <View style={styles.offlineBanner}>
            <CloudSlashIcon size={22} color={Palette.amber} />
            <View style={{ flex: 1 }}>
              <Text style={styles.offlineTitle}>Showing your saved timeline</Text>
              <Text style={styles.offlineBody}>
                You&apos;re offline, so this is the last copy Arriv0 saved. Dates don&apos;t change
                often, but new rule updates won&apos;t appear until you reconnect.
              </Text>
              <Pressable style={styles.retryButton} onPress={() => fetchTimeline(selectedYear ?? undefined)}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          </View>
        )}

        {showCptGuide && (
          <View style={styles.guideCard}>
            <SparkleIcon size={18} color={Palette.purple} weight="fill" />
            <View style={{ flex: 1 }}>
              <Text style={styles.guideTitle}>New to CPT?</Text>
              <Text style={styles.guideBody}>
                CPT requires one full academic year of study first, must relate to your major,
                and needs DSO authorization before you start work. Use 12+ months of full-time
                CPT and you permanently lose OPT eligibility — part-time CPT (20 hrs/week or
                less) doesn&apos;t count against that limit.
              </Text>
            </View>
          </View>
        )}

        <View style={offline ? styles.skeletonWrap : undefined}>
          {upcoming.length > 0 && (
            <>
              <Text style={styles.groupHeader}>UPCOMING</Text>
              {upcoming.map((step, index) => (
                <StepRow
                  key={index}
                  index={index}
                  step={step}
                  effectiveDone={false}
                  isLast={index === upcoming.length - 1 && completed.length === 0}
                  onToggleConfirm={() => handleToggleConfirm(step)}
                />
              ))}
            </>
          )}

          {completed.length > 0 && (
            <>
              <Text style={styles.groupHeader}>COMPLETED</Text>
              {completed.map((step, index) => (
                <StepRow
                  key={index}
                  index={index}
                  step={step}
                  effectiveDone={true}
                  isLast={index === completed.length - 1}
                  onToggleConfirm={() => handleToggleConfirm(step)}
                />
              ))}
            </>
          )}

          {!data && !offline && <Text style={styles.emptyText}>Loading your timeline...</Text>}
        </View>
      </ScrollView>
    </View>
  );
}

function StepRow({
  step,
  effectiveDone,
  isLast,
  index,
  onToggleConfirm,
}: {
  step: TimelineStep;
  effectiveDone: boolean;
  isLast: boolean;
  index: number;
  onToggleConfirm: () => void;
}) {
  const status = stepStatus(step, effectiveDone);
  const StatusIcon = status.icon;
  // Real backend facts (has_bank_account, has_ssn, etc.) aren't user-
  // editable here — only steps with no such signal are tappable to confirm.
  const isConfirmable = !step.done;

  const iconScale = useSharedValue(1);
  useEffect(() => {
    if (effectiveDone) {
      iconScale.value = withSequence(withSpring(1.4, { damping: 6, stiffness: 400 }), withSpring(1));
    }
  }, [effectiveDone]);
  const iconAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }));

  return (
    <RailRow dotColor={status.color} dotFilled={status.filled} isLast={isLast} index={index}>
      <Pressable
        style={[styles.card, { borderLeftColor: status.color }]}
        onPress={() => step.link && Linking.openURL(step.link)}>
        <Text style={styles.cardTitle}>{step.task}</Text>
        {step.date_range ? <Text style={styles.cardDate}>{step.date_range}</Text> : null}
        <View style={styles.cardFooter}>
          <Text style={[styles.cardStatusLabel, { color: status.color }]}>
            {isConfirmable && !effectiveDone ? 'Tap to confirm' : status.label}
          </Text>
          <Pressable
            hitSlop={10}
            disabled={!isConfirmable}
            onPress={onToggleConfirm}>
            <Animated.View style={iconAnimatedStyle}>
              <StatusIcon size={20} color={status.color} weight={status.filled ? 'fill' : 'regular'} />
            </Animated.View>
          </Pressable>
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
  guideCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Palette.purpleCard,
    borderWidth: 1,
    borderColor: Palette.purpleCardBorder,
    borderRadius: 18,
    padding: 16,
    marginBottom: Spacing.sectionGap,
  },
  guideTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 14.5,
    color: Palette.ink,
  },
  guideBody: {
    marginTop: 4,
    fontFamily: Type.bodyRegular,
    fontSize: 13,
    lineHeight: 19,
    color: Palette.inkBody,
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

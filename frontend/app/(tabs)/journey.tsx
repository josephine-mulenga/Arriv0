import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  CircleIcon,
  WarningCircleIcon,
  CloudSlashIcon,
  SparkleIcon,
  ClipboardTextIcon,
  CaretRightIcon,
} from 'phosphor-react-native';

import { getTimeline, getMilestones } from '@/api';
import { useAuth } from '@/AuthContext';
import { Chip } from '@/components/ui/chip';
import { RailRow } from '@/components/ui/rail-row';
import { Palette, Radius, Spacing, Type } from '@/constants/theme';
import { router, useFocusEffect } from 'expo-router';
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

interface Milestone {
  id: number;
  title: string;
  description: string;
  status: 'done' | 'next' | 'locked';
}

interface MilestonesData {
  completed: number;
  total: number;
  milestones: Milestone[];
}

function stepStatus(step: TimelineStep, effectiveDone: boolean) {
  if (step.warning) {
    return { label: 'Hard deadline', color: Palette.amber, icon: WarningCircleIcon, filled: true };
  }
  if (effectiveDone) {
    return { label: 'Done', color: Palette.green, icon: CheckCircleIcon, filled: true };
  }
  return { label: 'Not started', color: Palette.inkDisabled, icon: CircleIcon, filled: false };
}

export default function JourneyScreen() {
  const { token } = useAuth();
  const [section, setSection] = useState<'timeline' | 'milestones'>('timeline');

  // --- Timeline state ---
  const [data, setData] = useState<TimelineData | null>(null);
  const [offline, setOffline] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const lastFetchedAt = useRef(0);

  // --- Milestones state ---
  const [milestoneData, setMilestoneData] = useState<MilestonesData | null>(null);
  const lastMilestonesFetchedAt = useRef(0);

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

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      if (Date.now() - lastFetchedAt.current < 15000) return;
      lastFetchedAt.current = Date.now();
      fetchTimeline(selectedYear ?? undefined);

      if (Date.now() - lastMilestonesFetchedAt.current < 15000) return;
      lastMilestonesFetchedAt.current = Date.now();
      getMilestones(token).then(setMilestoneData).catch(() => {});
    }, [token])
  );

  useEffect(() => {
    if (!token || selectedYear === null) return;
    if (data && data.viewing_year_level === selectedYear) return;
    (async () => {
      await Promise.resolve();
      fetchTimeline(selectedYear);
    })();
  }, [selectedYear]);

  const deadlineKey = data ? `timeline-year-${data.viewing_year_level}` : null;

  useEffect(() => {
    if (!deadlineKey) return;
    getStepCompletion(deadlineKey).then(setConfirmed);
  }, [deadlineKey]);

  const isEffectivelyDone = (step: TimelineStep) => step.done || !!confirmed[step.task];

  const handleToggleConfirm = async (step: TimelineStep) => {
    if (step.done || !deadlineKey) return;
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
          <Text style={styles.title}>Your Journey</Text>
          <Pressable style={styles.searchButton} onPress={() => router.push('/search')}>
            <MagnifyingGlassIcon size={18} color={Palette.inkBody} />
          </Pressable>
        </View>

        <View style={styles.segmentRow}>
          <Chip label="Timeline" selected={section === 'timeline'} onPress={() => setSection('timeline')} />
          <Chip label="Milestones" selected={section === 'milestones'} onPress={() => setSection('milestones')} />
        </View>

        {section === 'timeline' ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScroll}
              contentContainerStyle={styles.chipRow}>
              {[0, 1, 2, 3, 4].map((year) => (
                <Chip
                  key={year}
                  label={year === 0 ? 'Before Arrival' : `Year ${year}`}
                  selected={selectedYear === year}
                  onPress={() => setSelectedYear(year)}
                />
              ))}
            </ScrollView>

            {offline && (
              <View style={styles.offlineBanner}>
                <CloudSlashIcon size={20} color={Palette.amber} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.offlineTitle}>Showing your saved timeline</Text>
                  <Text style={styles.offlineBody}>You&apos;re offline — this is the last saved copy.</Text>
                  <Pressable style={styles.retryButton} onPress={() => fetchTimeline(selectedYear ?? undefined)}>
                    <Text style={styles.retryText}>Try again</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {showCptGuide && (
              <View style={styles.guideCard}>
                <SparkleIcon size={16} color={Palette.purple} weight="fill" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.guideTitle}>New to CPT?</Text>
                  <Text style={styles.guideBody}>
                    Needs 1 full academic year first, must relate to your major, and requires DSO
                    sign-off before you start.
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
          </>
        ) : (
          <>
            {milestoneData && (
              <Text style={styles.milestoneSubtitle}>
                {milestoneData.completed} of {milestoneData.total} complete since you landed
              </Text>
            )}

            <Pressable style={styles.promptCard} onPress={() => router.push('/complete-profile')}>
              <ClipboardTextIcon size={18} color={Palette.purple} />
              <View style={{ flex: 1 }}>
                <Text style={styles.promptTitle}>Complete your profile</Text>
                <Text style={styles.promptBody}>Get milestones based on your real status.</Text>
              </View>
              <CaretRightIcon size={15} color={Palette.chevron} />
            </Pressable>

            {milestoneData?.milestones.map((item, index) => {
              const isLast = index === milestoneData.milestones.length - 1;
              const dotColor =
                item.status === 'done' ? Palette.green : item.status === 'next' ? Palette.purple : Palette.inkDisabled;
              return (
                <RailRow
                  key={item.id}
                  dotColor={dotColor}
                  dotFilled={item.status === 'done'}
                  dotSize={13}
                  ringWidth={item.status === 'done' ? undefined : 2.5}
                  isLast={isLast}
                  index={index}>
                  <View
                    style={[
                      styles.card,
                      item.status === 'next' && styles.cardInProgress,
                      item.status === 'locked' && styles.cardLocked,
                    ]}>
                    <Text style={[styles.cardTitle, item.status === 'locked' && styles.cardTitleLocked]}>
                      {item.title}
                    </Text>
                    <Text style={styles.cardDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  </View>
                </RailRow>
              );
            })}

            {!milestoneData && <Text style={styles.emptyText}>Loading your milestones...</Text>}
          </>
        )}
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
          <Pressable hitSlop={10} disabled={!isConfirmable} onPress={onToggleConfirm}>
            <Animated.View style={iconAnimatedStyle}>
              <StatusIcon size={18} color={status.color} weight={status.filled ? 'fill' : 'regular'} />
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
    fontSize: 20,
    color: Palette.ink,
  },
  searchButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: Palette.dividerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 108,
  },
  chipScroll: {
    height: 52,
    flexGrow: 0,
    flexShrink: 0,
  },
  chipRow: {
    gap: 8,
    alignItems: 'center',
    paddingVertical: 12,
  },
  groupHeader: {
    fontFamily: Type.headingSemiBold,
    fontSize: 11.5,
    color: Palette.inkPlaceholder,
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 6,
  },
  card: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    borderLeftWidth: 3,
    borderRadius: Radius.cardSmall,
    padding: 11,
  },
  cardInProgress: {
    backgroundColor: Palette.purpleCard,
    borderColor: Palette.purpleCardBorder,
  },
  cardLocked: {
    backgroundColor: Palette.surfaceSubtle,
    borderColor: Palette.divider,
  },
  cardTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 13,
    color: Palette.ink,
  },
  cardTitleLocked: {
    color: Palette.inkPlaceholder,
  },
  cardDescription: {
    marginTop: 3,
    fontFamily: Type.bodyRegular,
    fontSize: 12,
    lineHeight: 16,
    color: Palette.inkMuted,
  },
  cardDate: {
    marginTop: 2,
    fontFamily: Type.bodyRegular,
    fontSize: 11.5,
    color: Palette.inkPlaceholder,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  cardStatusLabel: {
    fontFamily: Type.bodyBold,
    fontSize: 11,
  },
  emptyText: {
    fontFamily: Type.bodyRegular,
    fontSize: 13,
    color: Palette.inkPlaceholder,
    marginTop: 8,
  },
  milestoneSubtitle: {
    marginTop: 12,
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.inkFaint,
  },
  guideCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Palette.purpleCard,
    borderWidth: 1,
    borderColor: Palette.purpleCardBorder,
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  guideTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 13,
    color: Palette.ink,
  },
  guideBody: {
    marginTop: 2,
    fontFamily: Type.bodyRegular,
    fontSize: 12,
    lineHeight: 16,
    color: Palette.inkBody,
  },
  offlineBanner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Palette.amberTint,
    borderWidth: 1,
    borderColor: Palette.amberBorder,
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  offlineTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 13,
    color: Palette.ink,
  },
  offlineBody: {
    marginTop: 2,
    fontFamily: Type.bodyRegular,
    fontSize: 12,
    lineHeight: 16,
    color: Palette.inkBody,
  },
  retryButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: Palette.ink,
    borderRadius: 9,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  retryText: {
    fontFamily: Type.bodySemiBold,
    fontSize: 12,
    color: Palette.white,
  },
  skeletonWrap: {
    opacity: 0.55,
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Palette.purpleCard,
    borderWidth: 1,
    borderColor: Palette.purpleCardBorder,
    borderRadius: Radius.cardSmall,
    padding: 12,
    marginTop: 12,
    marginBottom: 14,
  },
  promptTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 13,
    color: Palette.ink,
  },
  promptBody: {
    marginTop: 1,
    fontFamily: Type.bodyRegular,
    fontSize: 11.5,
    lineHeight: 15,
    color: Palette.inkBody,
  },
});

import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  CircleIcon,
  WarningCircleIcon,
  CloudSlashIcon,
  SparkleIcon,
  CaretDownIcon,
  CaretUpIcon,
  ArrowSquareOutIcon,
} from 'phosphor-react-native';

import { getTimeline, getMilestones, getMiniGoals, toggleMiniGoal } from '@/api';
import { useAuth } from '@/AuthContext';
import { RailRow } from '@/components/ui/rail-row';
import { AnimatedCheck } from '@/components/ui/animated-check';
import { SkeletonList } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
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
  target_year: number;
  icon: string;
  title: string;
  description: string;
  what_to_do?: string;
  why_it_matters?: string;
  source?: string | null;
  source_label?: string | null;
  status: 'done' | 'next' | 'locked';
}

interface MilestonesData {
  completed: number;
  total: number;
  milestones: Milestone[];
}

interface MiniGoal {
  id: string;
  milestone_id: number;
  label: string;
  semester: string;
  done: boolean;
}

const STEPPER = [
  { year: 0, label: 'Before\nArrival' },
  { year: 1, label: 'Year 1' },
  { year: 2, label: 'Year 2' },
  { year: 3, label: 'Year 3' },
  { year: 4, label: 'Year 4' },
  { year: 5, label: 'OPT' },
];

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

  // --- Timeline (this year's checklist) state ---
  const [data, setData] = useState<TimelineData | null>(null);
  const [offline, setOffline] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const lastFetchedAt = useRef(0);

  // --- Milestones state ---
  const [milestoneData, setMilestoneData] = useState<MilestonesData | null>(null);
  const [milestonesError, setMilestonesError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const lastMilestonesFetchedAt = useRef(0);

  // --- Mini goals state ---
  const [miniGoals, setMiniGoals] = useState<MiniGoal[] | null>(null);

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

  const fetchMilestones = async () => {
    try {
      const result = await getMilestones(token);
      setMilestoneData(result);
      setMilestonesError(null);
      const next = result.milestones.find((m: Milestone) => m.status === 'next');
      setExpandedId((prev) => prev ?? next?.id ?? null);
    } catch {
      setMilestonesError('Could not load your journey right now.');
    }
  };

  const fetchMiniGoals = async () => {
    try {
      const result = await getMiniGoals(token);
      setMiniGoals(result.goals ?? []);
    } catch {
      setMiniGoals([]);
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
      fetchMilestones();
      fetchMiniGoals();
    }, [token])
  );

  useEffect(() => {
    if (!token || selectedYear === null) return;
    if (data && data.viewing_year_level === selectedYear) return;
    fetchTimeline(selectedYear);
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

  const handleToggleGoal = async (goal: MiniGoal) => {
    const nextDone = !goal.done;
    setMiniGoals((prev) => (prev ? prev.map((g) => (g.id === goal.id ? { ...g, done: nextDone } : g)) : prev));
    try {
      await toggleMiniGoal(goal.id, nextDone, token);
    } catch {
      // revert on failure
      setMiniGoals((prev) => (prev ? prev.map((g) => (g.id === goal.id ? { ...g, done: !nextDone } : g)) : prev));
    }
  };

  const handleAskArriAboutMilestone = (milestone: Milestone) => {
    router.push({
      pathname: '/chat',
      params: { prefill: `What do I need to do for ${milestone.title}?` },
    });
  };

  const upcoming = data ? data.steps.filter((s) => !isEffectivelyDone(s)) : [];
  const completedSteps = data ? data.steps.filter((s) => isEffectivelyDone(s)) : [];

  return (
    <Animated.View style={styles.root} entering={FadeIn.duration(220)}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Your F1 Journey</Text>
          <Pressable style={styles.searchButton} onPress={() => router.push('/search')}>
            <MagnifyingGlassIcon size={18} color={Palette.inkBody} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stepperScroll} contentContainerStyle={styles.stepperRow}>
          {STEPPER.map((s, index) => {
            const isCurrent = selectedYear === s.year;
            const isPast = data ? s.year < data.current_year_level : false;
            return (
              <View key={s.year} style={styles.stepperItemWrap}>
                <Pressable style={styles.stepperItem} onPress={() => setSelectedYear(s.year)}>
                  <View
                    style={[
                      styles.stepperDot,
                      isCurrent && styles.stepperDotCurrent,
                      isPast && !isCurrent && styles.stepperDotPast,
                    ]}>
                    {isPast && !isCurrent ? (
                      <CheckCircleIcon size={14} color={Palette.white} weight="fill" />
                    ) : (
                      <Text style={[styles.stepperDotText, isCurrent && styles.stepperDotTextCurrent]}>{index}</Text>
                    )}
                  </View>
                  <Text style={[styles.stepperLabel, isCurrent && styles.stepperLabelCurrent]}>{s.label}</Text>
                </Pressable>
                {index < STEPPER.length - 1 && <View style={styles.stepperConnector} />}
              </View>
            );
          })}
        </ScrollView>

        {milestoneData && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              Currently: Year {data?.current_year_level ?? '—'}
            </Text>
            <Text style={styles.summaryProgress}>
              You have completed {milestoneData.completed} of {milestoneData.total} milestones
            </Text>
          </View>
        )}

        <Text style={styles.sectionHeader}>Milestones</Text>

        {milestonesError && <ErrorState message={milestonesError} onRetry={fetchMilestones} />}

        {!milestonesError && !milestoneData && <SkeletonList count={5} />}

        {!milestonesError &&
          milestoneData?.milestones.map((m) => {
            const isNext = m.status === 'next';
            const isExpanded = expandedId === m.id;
            const goalsForMilestone = (miniGoals ?? []).filter((g) => g.milestone_id === m.id);
            const dotColor = m.status === 'done' ? Palette.green : isNext ? Palette.purple : Palette.inkDisabled;
            return (
              <View key={m.id} style={styles.milestoneWrap}>
                <Pressable
                  style={[styles.milestoneRow, isNext && styles.milestoneRowNext]}
                  onPress={() => setExpandedId(isExpanded ? null : m.id)}>
                  <View style={[styles.milestoneDot, { backgroundColor: m.status === 'locked' ? Palette.white : dotColor, borderColor: dotColor }]}>
                    {m.status === 'done' ? (
                      <AnimatedCheck done size={isNext ? 20 : 16} doneColor={Palette.white} />
                    ) : (
                      <Text style={styles.milestoneEmoji}>{m.icon}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    {isNext ? <Text style={styles.nextLabel}>Next</Text> : null}
                    <Text style={[styles.milestoneTitle, isNext && styles.milestoneTitleNext, m.status === 'locked' && styles.milestoneTitleLocked]}>
                      {m.title}
                    </Text>
                    {!isExpanded ? (
                      <Text style={styles.milestoneDescription} numberOfLines={1}>{m.description}</Text>
                    ) : null}
                  </View>
                  {isExpanded ? (
                    <CaretUpIcon size={16} color={Palette.inkFaint} />
                  ) : (
                    <CaretDownIcon size={16} color={Palette.inkFaint} />
                  )}
                </Pressable>

                {isExpanded && (
                  <View style={styles.detailCard}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <Text style={styles.detailValue}>
                      {m.status === 'done' ? 'Completed' : m.status === 'next' ? 'Up next' : 'Not yet available'}
                    </Text>

                    <Text style={styles.detailLabel}>Around</Text>
                    <Text style={styles.detailValue}>
                      {m.target_year === 0 ? 'Before arrival' : m.target_year === 5 ? 'OPT phase' : `Year ${m.target_year}`}
                    </Text>

                    {m.what_to_do ? (
                      <>
                        <Text style={styles.detailLabel}>What to Do</Text>
                        <Text style={styles.detailValue}>{m.what_to_do}</Text>
                      </>
                    ) : null}

                    {m.why_it_matters ? (
                      <>
                        <Text style={styles.detailLabel}>Why It Matters</Text>
                        <Text style={styles.detailValue}>{m.why_it_matters}</Text>
                      </>
                    ) : null}

                    {m.source ? (
                      <Pressable style={styles.sourceRow} onPress={() => Linking.openURL(m.source!)}>
                        <ArrowSquareOutIcon size={13} color={Palette.purple} />
                        <Text style={styles.sourceLink}>Source: {m.source_label}</Text>
                      </Pressable>
                    ) : null}

                    <Pressable style={styles.askArriButton} onPress={() => handleAskArriAboutMilestone(m)}>
                      <SparkleIcon size={13} color={Palette.white} weight="fill" />
                      <Text style={styles.askArriButtonText}>Ask Arri about this</Text>
                    </Pressable>

                    {goalsForMilestone.length > 0 && (
                      <View style={styles.goalsTree}>
                        <Text style={styles.goalsTreeLabel}>Mini goals to get there</Text>
                        {goalsForMilestone.map((goal, goalIndex) => (
                          <Pressable key={goal.id} style={styles.goalRow} onPress={() => handleToggleGoal(goal)}>
                            <View style={styles.goalRail}>
                              <View style={[styles.goalDot, goal.done && styles.goalDotDone]}>
                                {goal.done ? <AnimatedCheck done size={13} doneColor={Palette.white} /> : null}
                              </View>
                              {goalIndex < goalsForMilestone.length - 1 && <View style={styles.goalLine} />}
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.goalLabel, goal.done && styles.goalLabelDone]}>{goal.label}</Text>
                              <Text style={styles.goalSemester}>{goal.semester}</Text>
                            </View>
                          </Pressable>
                        ))}
                        <View style={styles.goalsTreeArrow}>
                          <Text style={styles.goalsTreeArrowText}>↑ leads to</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}

        <View style={styles.rowBetween}>
          <Text style={styles.sectionHeader}>{data?.year ?? 'This Year'} Checklist</Text>
        </View>

        {offline && (
          <View style={styles.offlineBanner}>
            <CloudSlashIcon size={20} color={Palette.amber} />
            <View style={{ flex: 1 }}>
              <Text style={styles.offlineTitle}>Showing your saved checklist</Text>
              <Text style={styles.offlineBody}>You&apos;re offline — this is the last saved copy.</Text>
              <Pressable style={styles.retryButton} onPress={() => fetchTimeline(selectedYear ?? undefined)}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          </View>
        )}

        {!data && !offline && <SkeletonList count={3} />}

        {data && upcoming.length === 0 && completedSteps.length === 0 && (
          <EmptyState icon={CheckCircleIcon} title="You are on track" body="No actions needed right now." />
        )}

        <View style={offline ? styles.skeletonWrap : undefined}>
          {upcoming.length > 0 && (
            <>
              <Text style={styles.groupHeader}>Upcoming</Text>
              {upcoming.map((step, index) => (
                <StepRow
                  key={index}
                  index={index}
                  step={step}
                  effectiveDone={false}
                  isLast={index === upcoming.length - 1 && completedSteps.length === 0}
                  onToggleConfirm={() => handleToggleConfirm(step)}
                />
              ))}
            </>
          )}

          {completedSteps.length > 0 && (
            <>
              <Text style={styles.groupHeader}>Completed</Text>
              {completedSteps.map((step, index) => (
                <StepRow
                  key={index}
                  index={index}
                  step={step}
                  effectiveDone={true}
                  isLast={index === completedSteps.length - 1}
                  onToggleConfirm={() => handleToggleConfirm(step)}
                />
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </Animated.View>
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
        disabled={!isConfirmable}
        onPress={onToggleConfirm}>
        <Text style={styles.cardTitle}>{step.task}</Text>
        {step.date_range ? <Text style={styles.cardDate}>{step.date_range}</Text> : null}
        {step.link ? (
          <Pressable
            style={styles.stepViewLink}
            onPress={(e) => {
              e.stopPropagation();
              Linking.openURL(step.link!);
            }}
            hitSlop={6}>
            <ArrowSquareOutIcon size={12} color={Palette.purple} weight="bold" />
            <Text style={styles.stepViewLinkText}>View</Text>
          </Pressable>
        ) : null}
        <View style={styles.cardFooter}>
          <Text style={[styles.cardStatusLabel, { color: status.color }]}>
            {isConfirmable && !effectiveDone ? 'Tap to confirm' : status.label}
          </Text>
          <Animated.View style={iconAnimatedStyle}>
            <StatusIcon size={18} color={status.color} weight={status.filled ? 'fill' : 'regular'} />
          </Animated.View>
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
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 108,
  },
  stepperScroll: {
    marginTop: 14,
    flexGrow: 0,
    flexShrink: 0,
  },
  stepperRow: {
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  stepperItemWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperItem: {
    alignItems: 'center',
    width: 58,
  },
  stepperDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: Palette.borderInput,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperDotCurrent: {
    backgroundColor: Palette.purple,
    borderColor: Palette.purple,
  },
  stepperDotPast: {
    backgroundColor: Palette.green,
    borderColor: Palette.green,
  },
  stepperDotText: {
    fontFamily: Type.bodyBold,
    fontSize: 12,
    color: Palette.inkFaint,
  },
  stepperDotTextCurrent: {
    color: Palette.white,
  },
  stepperLabel: {
    marginTop: 4,
    fontFamily: Type.bodyRegular,
    fontSize: 12,
    lineHeight: 12,
    textAlign: 'center',
    color: Palette.inkFaint,
  },
  stepperLabelCurrent: {
    fontFamily: Type.bodyBold,
    color: Palette.purple,
  },
  stepperConnector: {
    width: 14,
    height: 2,
    backgroundColor: Palette.track,
    marginBottom: 16,
  },
  summaryCard: {
    marginTop: 14,
    backgroundColor: Palette.purpleCard,
    borderWidth: 1,
    borderColor: Palette.purpleCardBorder,
    borderRadius: Radius.cardSmall,
    padding: 14,
  },
  summaryLabel: {
    fontFamily: Type.bodyBold,
    fontSize: 12,
    color: Palette.purple,
  },
  summaryProgress: {
    marginTop: 4,
    fontFamily: Type.headingSemiBold,
    fontSize: 14.5,
    color: Palette.ink,
  },
  sectionHeader: {
    fontFamily: Type.headingSemiBold,
    fontSize: 18,
    lineHeight: 24,
    color: Palette.ink,
    marginBottom: 10,
    marginTop: 22,
  },
  milestoneWrap: {
    marginBottom: 8,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.cardSmall,
    padding: 12,
  },
  milestoneRowNext: {
    borderColor: Palette.purple,
    borderWidth: 2,
    backgroundColor: Palette.purpleCard,
    padding: 16,
  },
  milestoneDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneEmoji: {
    fontSize: 16,
  },
  nextLabel: {
    fontFamily: Type.bodyBold,
    fontSize: 12,
    color: Palette.purple,
    marginBottom: 2,
  },
  milestoneTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 14,
    color: Palette.ink,
  },
  milestoneTitleNext: {
    fontSize: 16.5,
    color: Palette.purpleDark,
  },
  milestoneTitleLocked: {
    color: Palette.inkPlaceholder,
  },
  milestoneDescription: {
    marginTop: 2,
    fontFamily: Type.bodyRegular,
    fontSize: 12,
    color: Palette.inkMuted,
  },
  detailCard: {
    marginTop: 6,
    backgroundColor: Palette.surfaceSubtle,
    borderWidth: 1,
    borderColor: Palette.divider,
    borderRadius: Radius.cardSmall,
    padding: 14,
    gap: 2,
  },
  detailLabel: {
    marginTop: 8,
    fontFamily: Type.bodyBold,
    fontSize: 12,
    color: Palette.inkPlaceholder,
  },
  detailValue: {
    marginTop: 2,
    fontFamily: Type.bodyRegular,
    fontSize: 13,
    lineHeight: 18,
    color: Palette.inkBody,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  sourceLink: {
    fontFamily: Type.bodyBold,
    fontSize: 12.5,
    color: Palette.purple,
  },
  askArriButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: Palette.purple,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  askArriButtonText: {
    fontFamily: Type.bodySemiBold,
    fontSize: 12.5,
    color: Palette.white,
  },
  goalsTree: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.divider,
  },
  goalsTreeLabel: {
    fontFamily: Type.bodyBold,
    fontSize: 12,
    letterSpacing: 0.4,
    color: Palette.inkMuted,
    marginBottom: 8,
  },
  goalRow: {
    flexDirection: 'row',
    gap: 10,
  },
  goalRail: {
    width: 20,
    alignItems: 'center',
  },
  goalDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Palette.borderInput,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalDotDone: {
    backgroundColor: Palette.green,
    borderColor: Palette.green,
  },
  goalLine: {
    width: 2,
    flex: 1,
    minHeight: 10,
    backgroundColor: Palette.track,
    marginVertical: 2,
  },
  goalLabel: {
    fontFamily: Type.bodySemiBold,
    fontSize: 12.5,
    color: Palette.ink,
    paddingBottom: 10,
  },
  goalLabelDone: {
    color: Palette.inkPlaceholder,
    textDecorationLine: 'line-through',
  },
  goalSemester: {
    marginTop: -8,
    fontFamily: Type.bodyRegular,
    fontSize: 12,
    color: Palette.inkPlaceholder,
  },
  goalsTreeArrow: {
    alignItems: 'center',
    marginTop: 2,
  },
  goalsTreeArrowText: {
    fontFamily: Type.bodySemiBold,
    fontSize: 12,
    color: Palette.purple,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupHeader: {
    fontFamily: Type.headingSemiBold,
    fontSize: 13,
    color: Palette.inkMuted,
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
  cardTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 13,
    color: Palette.ink,
  },
  cardDate: {
    marginTop: 2,
    fontFamily: Type.bodyRegular,
    fontSize: 12,
    color: Palette.inkPlaceholder,
  },
  stepViewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  stepViewLinkText: {
    fontFamily: Type.bodyBold,
    fontSize: 12,
    color: Palette.purple,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  cardStatusLabel: {
    fontFamily: Type.bodyBold,
    fontSize: 12,
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
});

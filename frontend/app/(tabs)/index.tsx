import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  ListIcon,
  BellIcon,
  CaretRightIcon,
  NewspaperIcon,
  BriefcaseIcon,
  BuildingsIcon,
  CheckCircleIcon,
  WarningCircleIcon,
} from 'phosphor-react-native';

import { getAIStatus, getUserProfile, getTimeline, getDocuments, getNews, getInternships } from '@/api';
import { useAuth } from '@/AuthContext';
import { ArrivoLogo } from '@/components/arrivo-logo';
import { SideMenu } from '@/components/side-menu';
import { ProgressRing } from '@/components/ui/progress-ring';
import { NewsThumb } from '@/components/ui/news-thumb';
import { Skeleton } from '@/components/ui/skeleton';
import { Palette, Radius, Spacing, Type } from '@/constants/theme';
import { computeOptSpine, formatDate } from '@/utils/date-spine';

const MATCH_THRESHOLD = 70;

interface Profile {
  name?: string;
  major?: string;
  program_start_date?: string;
  program_end_date?: string;
  streak_days?: number;
}

interface TimelineStep {
  task: string;
  done: boolean;
  link?: string;
  date_range?: string;
  warning?: boolean;
}

interface NewsItem {
  id?: string;
  title: string;
  tag?: string;
  link?: string;
  image_url?: string;
  created_at?: string;
}

interface InternshipItem {
  id?: string;
  title: string;
  company?: string;
  logo_url?: string;
  match_score?: number;
}

function greetingWord(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function isWithinLastDay(dateStr?: string): boolean {
  if (!dateStr) return false;
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return false;
  return Date.now() - then < 24 * 60 * 60 * 1000;
}

// A subtle looping opacity pulse — used on the "needs attention" banner's
// icon so it reads as live/urgent without being distracting.
function PulsingIcon({ children }: { children: React.ReactNode }) {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

function HomeSkeleton() {
  return (
    <View style={{ paddingTop: 62, gap: 14 }}>
      <Skeleton style={{ height: 28, width: '70%' }} />
      <Skeleton style={{ height: 90, borderRadius: Radius.cardSmall }} />
      <Skeleton style={{ height: 90, borderRadius: Radius.cardSmall }} />
      <Skeleton style={{ height: 44, borderRadius: Radius.cardSmall }} />
      <Skeleton style={{ height: 44, borderRadius: Radius.cardSmall }} />
      <Skeleton style={{ height: 80, borderRadius: Radius.cardSmall }} />
      <Skeleton style={{ height: 64, borderRadius: Radius.cardSmall }} />
    </View>
  );
}

export default function HomeScreen() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [steps, setSteps] = useState<TimelineStep[]>([]);
  const [missingDocs, setMissingDocs] = useState(0);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [internships, setInternships] = useState<InternshipItem[]>([]);
  const [internshipCount, setInternshipCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const lastFetchedAt = useRef(0);

  const loadAll = useCallback(async () => {
    if (!token || !user) return;
    await Promise.all([
      getUserProfile(user.id, token).then(setProfile).catch(() => {}),
      getAIStatus(token)
        .then((data) => setAiMessage(data.ai_message))
        .catch(() => {}),
      getTimeline(token)
        .then((data) => setSteps(data.steps ?? []))
        .catch(() => {}),
      getDocuments(token)
        .then((data) => {
          const list = Array.isArray(data) ? data : data.documents ?? [];
          setMissingDocs(list.filter((d: { collected?: boolean }) => !d.collected).length);
        })
        .catch(() => {}),
      getNews(token)
        .then((data) => setNews(data.news ?? []))
        .catch(() => {}),
      getInternships(token, {})
        .then((data) => {
          const results: InternshipItem[] = data.results ?? [];
          setInternships(results.slice(0, 2));
          // data.count is Adzuna's raw total for the whole query (can be in
          // the tens of thousands) - never a "matches for you" figure. The
          // only real match signal is the per-item score already computed
          // on the page of results actually returned.
          const strongMatches = results.filter((r) => (r.match_score ?? 0) >= MATCH_THRESHOLD);
          setInternshipCount(strongMatches.length);
        })
        .catch(() => {}),
    ]);
  }, [token, user]);

  // Refetch on every focus, not just on mount — tabs stay mounted when you
  // switch away, so a plain useEffect would keep showing stale data after
  // answering questions elsewhere. Throttled to 15s so quickly flicking
  // between tabs doesn't re-fire all six calls (including two OpenAI/Adzuna-
  // backed ones) every single time — any real change always takes longer
  // than that to make.
  useFocusEffect(
    useCallback(() => {
      if (Date.now() - lastFetchedAt.current < 15000) return;
      lastFetchedAt.current = Date.now();
      loadAll();
    }, [loadAll])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    lastFetchedAt.current = Date.now();
    await loadAll();
    setRefreshing(false);
  };

  const spine =
    profile?.program_start_date && profile?.program_end_date
      ? computeOptSpine(profile.program_start_date, profile.program_end_date)
      : null;

  const upcoming = steps.filter((s) => !s.done);
  const nextStep = upcoming[0];
  const urgentStepCount = upcoming.filter((s) => s.warning).length;
  const actionCount = urgentStepCount + (missingDocs > 0 ? 1 : 0);
  const newsTodayCount = news.filter((n) => isWithinLastDay(n.created_at)).length || news.length;

  const urgentDays = spine ? spine.daysToWindow : null;
  const isUrgentDeadline = urgentDays !== null && urgentDays >= 0 && urgentDays <= 30;
  const firstName = profile?.name?.split(' ')[0];

  let greetingLine = `${greetingWord()}${firstName ? `, ${firstName}` : ''}`;
  if (isUrgentDeadline) {
    greetingLine += ` — your OPT window opens in ${urgentDays} day${urgentDays === 1 ? '' : 's'}`;
  } else if (profile?.streak_days && profile.streak_days > 0) {
    greetingLine += ` \u{1F525} ${profile.streak_days}`;
  }

  const cappedInternshipCount = Math.min(internshipCount, 99);
  const opportunityLabel =
    internshipCount === 0
      ? 'New opportunities available'
      : `${cappedInternshipCount}${internshipCount > 99 ? '+' : ''} opportunit${internshipCount === 1 ? 'y' : 'ies'} matching ${profile?.major || 'your profile'}`;

  const isInitialLoading = profile === null && !refreshing;

  return (
    <Animated.View style={styles.root} entering={FadeIn.duration(220)}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Palette.purple} colors={[Palette.purple]} />
        }>
        {isInitialLoading ? (
          <HomeSkeleton />
        ) : (
          <>
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.greeting}>{greetingLine}</Text>
                <Text style={styles.subtitle}>Here&apos;s what matters today.</Text>
              </View>
              <Pressable style={styles.iconButton} onPress={() => setMenuOpen(true)}>
                <ListIcon size={18} color={Palette.inkBody} />
              </Pressable>
              <Pressable style={[styles.iconButton, { marginLeft: 8 }]} onPress={() => router.push('/notification-settings')}>
                <BellIcon size={18} color={Palette.inkBody} weight="fill" />
                <View style={styles.notifDot} />
              </Pressable>
            </View>

            <Animated.View
              entering={FadeInUp.duration(300)}
              style={[styles.actionBadge, actionCount === 0 && styles.actionBadgeOk]}>
              {actionCount > 0 ? (
                <>
                  <PulsingIcon>
                    <WarningCircleIcon size={14} color={Palette.amber} weight="fill" />
                  </PulsingIcon>
                  <Text style={styles.actionBadgeText}>
                    {actionCount} {actionCount === 1 ? 'thing needs' : 'things need'} your attention
                  </Text>
                </>
              ) : (
                <>
                  <CheckCircleIcon size={14} color={Palette.green} weight="fill" />
                  <Text style={[styles.actionBadgeText, styles.actionBadgeTextOk]}>You are on track</Text>
                </>
              )}
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(300)}>
              <Pressable style={styles.aiCard} onPress={() => router.push('/chat')}>
                <View style={styles.aiCardHeader}>
                  <View style={styles.aiIconSquare}>
                    <ArrivoLogo size={13} />
                  </View>
                  <Text style={styles.aiCardTitle}>Arri AI</Text>
                </View>
                <Text style={styles.aiCardMessage}>{aiMessage ?? 'Loading your latest guidance...'}</Text>
                <Pressable style={styles.aiCardButton} onPress={() => router.push('/(tabs)/journey')}>
                  <Text style={styles.aiCardButtonText}>View my next steps</Text>
                  <CaretRightIcon size={12} color={Palette.white} weight="bold" />
                </Pressable>
              </Pressable>
            </Animated.View>

            <Text style={styles.sectionHeader}>YOUR STATUS</Text>
            <Animated.View entering={FadeInUp.delay(60).duration(350)}>
              <Pressable style={styles.statusCard} onPress={() => router.push('/deadline/opt-application')}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusLabel}>OPT APPLICATION</Text>
                  <Text style={styles.statusNumber}>
                    {spine ? Math.max(spine.daysToWindow, 0) : '--'} days
                  </Text>
                  <Text style={styles.statusDate}>{spine ? formatDate(spine.optWindowOpens) : ''}</Text>
                  <Text style={styles.statusPercent}>{spine?.programElapsedPercent ?? 0}% through your program</Text>
                </View>
                <View style={styles.ringColumn}>
                  <ProgressRing percent={spine?.programElapsedPercent ?? 0} size={92}>
                    <Text style={styles.ringPercent}>{spine?.programElapsedPercent ?? 0}%</Text>
                  </ProgressRing>
                  {profile?.program_end_date ? (
                    <Text style={styles.ringDate}>Ends {formatDate(profile.program_end_date)}</Text>
                  ) : null}
                </View>
              </Pressable>
              <Pressable onPress={() => router.push('/(tabs)/journey')}>
                <Text style={styles.linkText}>View timeline</Text>
              </Pressable>
            </Animated.View>

            <Text style={styles.sectionHeader}>TODAY</Text>
            <Animated.View entering={FadeInUp.delay(100).duration(350)} style={styles.todayGroup}>
              <Pressable style={styles.todayRow} onPress={() => router.push('/(tabs)/news')}>
                <NewspaperIcon size={16} color={Palette.purple} />
                <Text style={styles.todayText}>
                  {newsTodayCount} update{newsTodayCount === 1 ? '' : 's'} relevant to your F1 status
                </Text>
                <CaretRightIcon size={14} color={Palette.chevron} />
              </Pressable>
              <Pressable style={styles.todayRow} onPress={() => router.push('/(tabs)/internships')}>
                <BriefcaseIcon size={16} color={Palette.purple} />
                <Text style={styles.todayText}>{opportunityLabel}</Text>
                <CaretRightIcon size={14} color={Palette.chevron} />
              </Pressable>
            </Animated.View>

            <Text style={styles.sectionHeader}>NEXT STEP</Text>
            {nextStep ? (
              <Animated.View entering={FadeInUp.delay(140).duration(350)} style={styles.nextStepCard}>
                <Text style={styles.nextStepTitle}>{nextStep.task}</Text>
                <Text style={styles.nextStepBody}>
                  {nextStep.date_range ? `Due ${nextStep.date_range}` : 'Tap to view details and mark it done.'}
                </Text>
                <Pressable style={styles.nextStepButton} onPress={() => router.push('/(tabs)/journey')}>
                  <Text style={styles.nextStepButtonText}>View in Journey</Text>
                </Pressable>
              </Animated.View>
            ) : (
              <Text style={styles.emptyText}>Nothing pending — check back soon.</Text>
            )}

            <View style={styles.rowBetween}>
              <Text style={styles.sectionHeader}>FOR YOU</Text>
              <Pressable onPress={() => router.push('/(tabs)/news')}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>

            {news[0] && (
              <Animated.View entering={FadeInUp.delay(180).duration(320)}>
                <Pressable style={styles.forYouCard} onPress={() => router.push('/(tabs)/news')}>
                  <NewsThumb imageUrl={news[0].image_url} tag={news[0].tag} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.forYouTitle} numberOfLines={2}>{news[0].title}</Text>
                    {news[0].tag ? <Text style={styles.forYouMeta}>{news[0].tag}</Text> : null}
                  </View>
                </Pressable>
              </Animated.View>
            )}

            {internships.map((item, index) => (
              <Animated.View key={item.id ?? index} entering={FadeInUp.delay(220 + index * 45).duration(320)}>
                <Pressable style={styles.forYouCard} onPress={() => router.push('/(tabs)/internships')}>
                  {item.logo_url ? (
                    <View style={styles.forYouLogoWrap}>
                      <Animated.Image source={{ uri: item.logo_url }} style={styles.forYouLogo} />
                    </View>
                  ) : (
                    <View style={styles.forYouIconTile}>
                      <BuildingsIcon size={16} color={Palette.purple} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.forYouTitle} numberOfLines={1}>{item.title}</Text>
                    {item.company ? <Text style={styles.forYouMeta}>{item.company}</Text> : null}
                  </View>
                  {typeof item.match_score === 'number' ? (
                    <View style={styles.matchBadge}>
                      <Text style={styles.matchBadgeText}>{item.match_score}%</Text>
                    </View>
                  ) : null}
                </Pressable>
              </Animated.View>
            ))}
          </>
        )}
      </ScrollView>

      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 62,
    paddingBottom: 12,
  },
  greeting: {
    fontFamily: Type.headingBold,
    fontSize: 25,
    lineHeight: 30,
    letterSpacing: -0.3,
    color: Palette.ink,
  },
  subtitle: {
    marginTop: 4,
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.inkFaint,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: Palette.dividerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.danger,
    borderWidth: 1.5,
    borderColor: Palette.white,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 108,
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: Palette.amberTint,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  actionBadgeOk: {
    backgroundColor: Palette.greenTint,
  },
  actionBadgeText: {
    fontFamily: Type.bodyBold,
    fontSize: 12,
    color: Palette.amber,
  },
  actionBadgeTextOk: {
    color: Palette.green,
  },
  aiCard: {
    backgroundColor: Palette.purpleCard,
    borderWidth: 1,
    borderColor: Palette.purpleCardBorder,
    borderRadius: Radius.cardSmall,
    padding: 11,
    marginTop: 4,
    shadowColor: Palette.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  aiIconSquare: {
    width: 20,
    height: 20,
    borderRadius: 7,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiCardTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 13,
    color: Palette.ink,
  },
  aiCardMessage: {
    marginTop: 7,
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    lineHeight: 18,
    color: Palette.inkBody,
  },
  aiCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: Palette.purple,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 11,
  },
  aiCardButtonText: {
    fontFamily: Type.bodySemiBold,
    fontSize: 12,
    color: Palette.white,
  },
  sectionHeader: {
    fontFamily: Type.headingSemiBold,
    fontSize: 12,
    letterSpacing: 0.6,
    color: Palette.inkPlaceholder,
    marginTop: 18,
    marginBottom: 8,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.cardSmall,
    padding: 13,
    gap: 10,
    shadowColor: Palette.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  statusLabel: {
    fontFamily: Type.bodyBold,
    fontSize: 11,
    letterSpacing: 0.4,
    color: Palette.inkMuted,
  },
  statusNumber: {
    marginTop: 4,
    fontFamily: Type.headingBold,
    fontSize: 26,
    letterSpacing: -0.3,
    color: Palette.ink,
  },
  statusDate: {
    marginTop: 2,
    fontFamily: Type.bodyRegular,
    fontSize: 12,
    color: Palette.inkPlaceholder,
  },
  statusPercent: {
    marginTop: 6,
    fontFamily: Type.bodySemiBold,
    fontSize: 12,
    color: Palette.inkFaint,
  },
  ringColumn: {
    alignItems: 'center',
  },
  ringPercent: {
    fontFamily: Type.headingBold,
    fontSize: 14,
    color: Palette.ink,
  },
  ringDate: {
    marginTop: 6,
    fontFamily: Type.bodyRegular,
    fontSize: 10.5,
    color: Palette.inkPlaceholder,
  },
  linkText: {
    marginTop: 8,
    fontFamily: Type.bodyBold,
    fontSize: 12.5,
    color: Palette.purple,
  },
  todayGroup: {
    gap: 6,
  },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.cardSmall,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  todayText: {
    flex: 1,
    fontFamily: Type.bodySemiBold,
    fontSize: 13,
    color: Palette.ink,
  },
  nextStepCard: {
    backgroundColor: Palette.purpleCard,
    borderWidth: 1,
    borderColor: Palette.purpleCardBorder,
    borderRadius: Radius.cardSmall,
    padding: 13,
  },
  nextStepTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 14,
    color: Palette.ink,
  },
  nextStepBody: {
    marginTop: 3,
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.inkBody,
  },
  nextStepButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: Palette.purple,
    borderRadius: 9,
    paddingVertical: 7,
    paddingHorizontal: 13,
  },
  nextStepButtonText: {
    fontFamily: Type.bodySemiBold,
    fontSize: 12.5,
    color: Palette.white,
  },
  emptyText: {
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.inkPlaceholder,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seeAll: {
    fontFamily: Type.bodyBold,
    fontSize: 12.5,
    color: Palette.purple,
  },
  forYouCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.cardSmall,
    padding: 10,
    marginBottom: 8,
    shadowColor: Palette.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.035,
    shadowRadius: 5,
    elevation: 1,
  },
  forYouIconTile: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Palette.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forYouLogoWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Palette.dividerLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  forYouLogo: {
    width: 32,
    height: 32,
  },
  forYouTitle: {
    fontFamily: Type.bodySemiBold,
    fontSize: 12.5,
    color: Palette.ink,
  },
  forYouMeta: {
    marginTop: 1,
    fontFamily: Type.bodyRegular,
    fontSize: 11.5,
    color: Palette.inkFaint,
  },
  matchBadge: {
    backgroundColor: Palette.greenTint,
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  matchBadgeText: {
    fontFamily: Type.bodyBold,
    fontSize: 11,
    color: Palette.green,
  },
});

import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import {
  ListIcon,
  BellIcon,
  CaretRightIcon,
  NewspaperIcon,
  BriefcaseIcon,
  FireIcon,
  WarningCircleIcon,
} from 'phosphor-react-native';

import { getAIStatus, getUserProfile, getTimeline, getDocuments, getNews, getInternships } from '@/api';
import { useAuth } from '@/AuthContext';
import { ArrivoLogo } from '@/components/arrivo-logo';
import { SideMenu } from '@/components/side-menu';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Palette, Radius, Spacing, Type } from '@/constants/theme';
import { computeOptSpine, formatDate } from '@/utils/date-spine';

interface Profile {
  name?: string;
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
  created_at?: string;
}

interface InternshipItem {
  id?: string;
  title: string;
  company?: string;
}

function greeting(): string {
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
  const lastFetchedAt = useRef(0);

  // Refetch on every focus, not just on mount — tabs stay mounted when you
  // switch away, so a plain useEffect would keep showing stale data after
  // answering questions elsewhere. Throttled to 15s so quickly flicking
  // between tabs doesn't re-fire all six calls (including two OpenAI/Adzuna-
  // backed ones) every single time — any real change always takes longer
  // than that to make.
  useFocusEffect(
    useCallback(() => {
      if (!token || !user) return;
      if (Date.now() - lastFetchedAt.current < 15000) return;
      lastFetchedAt.current = Date.now();
      getUserProfile(user.id, token).then(setProfile).catch(() => {});
      getAIStatus(token)
        .then((data) => setAiMessage(data.ai_message))
        .catch(() => {});
      getTimeline(token)
        .then((data) => setSteps(data.steps ?? []))
        .catch(() => {});
      getDocuments(token)
        .then((data) => {
          const list = Array.isArray(data) ? data : data.documents ?? [];
          setMissingDocs(list.filter((d: { collected?: boolean }) => !d.collected).length);
        })
        .catch(() => {});
      getNews(token)
        .then((data) => setNews(data.news ?? []))
        .catch(() => {});
      getInternships(token, {})
        .then((data) => {
          setInternships((data.results ?? []).slice(0, 2));
          setInternshipCount(data.count ?? data.results?.length ?? 0);
        })
        .catch(() => {});
    }, [token, user])
  );

  const spine =
    profile?.program_start_date && profile?.program_end_date
      ? computeOptSpine(profile.program_start_date, profile.program_end_date)
      : null;

  const upcoming = steps.filter((s) => !s.done);
  const nextStep = upcoming[0];
  const urgentStepCount = upcoming.filter((s) => s.warning).length;
  const actionCount = urgentStepCount + (missingDocs > 0 ? 1 : 0);
  const newsTodayCount = news.filter((n) => isWithinLastDay(n.created_at)).length || news.length;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>
              {greeting()}{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}
            </Text>
            <View style={styles.subtitleRow}>
              <Text style={styles.subtitle}>Here&apos;s what matters today.</Text>
              {!!profile?.streak_days && profile.streak_days > 0 && (
                <View style={styles.streakBadge}>
                  <FireIcon size={11} color={Palette.amber} weight="fill" />
                  <Text style={styles.streakText}>{profile.streak_days}</Text>
                </View>
              )}
            </View>
          </View>
          <Pressable style={styles.iconButton} onPress={() => setMenuOpen(true)}>
            <ListIcon size={18} color={Palette.inkBody} />
          </Pressable>
          <Pressable style={[styles.iconButton, { marginLeft: 8 }]} onPress={() => router.push('/notification-settings')}>
            <BellIcon size={18} color={Palette.inkBody} weight="fill" />
            <View style={styles.notifDot} />
          </Pressable>
        </View>

        {actionCount > 0 && (
          <Animated.View entering={FadeInUp.duration(300)} style={styles.actionBadge}>
            <WarningCircleIcon size={14} color={Palette.amber} weight="fill" />
            <Text style={styles.actionBadgeText}>
              {actionCount} {actionCount === 1 ? 'thing needs' : 'things need'} your attention
            </Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.duration(300)}>
          <Pressable style={styles.aiCard} onPress={() => router.push('/chat')}>
            <View style={styles.aiCardHeader}>
              <View style={styles.aiIconSquare}>
                <ArrivoLogo size={14} />
              </View>
              <Text style={styles.aiCardTitle}>Arri AI</Text>
            </View>
            <Text style={styles.aiCardMessage} numberOfLines={3}>
              {aiMessage ?? 'Loading your latest guidance...'}
            </Text>
            <Pressable style={styles.aiCardButton} onPress={() => router.push('/(tabs)/journey')}>
              <Text style={styles.aiCardButtonText}>View my next steps</Text>
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
            <ProgressRing percent={spine?.programElapsedPercent ?? 0}>
              <Text style={styles.ringPercent}>{spine?.programElapsedPercent ?? 0}%</Text>
            </ProgressRing>
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
              {newsTodayCount} new immigration {newsTodayCount === 1 ? 'update' : 'updates'}
            </Text>
            <CaretRightIcon size={14} color={Palette.chevron} />
          </Pressable>
          <Pressable style={styles.todayRow} onPress={() => router.push('/(tabs)/internships')}>
            <BriefcaseIcon size={16} color={Palette.purple} />
            <Text style={styles.todayText}>
              {internshipCount} new internship {internshipCount === 1 ? 'match' : 'matches'}
            </Text>
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
          <Pressable style={styles.forYouCard} onPress={() => router.push('/(tabs)/news')}>
            <View style={styles.forYouIconTile}>
              <NewspaperIcon size={16} color={Palette.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.forYouTitle} numberOfLines={2}>{news[0].title}</Text>
              {news[0].tag ? <Text style={styles.forYouMeta}>{news[0].tag}</Text> : null}
            </View>
          </Pressable>
        )}

        {internships.map((item, index) => (
          <Pressable
            key={item.id ?? index}
            style={styles.forYouCard}
            onPress={() => router.push('/(tabs)/internships')}>
            <View style={styles.forYouIconTile}>
              <BriefcaseIcon size={16} color={Palette.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.forYouTitle} numberOfLines={1}>{item.title}</Text>
              {item.company ? <Text style={styles.forYouMeta}>{item.company}</Text> : null}
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
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
    fontSize: 20,
    color: Palette.ink,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  subtitle: {
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.inkFaint,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Palette.amberTint,
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  streakText: {
    fontFamily: Type.bodyBold,
    fontSize: 11,
    color: Palette.amber,
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
  actionBadgeText: {
    fontFamily: Type.bodyBold,
    fontSize: 12,
    color: Palette.amber,
  },
  aiCard: {
    backgroundColor: Palette.purpleCard,
    borderWidth: 1,
    borderColor: Palette.purpleCardBorder,
    borderRadius: Radius.cardSmall,
    padding: 13,
    marginTop: 4,
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  aiIconSquare: {
    width: 22,
    height: 22,
    borderRadius: 8,
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
    marginTop: 8,
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    lineHeight: 18,
    color: Palette.inkBody,
  },
  aiCardButton: {
    alignSelf: 'flex-start',
    marginTop: 9,
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
  ringPercent: {
    fontFamily: Type.headingBold,
    fontSize: 14,
    color: Palette.ink,
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
  },
  forYouIconTile: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Palette.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
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
});

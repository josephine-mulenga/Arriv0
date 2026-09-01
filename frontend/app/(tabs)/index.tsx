import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import {
  ListIcon,
  BellIcon,
  SparkleIcon,
  CaretRightIcon,
  FolderSimpleIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  CircleIcon,
  ClockIcon,
} from 'phosphor-react-native';

import { getAIStatus, getUserProfile, getTimeline, getDocuments } from '@/api';
import { useAuth } from '@/AuthContext';
import { SideMenu } from '@/components/side-menu';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Palette, Radius, Spacing, Type } from '@/constants/theme';
import { computeOptSpine, formatDate } from '@/utils/date-spine';

interface Profile {
  name?: string;
  program_start_date?: string;
  program_end_date?: string;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [steps, setSteps] = useState<{ task: string; done: boolean; date_range?: string }[]>([]);
  const [missingDocs, setMissingDocs] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  // Refetch on every focus, not just on mount — tabs stay mounted when you
  // switch away, so a plain useEffect would keep showing stale data after
  // answering questions elsewhere (e.g. Complete Your Profile, Documents).
  useFocusEffect(
    useCallback(() => {
      if (!token || !user) return;
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
    }, [token, user])
  );

  const spine =
    profile?.program_start_date && profile?.program_end_date
      ? computeOptSpine(profile.program_start_date, profile.program_end_date)
      : null;

  const upcoming = steps.filter((s) => !s.done).slice(0, 3);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>
            {greeting()}{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''} 👋
          </Text>
          <Text style={styles.subtitle}>Here&apos;s your journey for today.</Text>
        </View>
        <Pressable style={styles.iconButton} onPress={() => setMenuOpen(true)}>
          <ListIcon size={19} color={Palette.inkBody} />
        </Pressable>
        <Pressable style={[styles.iconButton, { marginLeft: 8 }]} onPress={() => router.push('/notification-settings')}>
          <BellIcon size={19} color={Palette.inkBody} weight="fill" />
          <View style={styles.notifDot} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(400)}>
          <Pressable style={styles.aiCard} onPress={() => router.push('/chat')}>
            <View style={styles.aiCardHeader}>
              <View style={styles.aiIconSquare}>
                <SparkleIcon size={15} color={Palette.white} weight="fill" />
              </View>
              <Text style={styles.aiCardTitle}>Arri AI says</Text>
              <View style={{ flex: 1 }} />
              <CaretRightIcon size={16} color={Palette.inkFaint} />
            </View>
            <Text style={styles.aiCardMessage}>{aiMessage ?? 'Loading your latest guidance...'}</Text>
          </Pressable>
        </Animated.View>

        <Text style={styles.sectionHeader}>Your Status</Text>
        <Pressable
          style={styles.statusCard}
          onPress={() => router.push('/deadline/opt-application')}>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusLabel}>OPT application window opens</Text>
            <Text style={styles.statusNumber}>{spine ? Math.max(spine.daysToWindow, 0) : '--'} days</Text>
            <Text style={styles.statusDate}>{spine ? formatDate(spine.optWindowOpens) : ''}</Text>
          </View>
          <ProgressRing percent={spine?.programElapsedPercent ?? 0}>
            <Text style={styles.ringPercent}>{spine?.programElapsedPercent ?? 0}%</Text>
            <Text style={styles.ringSubLabel}>of program</Text>
          </ProgressRing>
        </Pressable>

        <View style={styles.rowBetween}>
          <Text style={styles.sectionHeader}>Upcoming</Text>
          <Pressable onPress={() => router.push('/(tabs)/timeline')}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>

        {upcoming.length === 0 ? (
          <Text style={styles.emptyText}>Nothing upcoming right now — check back soon.</Text>
        ) : (
          upcoming.map((step, index) => (
            <View key={index} style={styles.upcomingRow}>
              <View style={styles.upcomingIconTile}>
                <ClockIcon size={18} color={Palette.purple} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.upcomingTitle} numberOfLines={1}>{step.task}</Text>
                <Text style={styles.upcomingDate} numberOfLines={1}>{step.date_range ?? ''}</Text>
              </View>
              {step.done ? (
                <CheckCircleIcon size={19} color={Palette.green} weight="fill" />
              ) : (
                <CircleIcon size={19} color={Palette.inkDisabled} />
              )}
            </View>
          ))
        )}

        <View style={styles.quickRow}>
          <Pressable style={styles.quickTile} onPress={() => router.push('/documents')}>
            <FolderSimpleIcon size={20} color={Palette.purple} />
            <Text style={styles.quickTitle}>Documents</Text>
            <Text style={styles.quickSubtitle}>
              {missingDocs > 0 ? `${missingDocs} missing` : 'All tracked'}
            </Text>
          </Pressable>
          <Pressable style={styles.quickTile} onPress={() => router.push('/search')}>
            <MagnifyingGlassIcon size={20} color={Palette.purple} />
            <Text style={styles.quickTitle}>Search</Text>
            <Text style={styles.quickSubtitle}>Deadlines, docs, news</Text>
          </Pressable>
        </View>
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
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 16,
  },
  greeting: {
    fontFamily: Type.headingBold,
    fontSize: 22,
    color: Palette.ink,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: Type.bodyRegular,
    fontSize: 13,
    color: Palette.inkFaint,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
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
  aiCard: {
    backgroundColor: Palette.purpleCard,
    borderWidth: 1,
    borderColor: Palette.purpleCardBorder,
    borderRadius: 18,
    padding: 15,
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  aiIconSquare: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: Palette.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiCardTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 14,
    color: Palette.ink,
  },
  aiCardMessage: {
    marginTop: 10,
    fontFamily: Type.bodyRegular,
    fontSize: 13.5,
    lineHeight: 21,
    color: Palette.inkBody,
  },
  sectionHeader: {
    fontFamily: Type.headingSemiBold,
    fontSize: 15,
    color: Palette.ink,
    marginTop: Spacing.sectionGap,
    marginBottom: Spacing.cardGap,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.cardLarge,
    padding: Spacing.cardPaddingLarge,
    gap: 12,
  },
  statusLabel: {
    fontFamily: Type.bodyRegular,
    fontSize: 13.5,
    color: Palette.inkMuted,
  },
  statusNumber: {
    marginTop: 6,
    fontFamily: Type.headingBold,
    fontSize: 32,
    letterSpacing: -0.32,
    color: Palette.ink,
  },
  statusDate: {
    marginTop: 4,
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.inkPlaceholder,
  },
  ringPercent: {
    fontFamily: Type.headingBold,
    fontSize: 16,
    color: Palette.ink,
  },
  ringSubLabel: {
    fontFamily: Type.bodyRegular,
    fontSize: 9.5,
    color: Palette.inkPlaceholder,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sectionGap,
  },
  seeAll: {
    fontFamily: Type.bodyBold,
    fontSize: 13,
    color: Palette.purple,
    marginBottom: Spacing.cardGap,
  },
  emptyText: {
    fontFamily: Type.bodyRegular,
    fontSize: 13,
    color: Palette.inkPlaceholder,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.cardGap,
  },
  upcomingIconTile: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Palette.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 14,
    color: Palette.ink,
  },
  upcomingDate: {
    marginTop: 2,
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.inkPlaceholder,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.sectionGap,
  },
  quickTile: {
    flex: 1,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.cardSmall,
    padding: Spacing.cardPaddingSmall,
    gap: 4,
  },
  quickTitle: {
    marginTop: 6,
    fontFamily: Type.headingSemiBold,
    fontSize: 14,
    color: Palette.ink,
  },
  quickSubtitle: {
    fontFamily: Type.bodyRegular,
    fontSize: 12,
    color: Palette.inkFaint,
  },
});

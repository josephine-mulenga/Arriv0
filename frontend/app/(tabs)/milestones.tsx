import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ClipboardTextIcon, CaretRightIcon } from 'phosphor-react-native';

import { getMilestones } from '@/api';
import { useAuth } from '@/AuthContext';
import { RailRow } from '@/components/ui/rail-row';
import { Palette, Radius, Spacing, Type } from '@/constants/theme';

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

export default function MilestonesScreen() {
  const { token } = useAuth();
  const [data, setData] = useState<MilestonesData | null>(null);

  useEffect(() => {
    if (!token) return;
    getMilestones(token).then(setData).catch(() => {});
  }, [token]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Milestones</Text>
        {data && (
          <Text style={styles.subtitle}>
            {data.completed} of {data.total} complete since you landed
          </Text>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.promptCard} onPress={() => router.push('/complete-profile')}>
          <ClipboardTextIcon size={20} color={Palette.purple} />
          <View style={{ flex: 1 }}>
            <Text style={styles.promptTitle}>Complete your profile</Text>
            <Text style={styles.promptBody}>
              Answer a few real questions so these milestones reflect your actual status, not a
              guess based on your year.
            </Text>
          </View>
          <CaretRightIcon size={16} color={Palette.chevron} />
        </Pressable>

        {data?.milestones.map((item, index) => {
          const isLast = index === data.milestones.length - 1;

          if (item.status === 'done') {
            return (
              <RailRow key={item.id} dotColor={Palette.green} dotFilled dotSize={13} isLast={isLast}>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDescription}>{item.description}</Text>
                </View>
              </RailRow>
            );
          }

          if (item.status === 'next') {
            return (
              <RailRow
                key={item.id}
                dotColor={Palette.purple}
                dotFilled={false}
                ringWidth={2.5}
                dotSize={13}
                isLast={isLast}>
                <View style={[styles.card, styles.cardInProgress]}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDescription}>{item.description}</Text>
                </View>
              </RailRow>
            );
          }

          return (
            <RailRow
              key={item.id}
              dotColor={Palette.inkDisabled}
              dotFilled={false}
              ringWidth={2.5}
              dotSize={13}
              isLast={isLast}>
              <View style={[styles.card, styles.cardLocked]}>
                <Text style={[styles.cardTitle, styles.cardTitleLocked]}>{item.title}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </View>
            </RailRow>
          );
        })}

        {!data && <Text style={styles.emptyText}>Loading your milestones...</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.white,
  },
  header: {
    paddingTop: 62,
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 16,
  },
  title: {
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
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 108,
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.purpleCard,
    borderWidth: 1,
    borderColor: Palette.purpleCardBorder,
    borderRadius: Radius.cardSmall,
    padding: 14,
    marginBottom: Spacing.sectionGap,
  },
  promptTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 14,
    color: Palette.ink,
  },
  promptBody: {
    marginTop: 2,
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    lineHeight: 18,
    color: Palette.inkBody,
  },
  card: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.cardSmall,
    padding: 14,
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
    fontSize: 14,
    color: Palette.ink,
  },
  cardTitleLocked: {
    color: Palette.inkPlaceholder,
  },
  cardDescription: {
    marginTop: 4,
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    lineHeight: 18,
    color: Palette.inkMuted,
  },
  emptyText: {
    fontFamily: Type.bodyRegular,
    fontSize: 13,
    color: Palette.inkPlaceholder,
  },
});

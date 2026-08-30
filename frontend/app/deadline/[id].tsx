import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  CaretLeftIcon,
  CheckCircleIcon,
  CircleIcon,
  SparkleIcon,
  FolderSimpleIcon,
} from 'phosphor-react-native';

import { getUserProfile } from '@/api';
import { useAuth } from '@/AuthContext';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Palette, Radius, Spacing, Type } from '@/constants/theme';
import { computeOptSpine, formatDate } from '@/utils/date-spine';
import { getStepCompletion, setStepCompletion } from '@/utils/step-completion';

interface StepDef {
  key: string;
  title: string;
  meta: string;
}

interface DeadlineContent {
  title: string;
  explainer: string;
  steps: StepDef[];
  commonMistake: string;
}

const DEADLINE_CONTENT: Record<string, DeadlineContent> = {
  'opt-application': {
    title: 'OPT Application Window',
    explainer:
      'Standard OPT lets you work in the U.S. for up to 12 months after your program ends. ' +
      'You can file up to 90 days before your program end date and must file within 60 days ' +
      'after it — the six steps below cover everything USCIS requires.',
    steps: [
      { key: 'dso-recommendation', title: 'DSO recommendation', meta: 'Request your SEVIS recommendation from your DSO' },
      { key: 'i765', title: 'Complete I-765', meta: 'Fill out Form I-765 online via USCIS' },
      { key: 'photos', title: 'Passport photos', meta: 'Get two passport-style photos' },
      { key: 'fee', title: '$520 fee', meta: 'Pay the USCIS filing fee' },
      { key: 'submit-30-days', title: 'Submit within 30 days', meta: 'File within 30 days of your SEVIS recommendation' },
      { key: 'i797c', title: 'Save the I-797C receipt', meta: 'Keep your receipt notice — you will need it' },
    ],
    commonMistake:
      'Many students miss the 30-day filing window after their DSO signs the recommendation. ' +
      'Mark your calendar the day you receive it.',
  },
};

export default function DeadlineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<{ program_start_date?: string; program_end_date?: string } | null>(null);
  const [completion, setCompletion] = useState<Record<string, boolean>>({});

  const deadlineId = id ?? 'opt-application';
  const content = DEADLINE_CONTENT[deadlineId] ?? DEADLINE_CONTENT['opt-application'];

  useEffect(() => {
    if (user && token) {
      getUserProfile(user.id, token).then(setProfile).catch(() => {});
    }
    getStepCompletion(deadlineId).then(setCompletion);
  }, [user, token, deadlineId]);

  const spine =
    profile?.program_start_date && profile?.program_end_date
      ? computeOptSpine(profile.program_start_date, profile.program_end_date)
      : null;

  const toggleStep = async (stepKey: string) => {
    const next = !completion[stepKey];
    setCompletion((prev) => ({ ...prev, [stepKey]: next }));
    await setStepCompletion(deadlineId, stepKey, next);
  };

  const handleRemindMe = async () => {
    if (!spine) return;
    try {
      const Notifications = await import('expo-notifications');
      const trigger = spine.optWindowOpens;
      if (trigger.getTime() <= Date.now()) {
        Alert.alert('Already open', 'Your OPT window has already opened.');
        return;
      }
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Your OPT window is open',
          body: `You can now file your OPT application (${content.title}).`,
        },
        trigger: { type: 'date', date: trigger } as never,
      });
      Alert.alert('Reminder set', `We'll remind you on ${formatDate(trigger)}.`);
    } catch {
      Alert.alert("Couldn't set reminder", 'Please try again.');
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <CaretLeftIcon size={20} color={Palette.ink} weight="bold" />
        </Pressable>
        <Text style={styles.title}>{content.title}</Text>

        <View style={styles.pillRow}>
          {spine && (
            <View style={styles.pillDate}>
              <Text style={styles.pillDateText}>
                {formatDate(spine.optWindowOpens)} – {formatDate(spine.optWindowCloses)}
              </Text>
            </View>
          )}
          {spine && (
            <View style={styles.pillCountdown}>
              <Text style={styles.pillCountdownText}>{Math.max(spine.daysToWindow, 0)} days</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.explainer}>{content.explainer}</Text>

        <Text style={styles.sectionHeader}>Your steps</Text>
        {content.steps.map((step) => {
          const done = !!completion[step.key];
          return (
            <Pressable key={step.key} style={styles.stepRow} onPress={() => toggleStep(step.key)}>
              {done ? (
                <CheckCircleIcon size={20} color={Palette.green} weight="fill" />
              ) : (
                <CircleIcon size={20} color={Palette.chevron} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, done && styles.stepTitleDone]}>{step.title}</Text>
                <Text style={styles.stepMeta}>{step.meta}</Text>
              </View>
            </Pressable>
          );
        })}

        <View style={styles.mistakeCard}>
          <SparkleIcon size={18} color={Palette.purple} weight="fill" />
          <Text style={styles.mistakeText}>{content.commonMistake}</Text>
          <Pressable onPress={() => router.push('/chat')}>
            <Text style={styles.mistakeLink}>Ask about my case →</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={spine ? `Remind me ${formatDate(spine.optWindowOpens)}` : 'Remind me'}
          onPress={handleRemindMe}
          style={{ flex: 1 }}
        />
        <Pressable style={styles.folderButton} onPress={() => router.push('/documents')}>
          <FolderSimpleIcon size={19} color={Palette.inkBody} />
        </Pressable>
      </View>
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
    borderBottomWidth: 1,
    borderBottomColor: Palette.divider,
    gap: 12,
  },
  title: {
    fontFamily: Type.headingBold,
    fontSize: 22,
    lineHeight: 29,
    color: Palette.ink,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillDate: {
    backgroundColor: Palette.dividerLight,
    borderRadius: 9,
    paddingVertical: 6,
    paddingHorizontal: 11,
  },
  pillDateText: {
    fontFamily: Type.bodySemiBold,
    fontSize: 12,
    color: Palette.inkBody,
  },
  pillCountdown: {
    backgroundColor: Palette.purpleTint,
    borderRadius: 9,
    paddingVertical: 6,
    paddingHorizontal: 11,
  },
  pillCountdownText: {
    fontFamily: Type.bodyBold,
    fontSize: 12,
    color: Palette.purple,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 18,
    paddingBottom: 30,
  },
  explainer: {
    fontFamily: Type.bodyRegular,
    fontSize: 13.5,
    lineHeight: 22,
    color: Palette.inkBody,
  },
  sectionHeader: {
    fontFamily: Type.headingSemiBold,
    fontSize: 15,
    color: Palette.ink,
    marginTop: Spacing.sectionGap,
    marginBottom: Spacing.cardGap,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 14,
    padding: 13,
    marginBottom: 8,
  },
  stepTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 14,
    color: Palette.ink,
  },
  stepTitleDone: {
    color: Palette.inkPlaceholder,
    textDecorationLine: 'line-through',
  },
  stepMeta: {
    marginTop: 2,
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.inkFaint,
  },
  mistakeCard: {
    backgroundColor: Palette.purpleCard,
    borderWidth: 1,
    borderColor: Palette.purpleCardBorder,
    borderRadius: 18,
    padding: Spacing.cardPaddingLarge,
    marginTop: Spacing.sectionGap,
    gap: 8,
  },
  mistakeText: {
    fontFamily: Type.bodyRegular,
    fontSize: 13.5,
    lineHeight: 21,
    color: Palette.inkBody,
  },
  mistakeLink: {
    fontFamily: Type.bodyBold,
    fontSize: 13,
    color: Palette.purple,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: Spacing.screenPadding,
    borderTopWidth: 1,
    borderTopColor: Palette.divider,
  },
  folderButton: {
    width: 54,
    borderWidth: 1.5,
    borderColor: Palette.borderInput,
    borderRadius: Radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

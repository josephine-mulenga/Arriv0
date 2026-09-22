import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { GraduationCapIcon, BriefcaseIcon, CheckCircleIcon, CaretLeftIcon } from 'phosphor-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { AnimatedCheck } from '@/components/ui/animated-check';
import { Chip } from '@/components/ui/chip';
import { SignupProgress } from '@/components/ui/signup-progress';
import { DismissKeyboardView } from '@/components/ui/dismiss-keyboard-view';
import { Palette, Radius, Type } from '@/constants/theme';
import { useAuth } from '@/AuthContext';
import { takePendingPassword } from '@/utils/signupDraft';

const concernOptions = [
  'Finding a job or internship',
  'Meeting visa deadlines',
  'Affording tuition or living costs',
  'Adjusting to a new culture',
  'Something else',
];

const afterGraduationOptions = [
  'Apply for OPT and work in the US',
  'Continue to graduate school',
  'Return to my home country',
  'Not sure yet',
];

const plans = [
  {
    key: 'opt',
    title: 'Graduating, then OPT',
    hint: 'Work in the U.S. after my degree',
    icon: GraduationCapIcon,
  },
  {
    key: 'cpt',
    title: 'Internship during study',
    hint: 'CPT for a summer or co-op role',
    icon: BriefcaseIcon,
  },
  {
    key: 'status',
    title: 'Just staying in status',
    hint: 'Coursework only for now',
    icon: CheckCircleIcon,
  },
];

export default function PersonalizeProfileScreen() {
  const params = useLocalSearchParams<{
    name: string;
    email: string;
    school: string;
    major: string;
    visaType: string;
    citizenshipCountry: string;
    programStartDate: string;
    programEndDate: string;
  }>();
  const { name, email, school, major, visaType, citizenshipCountry, programStartDate, programEndDate } = params;

  const [password] = useState(() => takePendingPassword() ?? '');
  const { signup, login, loading, error } = useAuth();

  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const togglePlan = (key: string) => {
    setSelectedPlans((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  };

  const [biggestConcern, setBiggestConcern] = useState<string | null>(null);
  const [hasJobOffer, setHasJobOffer] = useState<boolean | null>(null);
  const [plansAfterGraduation, setPlansAfterGraduation] = useState<string | null>(null);
  const [workExperienceMonths, setWorkExperienceMonths] = useState('');

  const [referralCode, setReferralCode] = useState('');
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const handleCreateAccount = async () => {
    try {
      const result = await signup(
        email,
        password,
        name,
        school,
        (visaType as 'F1' | 'J1' | 'M1') || 'F1',
        programStartDate,
        programEndDate,
        major?.trim() || undefined,
        undefined,
        undefined,
        undefined,
        referralCode.trim() || undefined,
        biggestConcern ?? undefined,
        hasJobOffer ?? false,
        plansAfterGraduation ?? undefined,
        workExperienceMonths ? Number(workExperienceMonths) : 0,
        citizenshipCountry || undefined
      );
      // When email confirmation is required there's no session to log into
      // yet - logging in here would just fail with an unrelated "Invalid
      // email or password" (the account exists but isn't confirmed), which
      // buried the fact that signup itself actually succeeded.
      if (result?.email_confirmation_required) {
        setNeedsEmailConfirmation(true);
        return;
      }
      await login(email, password);
      router.replace('/notification-permission');
    } catch {
      // error is already captured by useAuth's error state
    }
  };

  if (needsEmailConfirmation) {
    return (
      <View style={styles.confirmationRoot}>
        <CheckCircleIcon size={48} color={Palette.green} weight="fill" />
        <Text style={styles.confirmationTitle}>Account created!</Text>
        <Text style={styles.confirmationSubtitle}>
          Please check your email and click the confirmation link to get started.
        </Text>
        <PrimaryButton label="Back to log in" onPress={() => router.replace('/login')} style={styles.confirmationButton} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}>
      <View style={styles.topRow}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <CaretLeftIcon size={18} color={Palette.ink} weight="bold" />
        </Pressable>
        <SignupProgress step={3} />
      </View>

      <DismissKeyboardView>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Almost there</Text>
          <Text style={styles.subtitle}>This helps Arriv0 personalize your experience.</Text>

          <Text style={styles.sectionHeader}>YOUR GOALS</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>What are you planning next?</Text>
            <View style={styles.planList}>
              {plans.map((p) => {
                const selected = selectedPlans.includes(p.key);
                const PlanIcon = p.icon;
                return (
                  <PressableScale
                    key={p.key}
                    scaleTo={0.97}
                    style={[styles.planRow, selected && styles.planRowSelected]}
                    onPress={() => togglePlan(p.key)}>
                    <PlanIcon size={19} color={selected ? Palette.purple : Palette.inkMuted} weight={selected ? 'fill' : 'regular'} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.planTitle}>{p.title}</Text>
                      <Text style={styles.planHint}>{p.hint}</Text>
                    </View>
                    <AnimatedCheck done={selected} />
                  </PressableScale>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>What are your plans after graduation?</Text>
            <View style={styles.chipWrap}>
              {afterGraduationOptions.map((option) => (
                <Chip
                  key={option}
                  label={option}
                  selected={plansAfterGraduation === option}
                  onPress={() => setPlansAfterGraduation(option)}
                />
              ))}
            </View>
          </View>

          <Text style={styles.sectionHeader}>YOUR SITUATION</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>What&apos;s your biggest concern right now?</Text>
            <View style={styles.chipWrap}>
              {concernOptions.map((option) => (
                <Chip
                  key={option}
                  label={option}
                  selected={biggestConcern === option}
                  onPress={() => setBiggestConcern(option)}
                />
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Do you already have a job or internship offer?</Text>
            <View style={styles.segmentRow}>
              <PressableScale
                style={[styles.segment, hasJobOffer === true && styles.segmentSelected]}
                onPress={() => setHasJobOffer(true)}>
                <Text style={[styles.segmentText, hasJobOffer === true && styles.segmentTextSelected]}>Yes</Text>
              </PressableScale>
              <PressableScale
                style={[styles.segment, hasJobOffer === false && styles.segmentSelected]}
                onPress={() => setHasJobOffer(false)}>
                <Text style={[styles.segmentText, hasJobOffer === false && styles.segmentTextSelected]}>No</Text>
              </PressableScale>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Months of US work experience (if any)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={Palette.inkPlaceholder}
              value={workExperienceMonths}
              onChangeText={(v) => setWorkExperienceMonths(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
            />
          </View>

          <Text style={styles.sectionHeader}>REFERRAL</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Referral code (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Got a code from a friend?"
              placeholderTextColor={Palette.inkPlaceholder}
              value={referralCode}
              onChangeText={(v) => setReferralCode(v.toUpperCase())}
              autoCapitalize="characters"
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <PrimaryButton
            label={loading ? 'Creating account...' : 'Finish Setup'}
            onPress={handleCreateAccount}
            loading={loading}
            style={styles.submitButton}
          />

          <Pressable onPress={handleCreateAccount} disabled={loading} style={styles.skipLink}>
            <Text style={styles.skipLinkText}>Skip for now</Text>
          </Pressable>

          <Text style={styles.legalText}>
            By signing up, you agree to our{' '}
            <Text
              style={styles.legalLink}
              onPress={() => Linking.openURL('https://www.freeprivacypolicy.com/live/6d431a24-221e-4dfc-aa18-ebd77fc28f93')}>
              Privacy Policy
            </Text>{' '}
            and{' '}
            <Text
              style={styles.legalLink}
              onPress={() => Linking.openURL('https://www.freeprivacypolicy.com/live/994c0a00-5d88-47e1-99a9-1ef79f7be6f8')}>
              Terms of Service
            </Text>
          </Text>
        </ScrollView>
      </DismissKeyboardView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.white,
    paddingTop: 62,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: Palette.dividerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmationRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 26,
    backgroundColor: Palette.white,
  },
  confirmationTitle: {
    fontFamily: Type.headingBold,
    fontSize: 24,
    textAlign: 'center',
    color: Palette.ink,
  },
  confirmationSubtitle: {
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    textAlign: 'center',
    color: Palette.inkFaint,
    marginBottom: 4,
  },
  confirmationButton: {
    marginTop: 8,
  },
  content: {
    padding: 26,
    paddingTop: 18,
    gap: 14,
  },
  fieldGroup: {
    gap: 7,
  },
  title: {
    fontFamily: Type.headingBold,
    fontSize: 25,
    textAlign: 'center',
    color: Palette.ink,
  },
  subtitle: {
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    textAlign: 'center',
    color: Palette.inkFaint,
    marginTop: -8,
    marginBottom: 4,
  },
  sectionHeader: {
    fontFamily: Type.headingSemiBold,
    fontSize: 12,
    letterSpacing: 0.6,
    color: Palette.inkPlaceholder,
    marginTop: 6,
  },
  fieldLabel: {
    fontFamily: Type.bodyBold,
    fontSize: 12.5,
    color: Palette.inkMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: Palette.borderInput,
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.input,
    paddingHorizontal: 14,
    height: 48,
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    color: Palette.ink,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  segment: {
    flex: 1,
    height: 44,
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: Palette.borderInput,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: Palette.purpleTint,
    borderWidth: 1.5,
    borderColor: Palette.purple,
  },
  segmentText: {
    fontFamily: Type.bodyBold,
    fontSize: 14,
    color: Palette.inkFaint,
  },
  segmentTextSelected: {
    color: Palette.purple,
  },
  planList: {
    gap: 8,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 13,
  },
  planRowSelected: {
    backgroundColor: Palette.purpleTint,
    borderColor: Palette.purple,
  },
  planTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 14.5,
    color: Palette.ink,
  },
  planHint: {
    fontFamily: Type.bodyRegular,
    fontSize: 12,
    color: Palette.inkFaint,
    marginTop: 1,
  },
  errorText: {
    color: Palette.danger,
    fontFamily: Type.bodyRegular,
    fontSize: 13,
  },
  submitButton: {
    marginTop: 4,
  },
  skipLink: {
    marginTop: 4,
    alignSelf: 'center',
  },
  skipLinkText: {
    fontFamily: Type.bodySemiBold,
    fontSize: 13.5,
    color: Palette.inkFaint,
  },
  legalText: {
    fontFamily: Type.bodyRegular,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    color: Palette.inkFaint,
  },
  legalLink: {
    color: Palette.purple,
    textDecorationLine: 'underline',
  },
});

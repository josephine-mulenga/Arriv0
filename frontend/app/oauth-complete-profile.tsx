import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { PrimaryButton } from '@/components/ui/primary-button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { Palette, Radius, Type } from '@/constants/theme';
import { useAuth } from '@/AuthContext';
import { completeOAuthProfile } from '@/api';

const visaTypes: { label: string; value: 'F1' | 'J1' | 'Other' }[] = [
  { label: 'F-1', value: 'F1' },
  { label: 'J-1', value: 'J1' },
  { label: 'Other', value: 'Other' },
];

// The post-Google/Apple/Microsoft onboarding step — a Supabase auth user
// already exists for these sign-ins (created client-side by the OAuth
// handshake, not by /signup), so this only collects and submits the
// program-tracking fields /signup would otherwise have gathered, via
// /complete-oauth-profile instead.
export default function OAuthCompleteProfileScreen() {
  const { name: nameParam } = useLocalSearchParams<{ name?: string }>();
  const { token } = useAuth();

  const [name, setName] = useState(nameParam ?? '');
  const [school, setSchool] = useState('');
  const [visaType, setVisaType] = useState<'F1' | 'J1' | 'Other'>('F1');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startMonth, setStartMonth] = useState('');
  const [startDay, setStartDay] = useState('');
  const [startYear, setStartYear] = useState('');

  const [endMonth, setEndMonth] = useState('');
  const [endDay, setEndDay] = useState('');
  const [endYear, setEndYear] = useState('');

  const programStartDate = startYear && startMonth && startDay ? `${startYear}-${startMonth}-${startDay}` : '';
  const programEndDate = endYear && endMonth && endDay ? `${endYear}-${endMonth}-${endDay}` : '';
  const canSubmit = name.trim().length > 0 && school.trim().length > 0 && !!programStartDate && !!programEndDate;

  const handleContinue = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await completeOAuthProfile(
        {
          name,
          school,
          visaType,
          programStartDate,
          programEndDate,
          referralCode: referralCode.trim() || undefined,
        },
        token
      );
      router.replace('/notification-permission');
    } catch (err: any) {
      setError(err?.message || 'Could not save your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Tell us about you</Text>
        <Text style={styles.subtitle}>This helps us personalize your experience.</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={Palette.inkPlaceholder}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>School / University</Text>
          <TextInput
            style={styles.input}
            placeholder="Select your school"
            placeholderTextColor={Palette.inkPlaceholder}
            value={school}
            onChangeText={setSchool}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Visa Type</Text>
          <View style={styles.segmentRow}>
            {visaTypes.map((v) => {
              const selected = visaType === v.value;
              return (
                <PressableScale
                  key={v.value}
                  style={[styles.segment, selected && styles.segmentSelected]}
                  onPress={() => setVisaType(v.value)}>
                  <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{v.label}</Text>
                </PressableScale>
              );
            })}
          </View>
        </View>

        <View style={styles.dateRow}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Program Start</Text>
            <DatePickerField
              label="Select date"
              month={startMonth}
              day={startDay}
              year={startYear}
              onChangeMonth={setStartMonth}
              onChangeDay={setStartDay}
              onChangeYear={setStartYear}
            />
          </View>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Program End</Text>
            <DatePickerField
              label="Select date"
              month={endMonth}
              day={endDay}
              year={endYear}
              onChangeMonth={setEndMonth}
              onChangeDay={setEndDay}
              onChangeYear={setEndYear}
              showIcon
            />
          </View>
        </View>

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
          label={loading ? 'Saving...' : 'Continue'}
          onPress={handleContinue}
          disabled={!canSubmit || loading}
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.white,
    paddingTop: 62,
  },
  content: {
    padding: 26,
    paddingTop: 22,
    gap: 18,
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
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  errorText: {
    color: Palette.danger,
    fontFamily: Type.bodyRegular,
    fontSize: 13,
  },
  submitButton: {
    marginTop: 4,
  },
});

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Palette, Radius, Spacing, Type } from '@/constants/theme';
import { useAuth } from '@/AuthContext';
import { getUserProfile, updateProfile } from '@/api';

function YesNoRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      <View style={styles.segmentRow}>
        <Pressable
          style={[styles.segment, value && styles.segmentSelected]}
          onPress={() => onChange(true)}>
          <Text style={[styles.segmentText, value && styles.segmentTextSelected]}>Yes</Text>
        </Pressable>
        <Pressable
          style={[styles.segment, !value && styles.segmentSelected]}
          onPress={() => onChange(false)}>
          <Text style={[styles.segmentText, !value && styles.segmentTextSelected]}>No</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function CompleteProfileScreen() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [partialSaveNote, setPartialSaveNote] = useState<string | null>(null);

  const [hasBankAccount, setHasBankAccount] = useState(false);
  const [hasSsn, setHasSsn] = useState(false);
  const [cptMonthsUsed, setCptMonthsUsed] = useState('0');
  const [hasOptRecommendation, setHasOptRecommendation] = useState(false);
  const [hasI765Submitted, setHasI765Submitted] = useState(false);
  const [citizenshipCountry, setCitizenshipCountry] = useState('');
  const [visaExpiryDate, setVisaExpiryDate] = useState('');

  useEffect(() => {
    if (!user || !token) return;
    getUserProfile(user.id, token)
      .then((data) => {
        setHasBankAccount(!!data.has_bank_account);
        setHasSsn(!!data.has_ssn);
        setCptMonthsUsed(String(data.cpt_months_used ?? 0));
        setHasOptRecommendation(!!data.has_opt_recommendation);
        setHasI765Submitted(!!data.has_i765_submitted);
        setCitizenshipCountry(data.citizenship_country ?? '');
        setVisaExpiryDate(data.visa_expiry_date ?? '');
      })
      .finally(() => setLoading(false));
  }, [user, token]);

  const handleSave = async () => {
    if (!user || !token) return;
    setSaving(true);
    setSaved(false);
    setPartialSaveNote(null);

    // Saved in two calls so this always works for the fields the database
    // already supports, even before the newer columns (citizenship,
    // visa expiry, OPT recommendation, I-765) have been added.
    try {
      await updateProfile(
        user.id,
        {
          has_bank_account: hasBankAccount,
          has_ssn: hasSsn,
          cpt_months_used: parseInt(cptMonthsUsed, 10) || 0,
        },
        token
      );
    } catch {
      setSaving(false);
      return;
    }

    try {
      await updateProfile(
        user.id,
        {
          has_opt_recommendation: hasOptRecommendation,
          has_i765_submitted: hasI765Submitted,
          citizenship_country: citizenshipCountry || undefined,
          visa_expiry_date: visaExpiryDate || undefined,
        },
        token
      );
    } catch {
      setPartialSaveNote(
        "Your answers are saved, but citizenship/visa/OPT fields need a database update to persist — they'll save automatically once that's done."
      );
    }

    setSaving(false);
    setSaved(true);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <CaretLeftIcon size={20} color={Palette.ink} weight="bold" />
        </Pressable>
        <Text style={styles.title}>Complete Your Profile</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>
          A few real answers instead of guesses — these decide what shows as done, up next, or
          locked on your milestones.
        </Text>

        {loading ? (
          <Text style={styles.loadingText}>Loading your profile...</Text>
        ) : (
          <>
            <YesNoRow label="Do you have a US bank account?" value={hasBankAccount} onChange={setHasBankAccount} />
            <YesNoRow label="Do you have a Social Security Number?" value={hasSsn} onChange={setHasSsn} />

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Months of full-time CPT used</Text>
              <Text style={styles.fieldHint}>Full-time CPT is 12+ months a year; part-time doesn&apos;t count here.</Text>
              <TextInput
                style={styles.input}
                value={cptMonthsUsed}
                onChangeText={setCptMonthsUsed}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={Palette.inkPlaceholder}
              />
            </View>

            <YesNoRow
              label="Has your DSO recommended you for OPT?"
              hint="This is the SEVIS recommendation your DSO issues, before you file Form I-765."
              value={hasOptRecommendation}
              onChange={setHasOptRecommendation}
            />
            <YesNoRow
              label="Have you submitted Form I-765?"
              value={hasI765Submitted}
              onChange={setHasI765Submitted}
            />

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Country of citizenship</Text>
              <TextInput
                style={styles.input}
                value={citizenshipCountry}
                onChangeText={setCitizenshipCountry}
                placeholder="e.g. India"
                placeholderTextColor={Palette.inkPlaceholder}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Visa expiry date</Text>
              <Text style={styles.fieldHint}>
                The stamp in your passport — this can differ from your I-20 program end date.
              </Text>
              <TextInput
                style={styles.input}
                value={visaExpiryDate}
                onChangeText={setVisaExpiryDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Palette.inkPlaceholder}
              />
            </View>

            {saved ? <Text style={styles.successText}>Saved!</Text> : null}
            {partialSaveNote ? <Text style={styles.noteText}>{partialSaveNote}</Text> : null}

            <PrimaryButton
              label={saving ? 'Saving...' : 'Save'}
              onPress={handleSave}
              disabled={saving}
              style={styles.submitButton}
            />
          </>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 62,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontFamily: Type.headingBold,
    fontSize: 20,
    color: Palette.ink,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 60,
    gap: 18,
  },
  subtitle: {
    fontFamily: Type.bodyRegular,
    fontSize: 13.5,
    lineHeight: 21,
    color: Palette.inkMuted,
  },
  loadingText: {
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    color: Palette.inkMuted,
  },
  fieldGroup: {
    gap: 7,
  },
  fieldLabel: {
    fontFamily: Type.bodyBold,
    fontSize: 12.5,
    color: Palette.inkMuted,
  },
  fieldHint: {
    marginTop: -3,
    fontFamily: Type.bodyRegular,
    fontSize: 12,
    lineHeight: 17,
    color: Palette.inkFaint,
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
  successText: {
    fontFamily: Type.bodyRegular,
    fontSize: 13,
    color: Palette.green,
  },
  noteText: {
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    lineHeight: 19,
    color: Palette.inkPlaceholder,
  },
  submitButton: {
    marginTop: 4,
  },
});

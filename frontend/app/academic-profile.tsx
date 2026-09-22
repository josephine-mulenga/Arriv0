import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import { SignupProgress } from '@/components/ui/signup-progress';
import { DismissKeyboardView } from '@/components/ui/dismiss-keyboard-view';
import { Palette, Radius, Type } from '@/constants/theme';
import { COUNTRIES } from '@/utils/countries';

const visaTypes: { label: string; value: 'F1' | 'J1' | 'M1' }[] = [
  { label: 'F-1', value: 'F1' },
  { label: 'J-1', value: 'J1' },
  { label: 'M-1', value: 'M1' },
];

export default function AcademicProfileScreen() {
  const { name, email } = useLocalSearchParams<{ name: string; email: string }>();

  const [country, setCountry] = useState<string | null>(null);
  const [school, setSchool] = useState('');
  const [major, setMajor] = useState('');
  const [visaType, setVisaType] = useState<'F1' | 'J1' | 'M1'>('F1');

  const [startMonth, setStartMonth] = useState('');
  const [startDay, setStartDay] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [endDay, setEndDay] = useState('');
  const [endYear, setEndYear] = useState('');

  const programStartDate = startYear && startMonth && startDay ? `${startYear}-${startMonth}-${startDay}` : '';
  const programEndDate = endYear && endMonth && endDay ? `${endYear}-${endMonth}-${endDay}` : '';
  const canContinue = !!country && school.trim().length > 0 && !!programStartDate && !!programEndDate;

  const handleContinue = () => {
    if (!canContinue) return;
    router.push({
      pathname: '/personalize-profile',
      params: {
        name,
        email,
        school,
        major,
        visaType,
        citizenshipCountry: country ?? '',
        programStartDate,
        programEndDate,
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}>
      <View style={styles.topRow}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <CaretLeftIcon size={18} color={Palette.ink} weight="bold" />
        </Pressable>
        <SignupProgress step={2} />
      </View>

      <DismissKeyboardView>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Your academic profile</Text>
          <Text style={styles.subtitle}>This helps us build your F1 timeline.</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Country of citizenship</Text>
            <SearchableDropdown label="Select your country" value={country} options={COUNTRIES} onSelect={setCountry} />
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
            <Text style={styles.fieldLabel}>Major</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Computer Science"
              placeholderTextColor={Palette.inkPlaceholder}
              value={major}
              onChangeText={setMajor}
            />
            <Text style={styles.fieldHint}>Used to personalize your news, timeline, and internship matches.</Text>
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
          <Text style={styles.fieldHint}>
            Your year level is calculated automatically from these dates — no need to enter it separately.
          </Text>

          <PrimaryButton label="Continue" onPress={handleContinue} disabled={!canContinue} style={styles.submitButton} />
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
  content: {
    padding: 26,
    paddingTop: 18,
    gap: 4,
  },
  title: {
    fontFamily: Type.headingBold,
    fontSize: 24,
    color: Palette.ink,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 18,
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    color: Palette.inkFaint,
  },
  fieldGroup: {
    gap: 7,
    marginBottom: 14,
  },
  fieldLabel: {
    fontFamily: Type.bodyBold,
    fontSize: 12.5,
    color: Palette.inkMuted,
  },
  fieldHint: {
    marginTop: -4,
    fontFamily: Type.bodyRegular,
    fontSize: 11.5,
    color: Palette.inkPlaceholder,
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
  submitButton: {
    marginTop: 10,
  },
});

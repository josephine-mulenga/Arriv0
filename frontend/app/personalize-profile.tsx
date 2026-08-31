import { useState } from 'react';
import {
  FlatList,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  CaretDownIcon,
  CalendarBlankIcon,
  GraduationCapIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  CircleIcon,
} from 'phosphor-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Palette, Radius, Type } from '@/constants/theme';
import { useAuth } from '@/AuthContext';

const months = [
  { label: 'January', value: '01' }, { label: 'February', value: '02' }, { label: 'March', value: '03' },
  { label: 'April', value: '04' }, { label: 'May', value: '05' }, { label: 'June', value: '06' },
  { label: 'July', value: '07' }, { label: 'August', value: '08' }, { label: 'September', value: '09' },
  { label: 'October', value: '10' }, { label: 'November', value: '11' }, { label: 'December', value: '12' },
];
const monthLabelByValue: Record<string, string> = Object.fromEntries(
  months.map((m) => [m.value, m.label.slice(0, 3)])
);
const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 15 }, (_, i) => String(currentYear - 5 + i));

const visaTypes: { label: string; value: 'F1' | 'J1' | 'M1' }[] = [
  { label: 'F-1', value: 'F1' },
  { label: 'J-1', value: 'J1' },
  { label: 'M-1', value: 'M1' },
];

const yearLevels = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];

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

function InlineDropdown({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string | null;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.dropdownRow} onPress={onPress}>
      <Text style={value ? styles.dropdownValueFilled : styles.dropdownValuePlaceholder}>
        {value ?? label}
      </Text>
      <CaretDownIcon size={15} color={Palette.inkFaint} />
    </Pressable>
  );
}

function DatePickerField({
  label,
  month,
  day,
  year,
  onChangeMonth,
  onChangeDay,
  onChangeYear,
  showIcon,
}: {
  label: string;
  month: string;
  day: string;
  year: string;
  onChangeMonth: (v: string) => void;
  onChangeDay: (v: string) => void;
  onChangeYear: (v: string) => void;
  showIcon?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const display = month && day && year ? `${monthLabelByValue[month]} ${day}, ${year}` : null;

  return (
    <>
      <Pressable style={styles.dateField} onPress={() => setOpen(true)}>
        <Text style={display ? styles.dropdownValueFilled : styles.dropdownValuePlaceholder} numberOfLines={1}>
          {display ?? label}
        </Text>
        {showIcon && <CalendarBlankIcon size={16} color={Palette.inkFaint} />}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.modalContent}>
            <Text style={styles.modalTitle}>{label}</Text>
            <View style={styles.dateColumns}>
              <PickerColumn
                options={months.map((m) => ({ label: m.label.slice(0, 3), value: m.value }))}
                value={month}
                onSelect={onChangeMonth}
              />
              <PickerColumn options={days.map((d) => ({ label: d, value: d }))} value={day} onSelect={onChangeDay} />
              <PickerColumn options={years.map((y) => ({ label: y, value: y }))} value={year} onSelect={onChangeYear} />
            </View>
            <PrimaryButton label="Done" onPress={() => setOpen(false)} style={{ marginTop: 14 }} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function PickerColumn({
  options,
  value,
  onSelect,
}: {
  options: { label: string; value: string }[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <FlatList
      data={options}
      keyExtractor={(item) => item.value}
      style={styles.pickerColumn}
      renderItem={({ item }) => (
        <Pressable style={styles.pickerOption} onPress={() => onSelect(item.value)}>
          <Text style={item.value === value ? styles.pickerOptionTextSelected : styles.pickerOptionText}>
            {item.label}
          </Text>
        </Pressable>
      )}
    />
  );
}

export default function PersonalizeProfileScreen() {
  const { name, email, password } = useLocalSearchParams<{
    name: string;
    email: string;
    password: string;
  }>();
  const { signup, login, loading, error } = useAuth();

  const [school, setSchool] = useState('');
  const [visaType, setVisaType] = useState<'F1' | 'J1' | 'M1'>('F1');
  const [yearLevel, setYearLevel] = useState<string | null>(null);
  const [yearLevelOpen, setYearLevelOpen] = useState(false);
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const togglePlan = (key: string) => {
    setSelectedPlans((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  };

  const [startMonth, setStartMonth] = useState('');
  const [startDay, setStartDay] = useState('');
  const [startYear, setStartYear] = useState('');

  const [endMonth, setEndMonth] = useState('');
  const [endDay, setEndDay] = useState('');
  const [endYear, setEndYear] = useState('');

  const programStartDate = startYear && startMonth && startDay ? `${startYear}-${startMonth}-${startDay}` : '';
  const programEndDate = endYear && endMonth && endDay ? `${endYear}-${endMonth}-${endDay}` : '';
  const canSubmit = school.trim().length > 0 && !!programStartDate && !!programEndDate;

  const handleCreateAccount = async () => {
    try {
      const result = await signup(email, password, name, school, visaType, programStartDate, programEndDate);
      if (result?.email_confirmation_required) {
        router.replace({ pathname: '/verify-email', params: { email, password } });
        return;
      }
      await login(email, password);
      router.replace('/notification-permission');
    } catch {
      // error is already captured by useAuth's error state
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '66%' }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Tell us about you</Text>
        <Text style={styles.subtitle}>This helps us personalize your experience.</Text>

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
                <Pressable
                  key={v.value}
                  style={[styles.segment, selected && styles.segmentSelected]}
                  onPress={() => setVisaType(v.value)}>
                  <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{v.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Year Level</Text>
          <InlineDropdown label="Select year" value={yearLevel} onPress={() => setYearLevelOpen(true)} />
        </View>
        <Modal visible={yearLevelOpen} transparent animationType="fade" onRequestClose={() => setYearLevelOpen(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setYearLevelOpen(false)}>
            <Pressable style={styles.modalContent}>
              <Text style={styles.modalTitle}>Year Level</Text>
              {yearLevels.map((level) => (
                <Pressable
                  key={level}
                  style={styles.modalOption}
                  onPress={() => {
                    setYearLevel(level);
                    setYearLevelOpen(false);
                  }}>
                  <Text style={level === yearLevel ? styles.modalOptionTextSelected : styles.modalOptionText}>
                    {level}
                  </Text>
                </Pressable>
              ))}
            </Pressable>
          </Pressable>
        </Modal>

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
          <Text style={styles.fieldLabel}>What are you planning next?</Text>
          <View style={styles.planList}>
            {plans.map((p) => {
              const selected = selectedPlans.includes(p.key);
              const PlanIcon = p.icon;
              return (
                <Pressable
                  key={p.key}
                  style={[styles.planRow, selected && styles.planRowSelected]}
                  onPress={() => togglePlan(p.key)}>
                  <PlanIcon size={19} color={selected ? Palette.purple : Palette.inkMuted} weight={selected ? 'fill' : 'regular'} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planTitle}>{p.title}</Text>
                    <Text style={styles.planHint}>{p.hint}</Text>
                  </View>
                  {selected ? (
                    <CheckCircleIcon size={20} color={Palette.purple} weight="fill" />
                  ) : (
                    <CircleIcon size={20} color={Palette.chevron} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PrimaryButton
          label={loading ? 'Creating account...' : 'Continue'}
          onPress={handleCreateAccount}
          disabled={!canSubmit || loading}
          style={styles.submitButton}
        />

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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.white,
    paddingTop: 62,
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: Palette.track,
    marginHorizontal: 26,
    overflow: 'hidden',
  },
  progressFill: {
    height: 5,
    borderRadius: 3,
    backgroundColor: Palette.purple,
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
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderWidth: 1,
    borderColor: Palette.borderInput,
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.input,
    paddingHorizontal: 14,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderWidth: 1,
    borderColor: Palette.borderInput,
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.input,
    paddingHorizontal: 14,
  },
  dropdownValueFilled: {
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    color: Palette.ink,
  },
  dropdownValuePlaceholder: {
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    color: Palette.inkPlaceholder,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Palette.scrim,
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Palette.white,
    borderRadius: Radius.cardLarge,
    padding: 16,
  },
  modalTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 16,
    marginBottom: 8,
    color: Palette.ink,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Palette.dividerLight,
  },
  modalOptionText: {
    fontFamily: Type.bodyRegular,
    color: Palette.ink,
  },
  modalOptionTextSelected: {
    fontFamily: Type.bodyBold,
    color: Palette.purple,
  },
  dateColumns: {
    flexDirection: 'row',
    gap: 6,
  },
  pickerColumn: {
    flex: 1,
    maxHeight: 220,
  },
  pickerOption: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  pickerOptionText: {
    fontFamily: Type.bodyRegular,
    color: Palette.ink,
  },
  pickerOptionTextSelected: {
    fontFamily: Type.bodyBold,
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

import { useState, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  Modal,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { CaretLeftIcon, CaretDownIcon } from 'phosphor-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Palette, Radius, Type } from '@/constants/theme';
import { useAuth } from '@/AuthContext';
import { getUserProfile, updateProfile } from '@/api';

const months = [
  { label: 'January', value: '01' }, { label: 'February', value: '02' }, { label: 'March', value: '03' },
  { label: 'April', value: '04' }, { label: 'May', value: '05' }, { label: 'June', value: '06' },
  { label: 'July', value: '07' }, { label: 'August', value: '08' }, { label: 'September', value: '09' },
  { label: 'October', value: '10' }, { label: 'November', value: '11' }, { label: 'December', value: '12' },
];
const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 15 }, (_, i) => String(currentYear - 5 + i));
const visaTypes = [
  { label: 'F-1', value: 'F1' },
  { label: 'J-1', value: 'J1' },
  { label: 'M-1', value: 'M1' },
];

function splitDate(dateStr) {
  if (!dateStr) return { month: '', day: '', year: '' };
  const [year, month, day] = dateStr.split('-');
  return { month, day, year };
}

function Dropdown({ label, options, value, onSelect, getLabel = (o) => o, getValue = (o) => o }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => getValue(o) === value);

  return (
    <>
      <Pressable style={styles.dropdown} onPress={() => setOpen(true)}>
        <Text style={value ? styles.dropdownTextFilled : styles.dropdownTextPlaceholder}>
          {selected ? getLabel(selected) : label}
        </Text>
        <CaretDownIcon size={15} color={Palette.inkFaint} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => getValue(item)}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.modalOption}
                  onPress={() => {
                    onSelect(getValue(item));
                    setOpen(false);
                  }}>
                  <Text style={getValue(item) === value ? styles.modalOptionTextSelected : styles.modalOptionText}>
                    {getLabel(item)}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function DateDropdownGroup({ label, month, day, year, onChangeMonth, onChangeDay, onChangeYear }) {
  return (
    <View style={styles.dateGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.dateRow}>
        <View style={{ flex: 1.4 }}>
          <Dropdown
            label="Month"
            options={months}
            value={month}
            onSelect={onChangeMonth}
            getLabel={(o) => o.label}
            getValue={(o) => o.value}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Dropdown label="Day" options={days} value={day} onSelect={onChangeDay} />
        </View>
        <View style={{ flex: 1.1 }}>
          <Dropdown label="Year" options={years} value={year} onSelect={onChangeYear} />
        </View>
      </View>
    </View>
  );
}

export default function EditProfileScreen() {
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [major, setMajor] = useState('');
  const [visaType, setVisaType] = useState('F1');
  const [hasBankAccount, setHasBankAccount] = useState(false);

  const [startMonth, setStartMonth] = useState('');
  const [startDay, setStartDay] = useState('');
  const [startYear, setStartYear] = useState('');

  const [endMonth, setEndMonth] = useState('');
  const [endDay, setEndDay] = useState('');
  const [endYear, setEndYear] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getUserProfile(user.id, token);
        setName(data.name || '');
        setSchool(data.school || '');
        setMajor(data.major || '');
        setVisaType(data.visa_type || 'F1');
        setHasBankAccount(!!data.has_bank_account);

        const start = splitDate(data.program_start_date);
        setStartMonth(start.month);
        setStartDay(start.day);
        setStartYear(start.year);

        const end = splitDate(data.program_end_date);
        setEndMonth(end.month);
        setEndDay(end.day);
        setEndYear(end.year);
      } catch {
        setError('Could not load your profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    if (token && user) loadProfile();
  }, [token, user]);

  const programStartDate = startYear && startMonth && startDay ? `${startYear}-${startMonth}-${startDay}` : '';
  const programEndDate = endYear && endMonth && endDay ? `${endYear}-${endMonth}-${endDay}` : '';
  const canSave = name.trim().length > 0 && school.trim().length > 0 && !!programStartDate && !!programEndDate;

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaved(false);
      await updateProfile(
        user.id,
        {
          name,
          school,
          major,
          visa_type: visaType,
          program_start_date: programStartDate,
          program_end_date: programEndDate,
          has_bank_account: hasBankAccount,
        },
        token
      );
      setSaved(true);
      setTimeout(() => router.back(), 800);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <CaretLeftIcon size={20} color={Palette.ink} weight="bold" />
        </Pressable>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {loading ? (
          <Text style={styles.bodyText}>Loading your profile...</Text>
        ) : (
          <>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Full name</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={Palette.inkPlaceholder} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>School</Text>
              <TextInput style={styles.input} value={school} onChangeText={setSchool} placeholder="School" placeholderTextColor={Palette.inkPlaceholder} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Major</Text>
              <TextInput style={styles.input} value={major} onChangeText={setMajor} placeholder="Major (optional)" placeholderTextColor={Palette.inkPlaceholder} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Visa Type</Text>
              <Dropdown
                label="Visa Type"
                options={visaTypes}
                value={visaType}
                onSelect={setVisaType}
                getLabel={(o) => o.label}
                getValue={(o) => o.value}
              />
            </View>

            <DateDropdownGroup
              label="Program start date"
              month={startMonth}
              day={startDay}
              year={startYear}
              onChangeMonth={setStartMonth}
              onChangeDay={setStartDay}
              onChangeYear={setStartYear}
            />

            <DateDropdownGroup
              label="Program end date"
              month={endMonth}
              day={endDay}
              year={endYear}
              onChangeMonth={setEndMonth}
              onChangeDay={setEndDay}
              onChangeYear={setEndYear}
            />

            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>I have a US bank account</Text>
              <Switch
                value={hasBankAccount}
                onValueChange={setHasBankAccount}
                trackColor={{ false: Palette.borderInput, true: Palette.purple }}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {saved ? <Text style={styles.successText}>Saved!</Text> : null}

            <PrimaryButton
              label={saving ? 'Saving...' : 'Save Changes'}
              onPress={handleSave}
              disabled={!canSave || saving}
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
  content: { padding: 26, paddingTop: 0, gap: 14, paddingBottom: 40 },
  fieldGroup: { gap: 7 },
  bodyText: {
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    color: Palette.inkMuted,
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
  dateGroup: { gap: 6 },
  dateRow: { flexDirection: 'row', gap: 8 },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Palette.borderInput,
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.input,
    height: 48,
    paddingHorizontal: 14,
  },
  dropdownTextFilled: { fontFamily: Type.bodyRegular, fontSize: 14, color: Palette.ink },
  dropdownTextPlaceholder: { fontFamily: Type.bodyRegular, fontSize: 14, color: Palette.inkPlaceholder },
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
  modalOptionText: { fontFamily: Type.bodyRegular, color: Palette.ink },
  modalOptionTextSelected: { fontFamily: Type.bodyBold, color: Palette.purple },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButton: { marginTop: 8 },
  errorText: { fontFamily: Type.bodyRegular, color: Palette.danger, fontSize: 13 },
  successText: { fontFamily: Type.bodyRegular, color: Palette.green, fontSize: 13 },
});

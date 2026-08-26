import { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, ScrollView, Modal, FlatList, Switch } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientHeaderBackground } from '@/components/gradient-header-background';
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
const visaTypes = ['F1', 'J1', 'M1'];

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
      <TouchableOpacity style={styles.dropdown} onPress={() => setOpen(true)}>
        <ThemedText style={value ? styles.dropdownTextFilled : styles.dropdownTextPlaceholder}>
          {selected ? getLabel(selected) : label}
        </ThemedText>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>{label}</ThemedText>
            <FlatList
              data={options}
              keyExtractor={(item) => getValue(item)}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    onSelect(getValue(item));
                    setOpen(false);
                  }}>
                  <ThemedText
                    style={getValue(item) === value ? styles.modalOptionTextSelected : styles.modalOptionText}>
                    {getLabel(item)}
                  </ThemedText>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function DateDropdownGroup({ label, month, day, year, onChangeMonth, onChangeDay, onChangeYear }) {
  return (
    <View style={styles.dateGroup}>
      <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
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
      } catch (err) {
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
    <ThemedView style={styles.container}>
      <View style={{ height: 100 }}>
        <GradientHeaderBackground />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText style={styles.backButton}>← Back</ThemedText>
        </TouchableOpacity>

        <ThemedText style={styles.title}>Edit Profile</ThemedText>

        {loading ? (
          <ThemedText>Loading your profile...</ThemedText>
        ) : (
          <>
            <ThemedText style={styles.fieldLabel}>Full name</ThemedText>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full name" />

            <ThemedText style={styles.fieldLabel}>School</ThemedText>
            <TextInput style={styles.input} value={school} onChangeText={setSchool} placeholder="School" />

            <ThemedText style={styles.fieldLabel}>Major</ThemedText>
            <TextInput style={styles.input} value={major} onChangeText={setMajor} placeholder="Major (optional)" />

            <ThemedText style={styles.fieldLabel}>Visa Type</ThemedText>
            <Dropdown label="Visa Type" options={visaTypes} value={visaType} onSelect={setVisaType} />

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

            <ThemedView style={styles.switchRow}>
              <ThemedText style={styles.fieldLabel}>I have a US bank account</ThemedText>
              <Switch
                value={hasBankAccount}
                onValueChange={setHasBankAccount}
                trackColor={{ false: '#ccc', true: '#6C63FF' }}
              />
            </ThemedView>

            {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
            {saved && <ThemedText style={styles.successText}>Saved!</ThemedText>}

            <TouchableOpacity
              style={[styles.button, (!canSave || saving) && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={!canSave || saving}>
              <ThemedText style={styles.buttonText}>{saving ? 'Saving...' : 'Save Changes'}</ThemedText>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 12, paddingBottom: 40 },
  backButton: {
    color: '#6C63FF',
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 26,
    color: '#1A1A2E',
    marginBottom: 4,
  },
  fieldLabel: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 13,
    color: '#6C63FF',
    marginBottom: -6,
  },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  dateGroup: { gap: 6 },
  dateRow: { flexDirection: 'row', gap: 8 },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
  },
  dropdownTextFilled: { color: '#1A1A2E' },
  dropdownTextPlaceholder: { color: '#999' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 16,
    marginBottom: 8,
    color: '#1A1A2E',
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEFF',
  },
  modalOptionText: { color: '#1A1A2E' },
  modalOptionTextSelected: { color: '#6C63FF', fontFamily: 'Fredoka_600SemiBold' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginTop: 8,
  },
  button: { backgroundColor: '#6C63FF', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { backgroundColor: '#C4C0F5' },
  buttonText: { color: '#fff', fontWeight: '600' },
  errorText: { color: 'red' },
  successText: { color: 'green' },
});
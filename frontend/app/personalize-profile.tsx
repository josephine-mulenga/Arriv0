import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, ScrollView, Modal, FlatList, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientHeaderBackground } from '@/components/gradient-header-background';
import { useAuth } from '@/AuthContext';

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
      <ThemedText style={styles.dateGroupLabel}>{label}</ThemedText>
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

export default function PersonalizeProfileScreen() {
  const { name, email, password } = useLocalSearchParams();
  const { signup, login, loading, error } = useAuth();

  const [school, setSchool] = useState('');
  const [visaType, setVisaType] = useState('F1');

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
      await signup(email, password, name, school, visaType, programStartDate, programEndDate);
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err) {
      // error is already captured by useAuth's error state
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
        <ThemedText style={styles.title}>Tell us about you</ThemedText>
        <ThemedText style={styles.subtitle}>This helps us personalize your experience.</ThemedText>

        <ThemedText style={styles.fieldLabel}>School / University</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="Select your school"
          value={school}
          onChangeText={setSchool}
        />

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

        {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}

        <TouchableOpacity
          style={[styles.button, (!canSubmit || loading) && styles.buttonDisabled]}
          onPress={handleCreateAccount}
          disabled={!canSubmit || loading}>
          <ThemedText style={styles.buttonText}>{loading ? 'Creating account...' : 'Continue'}</ThemedText>
        </TouchableOpacity>

        <ThemedText style={styles.legalText}>
          By signing up, you agree to our{' '}
          <ThemedText
            style={styles.legalLink}
            onPress={() => Linking.openURL('https://www.freeprivacypolicy.com/live/6d431a24-221e-4dfc-aa18-ebd77fc28f93')}>
            Privacy Policy
          </ThemedText>{' '}
          and{' '}
          <ThemedText
            style={styles.legalLink}
            onPress={() => Linking.openURL('https://www.freeprivacypolicy.com/live/994c0a00-5d88-47e1-99a9-1ef79f7be6f8')}>
            Terms of Service
          </ThemedText>
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 12, paddingBottom: 40 },
  title: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 26,
    color: '#1A1A2E',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  fieldLabel: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 13,
    color: '#6C63FF',
    marginBottom: -6,
  },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  dateGroup: { gap: 6 },
  dateGroupLabel: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 13,
    color: '#6C63FF',
  },
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
  button: { backgroundColor: '#6C63FF', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { backgroundColor: '#C4C0F5' },
  buttonText: { color: '#fff', fontWeight: '600' },
  errorText: { color: 'red' },
  legalText: { fontSize: 12, textAlign: 'center', marginTop: 12, color: '#888' },
  legalLink: { fontSize: 12, color: '#6C63FF', textDecorationLine: 'underline' },
});
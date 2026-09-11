import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CalendarBlankIcon } from 'phosphor-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Palette, Radius, Type } from '@/constants/theme';

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

export function DatePickerField({
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
        <Text style={display ? styles.valueFilled : styles.valuePlaceholder} numberOfLines={1}>
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

export function PickerColumn({
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

const styles = StyleSheet.create({
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
  valueFilled: {
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    color: Palette.ink,
  },
  valuePlaceholder: {
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
});

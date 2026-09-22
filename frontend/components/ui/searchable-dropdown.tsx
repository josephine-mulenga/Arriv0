import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CaretDownIcon, MagnifyingGlassIcon } from 'phosphor-react-native';

import { Palette, Radius, Type } from '@/constants/theme';

interface SearchableDropdownProps {
  label: string;
  value: string | null;
  options: string[];
  onSelect: (value: string) => void;
}

// Same visual field as the app's other dropdowns, but with a search box in
// the modal for lists too long to scan (country of citizenship).
export function SearchableDropdown({ label, value, options, onSelect }: SearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [query, options]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Text style={value ? styles.valueFilled : styles.valuePlaceholder} numberOfLines={1}>
          {value ?? label}
        </Text>
        <CaretDownIcon size={15} color={Palette.inkFaint} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.overlay} onPress={close}>
          <Pressable style={styles.content}>
            <Text style={styles.title}>{label}</Text>
            <View style={styles.searchRow}>
              <MagnifyingGlassIcon size={16} color={Palette.inkFaint} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                placeholderTextColor={Palette.inkPlaceholder}
                value={query}
                onChangeText={setQuery}
                autoFocus
              />
            </View>
            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onSelect(item);
                    close();
                  }}>
                  <Text style={item === value ? styles.optionTextSelected : styles.optionText}>{item}</Text>
                </Pressable>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No matches</Text>}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
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
  overlay: {
    flex: 1,
    backgroundColor: Palette.scrim,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: Palette.white,
    borderRadius: Radius.cardLarge,
    padding: 16,
    maxHeight: '70%',
  },
  title: {
    fontFamily: Type.headingSemiBold,
    fontSize: 16,
    marginBottom: 10,
    color: Palette.ink,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.dividerLight,
    borderRadius: Radius.input,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    color: Palette.ink,
  },
  list: {
    maxHeight: 320,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Palette.dividerLight,
  },
  optionText: {
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    color: Palette.ink,
  },
  optionTextSelected: {
    fontFamily: Type.bodyBold,
    fontSize: 14,
    color: Palette.purple,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontFamily: Type.bodyRegular,
    fontSize: 13,
    color: Palette.inkPlaceholder,
  },
});

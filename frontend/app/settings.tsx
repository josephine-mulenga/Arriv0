import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CaretLeftIcon, CheckIcon, MoonIcon, SunIcon, DeviceMobileIcon } from 'phosphor-react-native';

import { Chip } from '@/components/ui/chip';
import { Palette, Radius, Spacing, Type } from '@/constants/theme';
import { CHAT_THEMES, usePreferences, type Appearance, type ReminderFrequency } from '@/PreferencesContext';

const appearanceOptions: { value: Appearance; label: string; icon: typeof SunIcon }[] = [
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
  { value: 'system', label: 'System', icon: DeviceMobileIcon },
];

const reminderOptions: { value: ReminderFrequency; label: string }[] = [
  { value: 'once', label: 'Once a day' },
  { value: 'twice', label: 'Twice a day' },
  { value: 'thrice', label: 'Three times a day' },
];

export default function SettingsScreen() {
  const { appearance, setAppearance, reminderFrequency, setReminderFrequency, chatThemeKey, setChatThemeKey, chatTheme } =
    usePreferences();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <CaretLeftIcon size={20} color={Palette.ink} weight="bold" />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>Appearance</Text>
        <View style={styles.appearanceRow}>
          {appearanceOptions.map((opt) => {
            const selected = appearance === opt.value;
            const OptIcon = opt.icon;
            return (
              <Pressable
                key={opt.value}
                style={[styles.appearanceOption, selected && styles.appearanceOptionSelected]}
                onPress={() => setAppearance(opt.value)}>
                <OptIcon size={20} color={selected ? Palette.purple : Palette.inkMuted} weight={selected ? 'fill' : 'regular'} />
                <Text style={[styles.appearanceLabel, selected && styles.appearanceLabelSelected]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {appearance !== 'light' && (
          <Text style={styles.note}>
            Dark mode is coming soon — your preference is saved and the app will switch
            automatically once it ships.
          </Text>
        )}

        <Text style={styles.sectionHeader}>Daily Reminders</Text>
        <Text style={styles.sectionBody}>
          How many nudges Arriv0 sends you about upcoming deadlines and documents.
        </Text>
        <View style={styles.chipRow}>
          {reminderOptions.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              selected={reminderFrequency === opt.value}
              onPress={() => setReminderFrequency(opt.value)}
            />
          ))}
        </View>

        <Text style={styles.sectionHeader}>AI Chat Theme</Text>
        <Text style={styles.sectionBody}>Pick an accent colour for your conversations with Arri.</Text>
        <View style={styles.swatchRow}>
          {CHAT_THEMES.map((theme) => {
            const selected = chatThemeKey === theme.key;
            return (
              <Pressable key={theme.key} style={styles.swatchWrap} onPress={() => setChatThemeKey(theme.key)}>
                <View style={[styles.swatch, { backgroundColor: theme.accent }]}>
                  {selected && <CheckIcon size={18} color={Palette.white} weight="bold" />}
                </View>
                <Text style={styles.swatchLabel}>{theme.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.previewRow}>
          <View style={[styles.previewBubbleAssistant]}>
            <Text style={styles.previewTextAssistant}>Here&apos;s your OPT window.</Text>
          </View>
          <View style={[styles.previewBubbleUser, { backgroundColor: chatTheme.accent }]}>
            <Text style={styles.previewTextUser}>Thanks, Arri!</Text>
          </View>
        </View>
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
  },
  sectionHeader: {
    fontFamily: Type.headingSemiBold,
    fontSize: 15,
    color: Palette.ink,
    marginTop: Spacing.sectionGap,
    marginBottom: Spacing.cardGap,
  },
  sectionBody: {
    fontFamily: Type.bodyRegular,
    fontSize: 13,
    lineHeight: 19,
    color: Palette.inkFaint,
    marginBottom: Spacing.cardGap,
  },
  appearanceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  appearanceOption: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: Palette.borderInput,
    backgroundColor: Palette.white,
  },
  appearanceOptionSelected: {
    backgroundColor: Palette.purpleTint,
    borderWidth: 1.5,
    borderColor: Palette.purple,
  },
  appearanceLabel: {
    fontFamily: Type.bodySemiBold,
    fontSize: 12.5,
    color: Palette.inkMuted,
  },
  appearanceLabelSelected: {
    color: Palette.purple,
  },
  note: {
    marginTop: 10,
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    lineHeight: 19,
    color: Palette.inkPlaceholder,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 18,
  },
  swatchWrap: {
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchLabel: {
    fontFamily: Type.bodyRegular,
    fontSize: 11.5,
    color: Palette.inkMuted,
  },
  previewRow: {
    marginTop: Spacing.sectionGap,
    gap: 8,
  },
  previewBubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.dividerLight,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
    maxWidth: '80%',
  },
  previewBubbleUser: {
    alignSelf: 'flex-end',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 12,
    maxWidth: '80%',
  },
  previewTextAssistant: {
    fontFamily: Type.bodyRegular,
    fontSize: 13.5,
    color: Palette.ink,
  },
  previewTextUser: {
    fontFamily: Type.bodyRegular,
    fontSize: 13.5,
    color: Palette.white,
  },
});

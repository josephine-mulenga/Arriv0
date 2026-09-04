import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CaretLeftIcon, EnvelopeSimpleIcon, CaretRightIcon } from 'phosphor-react-native';

import { Palette, Radius, Spacing, Type } from '@/constants/theme';

const CONTACTS = [
  { name: 'Prince', email: 'prince@arriv0.com' },
  { name: 'Josephine', email: 'josephine@arriv0.com' },
];

export default function ContactUsScreen() {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <CaretLeftIcon size={20} color={Palette.ink} weight="bold" />
        </Pressable>
        <Text style={styles.title}>Contact Us</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroIconSquare}>
          <EnvelopeSimpleIcon size={34} color={Palette.purple} weight="fill" />
        </View>
        <Text style={styles.heroTitle}>We&apos;d love to hear from you</Text>
        <Text style={styles.heroBody}>
          Questions, issues, or just want to say hi — reach out directly and we&apos;ll get back to
          you.
        </Text>

        <View style={styles.group}>
          {CONTACTS.map((contact, index) => (
            <Pressable
              key={contact.email}
              style={[styles.row, index !== CONTACTS.length - 1 && styles.rowDivider]}
              onPress={() => Linking.openURL(`mailto:${contact.email}`)}>
              <View>
                <Text style={styles.rowName}>{contact.name}</Text>
                <Text style={styles.rowEmail}>{contact.email}</Text>
              </View>
              <CaretRightIcon size={15} color={Palette.chevron} />
            </Pressable>
          ))}
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
    alignItems: 'center',
  },
  heroIconSquare: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Palette.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    marginTop: 18,
    fontFamily: Type.headingBold,
    fontSize: 19,
    textAlign: 'center',
    color: Palette.ink,
  },
  heroBody: {
    marginTop: 8,
    fontFamily: Type.bodyRegular,
    fontSize: 13.5,
    lineHeight: 21,
    textAlign: 'center',
    color: Palette.inkMuted,
    maxWidth: 300,
  },
  group: {
    width: '100%',
    marginTop: 28,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.cardLarge,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.dividerLight,
  },
  rowName: {
    fontFamily: Type.headingSemiBold,
    fontSize: 15,
    color: Palette.ink,
  },
  rowEmail: {
    marginTop: 2,
    fontFamily: Type.bodyRegular,
    fontSize: 13,
    color: Palette.inkFaint,
  },
});

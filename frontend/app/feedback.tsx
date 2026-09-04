import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { CaretLeftIcon, ChatCenteredDotsIcon, CheckCircleIcon } from 'phosphor-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Chip } from '@/components/ui/chip';
import { Palette, Radius, Spacing, Type } from '@/constants/theme';
import { useAuth } from '@/AuthContext';
import { submitFeedback } from '@/api';

const CATEGORIES = [
  { key: 'feature', label: 'Feature idea' },
  { key: 'improvement', label: 'Improvement' },
  { key: 'bug', label: "Something's broken" },
  { key: 'general', label: 'General' },
];

export default function FeedbackScreen() {
  const { token } = useAuth();
  const [category, setCategory] = useState('feature');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!token || !message.trim()) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await submitFeedback(category, message.trim(), token);
      setSubmitted(true);
      setMessage('');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not send your feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <CaretLeftIcon size={20} color={Palette.ink} weight="bold" />
        </Pressable>
        <Text style={styles.title}>Feedback</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {submitted ? (
          <View style={styles.successState}>
            <CheckCircleIcon size={48} color={Palette.green} weight="fill" />
            <Text style={styles.successTitle}>Thanks for the feedback!</Text>
            <Text style={styles.successBody}>
              The team reads every submission — we&apos;ll use this to shape what we build next.
            </Text>
            <PrimaryButton
              label="Send More Feedback"
              onPress={() => setSubmitted(false)}
              style={styles.successButton}
            />
          </View>
        ) : (
          <>
            <View style={styles.heroIconSquare}>
              <ChatCenteredDotsIcon size={34} color={Palette.purple} weight="fill" />
            </View>
            <Text style={styles.heroTitle}>What would you love to see?</Text>
            <Text style={styles.heroBody}>
              Feature ideas, things that feel off, anything at all — tell us what would make
              Arriv0 better for you.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.chipRow}>
                {CATEGORIES.map((c) => (
                  <Chip
                    key={c.key}
                    label={c.label}
                    selected={category === c.key}
                    onPress={() => setCategory(c.key)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Your feedback</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Tell us what's on your mind..."
                placeholderTextColor={Palette.inkPlaceholder}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                maxLength={2000}
                textAlignVertical="top"
              />
            </View>

            <PrimaryButton
              label={submitting ? 'Sending...' : 'Send Feedback'}
              onPress={handleSubmit}
              disabled={submitting || !message.trim()}
              style={styles.submitButton}
            />
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  fieldGroup: {
    width: '100%',
    gap: 8,
    marginTop: 24,
  },
  fieldLabel: {
    fontFamily: Type.bodyBold,
    fontSize: 12.5,
    color: Palette.inkMuted,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Palette.borderInput,
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.input,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 130,
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    color: Palette.ink,
  },
  submitButton: {
    width: '100%',
    marginTop: 24,
  },
  errorText: {
    marginTop: 10,
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.danger,
    textAlign: 'center',
  },
  successState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  successTitle: {
    marginTop: 12,
    fontFamily: Type.headingBold,
    fontSize: 19,
    color: Palette.ink,
  },
  successBody: {
    textAlign: 'center',
    fontFamily: Type.bodyRegular,
    fontSize: 13.5,
    lineHeight: 21,
    color: Palette.inkMuted,
    maxWidth: 280,
  },
  successButton: {
    marginTop: 20,
    minWidth: 200,
  },
});

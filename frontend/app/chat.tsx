import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import {
  CaretLeftIcon,
  RobotIcon,
  PaperPlaneTiltIcon,
  TrashIcon,
  ListChecksIcon,
  FolderSimpleIcon,
  type Icon,
} from 'phosphor-react-native';

import { useAuth } from '@/AuthContext';
import { chat, getChatHistory, clearChatHistory } from '@/api';
import { Palette, Type } from '@/constants/theme';
import { usePreferences } from '@/PreferencesContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const DEFAULT_GREETING: Message = {
  role: 'assistant',
  text: "Hi! I'm here to help with anything about your F1 status, OPT, CPT, or navigating life in the US. What's on your mind?",
};

interface ActionChip {
  label: string;
  icon: Icon;
  href: string;
}

function actionChipFor(message: Message): ActionChip | null {
  if (message.role !== 'assistant') return null;
  const text = message.text.toLowerCase();
  if (text.includes('cpt')) {
    return { label: 'See my CPT timeline', icon: ListChecksIcon, href: '/(tabs)/timeline' };
  }
  if (text.includes('opt')) {
    return { label: 'Open my OPT checklist', icon: ListChecksIcon, href: '/deadline/opt-application' };
  }
  if (text.includes('document')) {
    return { label: 'Open my documents', icon: FolderSimpleIcon, href: '/documents' };
  }
  return null;
}

export default function ChatScreen() {
  const { token } = useAuth();
  const { chatTheme } = usePreferences();
  const [messages, setMessages] = useState<Message[]>([DEFAULT_GREETING]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const sendScale = useSharedValue(1);
  const sendAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: sendScale.value }] }));

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await getChatHistory(token);
        const rawHistory = Array.isArray(data) ? data : data.messages || [];
        const historyMessages: Message[] = rawHistory.map((msg: { role: 'user' | 'assistant'; content: string }) => ({
          role: msg.role,
          text: msg.content,
        }));
        if (historyMessages.length > 0) setMessages(historyMessages);
      } catch {
        // keep the default greeting if history can't load
      } finally {
        setHistoryLoading(false);
      }
    };
    if (token) loadHistory();
  }, [token]);

  const handleSend = async () => {
    if (!question.trim()) return;
    sendScale.value = withSequence(withSpring(0.8, { damping: 10, stiffness: 400 }), withSpring(1));
    const userMessage: Message = { role: 'user', text: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const data = await chat(question, token);
      setMessages((prev) => [...prev, { role: 'assistant', text: data.answer }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: "Sorry, I couldn't process that. Try again?" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearChatHistory(token);
      setMessages([DEFAULT_GREETING]);
    } catch {
      // ignore; history stays as-is
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
        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle}>Arri AI Assistant</Text>
          <Text style={styles.headerSubtitle}>Knows your dates. Not legal advice.</Text>
        </View>
        <Pressable onPress={handleClearHistory} hitSlop={8}>
          <TrashIcon size={18} color={Palette.inkFaint} />
        </Pressable>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}>
        {messages.length <= 1 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconSquare, { backgroundColor: chatTheme.tint }]}>
              <RobotIcon size={38} color={chatTheme.accent} weight="fill" />
            </View>
            <Text style={styles.emptyText}>How can I help you today?</Text>
          </View>
        )}

        {historyLoading ? (
          <Text style={styles.loadingText}>Loading conversation...</Text>
        ) : (
          messages.map((msg, index) => {
            const chip = actionChipFor(msg);
            return (
              <View key={index}>
                <View
                  style={[
                    styles.bubble,
                    msg.role === 'user'
                      ? [styles.userBubble, { backgroundColor: chatTheme.accent }]
                      : styles.assistantBubble,
                  ]}>
                  <Text style={msg.role === 'user' ? styles.userText : styles.assistantText}>{msg.text}</Text>
                </View>
                {chip && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionChip,
                      pressed && { borderColor: chatTheme.accent },
                    ]}
                    onPress={() => router.push(chip.href as never)}>
                    <chip.icon size={16} color={chatTheme.accent} />
                    <Text style={styles.actionChipLabel}>{chip.label}</Text>
                  </Pressable>
                )}
              </View>
            );
          })
        )}
        {loading && (
          <View style={[styles.bubble, styles.assistantBubble]}>
            <Text style={styles.assistantText}>Typing...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.composerRow}>
        <View style={styles.composerPill}>
          <TextInput
            style={styles.input}
            placeholder="Ask a question..."
            placeholderTextColor={Palette.inkPlaceholder}
            value={question}
            onChangeText={setQuestion}
            onSubmitEditing={handleSend}
          />
        </View>
        <AnimatedPressable
          style={[styles.sendButton, { backgroundColor: chatTheme.accent }, sendAnimatedStyle]}
          onPress={handleSend}
          disabled={loading}>
          <PaperPlaneTiltIcon size={19} color={Palette.white} weight="fill" />
        </AnimatedPressable>
      </View>
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
    gap: 12,
    paddingTop: 62,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Palette.divider,
  },
  headerTitleBlock: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 16,
    color: Palette.ink,
  },
  headerSubtitle: {
    marginTop: 2,
    fontFamily: Type.bodyRegular,
    fontSize: 11.5,
    color: Palette.inkPlaceholder,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    gap: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 14,
  },
  emptyIconSquare: {
    width: 76,
    height: 76,
    borderRadius: 26,
    backgroundColor: Palette.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    color: Palette.inkMuted,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 24,
    fontFamily: Type.bodyRegular,
    color: Palette.inkPlaceholder,
  },
  bubble: {
    padding: 13,
    marginBottom: 8,
    maxWidth: '84%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: '78%',
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: Palette.dividerLight,
    alignSelf: 'flex-start',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  userText: {
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    color: Palette.white,
  },
  assistantText: {
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    lineHeight: 22,
    color: Palette.ink,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Palette.borderInput,
    borderRadius: 13,
    paddingVertical: 9,
    paddingHorizontal: 13,
    marginBottom: 10,
  },
  actionChipLabel: {
    fontFamily: Type.bodySemiBold,
    fontSize: 13.5,
    color: Palette.ink,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
  },
  composerPill: {
    flex: 1,
    backgroundColor: Palette.dividerLight,
    borderRadius: 22,
    paddingHorizontal: 16,
    height: 44,
    justifyContent: 'center',
  },
  input: {
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    color: Palette.ink,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

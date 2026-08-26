import { useState, useRef, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, View } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientHeaderBackground } from '@/components/gradient-header-background';
import { useAuth } from '@/AuthContext';
import { chat, getChatHistory, clearChatHistory } from '@/api';

const DEFAULT_GREETING = {
  role: 'assistant',
  text: "Hi! I'm here to help with anything about your F1 status, OPT, CPT, or navigating life in the US. What's on your mind?",
};

export default function ChatScreen() {
  const { token } = useAuth();
  const [messages, setMessages] = useState([DEFAULT_GREETING]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await getChatHistory(token);
        const historyMessages = Array.isArray(data) ? data : data.messages || [];
        if (historyMessages.length > 0) {
          setMessages(historyMessages);
          console.log('History sample:', JSON.stringify(historyMessages[0]));
        }
      } catch (err) {
        console.log('Error loading chat history:', err.message);
      } finally {
        setHistoryLoading(false);
      }
    };
    if (token) loadHistory();
  }, [token]);

  const handleSend = async () => {
    if (!question.trim()) return;

    const userMessage = { role: 'user', text: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const data = await chat(question, token);
      console.log('Chat response:', data)
      setMessages((prev) => [...prev, { role: 'assistant', text: data.answer }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: "Sorry, I couldn't process that. Try again?" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearChatHistory(token);
      setMessages([DEFAULT_GREETING]);
    } catch (err) {
      console.log('Error clearing chat history:', err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      <View style={{ height: 100 }}>
        <GradientHeaderBackground />
      </View>

      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText style={styles.backButton}>← Back</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Ask Arrivo</ThemedText>
        <TouchableOpacity onPress={handleClearHistory} style={styles.clearButton}>
          <ThemedText style={styles.clearButtonText}>Clear</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}>
        {historyLoading ? (
          <ThemedText style={styles.loadingText}>Loading conversation...</ThemedText>
        ) : (
          messages.map((msg, index) => (
            <ThemedView
              key={index}
              style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
              <ThemedText style={msg.role === 'user' ? styles.userText : styles.assistantText}>
                {msg.text}
              </ThemedText>
            </ThemedView>
          ))
        )}
        {loading && (
          <ThemedView style={[styles.messageBubble, styles.assistantBubble]}>
            <ThemedText style={styles.assistantText}>Typing...</ThemedText>
          </ThemedView>
        )}
      </ScrollView>

      <ThemedView style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ask a question..."
          value={question}
          onChangeText={setQuestion}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={loading}>
          <ThemedText style={styles.sendButtonText}>Send</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  headerTitle: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 22,
    color: '#1A1A2E',
    flex: 1,
    textAlign: 'center',
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    color: '#D32F2F',
    fontWeight: '600',
    fontSize: 13,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 24,
    color: '#888',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#6C63FF',
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    backgroundColor: '#F5F5F7',
    alignSelf: 'flex-start',
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#1A1A2E',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
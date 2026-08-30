import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import {
  MagnifyingGlassIcon,
  BinocularsIcon,
  ClockIcon,
  FolderSimpleIcon,
  NewspaperIcon,
  ChatCircleTextIcon,
  type Icon,
} from 'phosphor-react-native';

import { getTimeline, getDocuments, getNews } from '@/api';
import { useAuth } from '@/AuthContext';
import { Chip } from '@/components/ui/chip';
import { IconTile } from '@/components/ui/icon-tile';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Palette, Spacing, Type } from '@/constants/theme';

const FILTERS = ['All', 'Deadlines', 'Documents', 'News', 'Answers'];

const ANSWERS = [
  { title: 'When can I apply for OPT?', meta: 'Up to 90 days before your program end date' },
  { title: 'How much does OPT cost?', meta: '$520 USCIS filing fee for Form I-765' },
  { title: 'What is the 30-day rule?', meta: 'File within 30 days of your DSO recommendation' },
];

interface Result {
  type: 'Deadlines' | 'Documents' | 'News' | 'Answers';
  title: string;
  meta: string;
  icon: Icon;
  tint: string;
  color: string;
  onPress: () => void;
}

export default function SearchScreen() {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      getTimeline(token).catch(() => null),
      getDocuments(token).catch(() => null),
      getNews(token).catch(() => null),
    ]).then(([timeline, docs, news]) => {
      const list: Result[] = [];

      (timeline?.steps ?? []).forEach((step: { task: string; date_range?: string }) => {
        list.push({
          type: 'Deadlines',
          title: step.task,
          meta: step.date_range ?? 'From your timeline',
          icon: ClockIcon,
          tint: Palette.purpleTint,
          color: Palette.purple,
          onPress: () => router.push('/(tabs)/timeline'),
        });
      });

      const docList = Array.isArray(docs) ? docs : docs?.documents ?? [];
      docList.forEach((doc: { id: string; name: string; category?: string }) => {
        list.push({
          type: 'Documents',
          title: doc.name,
          meta: doc.category ?? 'Document',
          icon: FolderSimpleIcon,
          tint: Palette.greenTint,
          color: Palette.green,
          onPress: () => router.push('/documents'),
        });
      });

      const seenTitles = new Set<string>();
      const uniqueNews = (news?.news ?? []).filter((item: { title: string }) => {
        const key = item.title.trim().toLowerCase();
        if (seenTitles.has(key)) return false;
        seenTitles.add(key);
        return true;
      });
      uniqueNews.forEach((item: { id: string; title: string; tag: string }) => {
        list.push({
          type: 'News',
          title: item.title,
          meta: item.tag,
          icon: NewspaperIcon,
          tint: Palette.amberTint,
          color: Palette.amber,
          onPress: () => router.push('/(tabs)/news'),
        });
      });

      ANSWERS.forEach((answer) => {
        list.push({
          type: 'Answers',
          title: answer.title,
          meta: answer.meta,
          icon: ChatCircleTextIcon,
          tint: Palette.purpleTint,
          color: Palette.purple,
          onPress: () => router.push('/chat'),
        });
      });

      setResults(list);
    });
  }, [token]);

  const filtered = useMemo(() => {
    return results.filter((r) => {
      const matchesFilter = filter === 'All' || r.type === filter;
      const matchesQuery = query.trim().length === 0 || r.title.toLowerCase().includes(query.trim().toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [results, filter, query]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <MagnifyingGlassIcon size={17} color={Palette.inkFaint} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search deadlines, docs, news..."
            placeholderTextColor={Palette.inkPlaceholder}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
        </View>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipRow}>
        {FILTERS.map((f) => (
          <Chip key={f} label={f} selected={filter === f} onPress={() => setFilter(f)} />
        ))}
      </ScrollView>

      <Text style={styles.resultCount}>
        {filtered.length} result{filtered.length === 1 ? '' : 's'}
      </Text>

      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <BinocularsIcon size={40} color="#CFC9F5" />
          <Text style={styles.emptyTitle}>Nothing in that filter</Text>
          <Text style={styles.emptyBody}>Try &quot;All&quot;, or ask Arri in plain language instead.</Text>
          <PrimaryButton label="Ask Arri" onPress={() => router.push('/chat')} style={styles.askButton} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {filtered.map((item, index) => (
            <Pressable
              key={`${item.type}-${index}`}
              style={[styles.row, index === filtered.length - 1 && styles.rowLast]}
              onPress={item.onPress}>
              <IconTile icon={item.icon} tint={item.tint} color={item.color} size={38} iconSize={18} />
              <View style={{ flex: 1 }}>
                <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.resultMeta} numberOfLines={1}>{item.meta}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
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
    gap: 12,
    paddingTop: 62,
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Palette.divider,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Palette.dividerLight,
    borderRadius: 13,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    color: Palette.ink,
  },
  cancel: {
    fontFamily: Type.bodySemiBold,
    fontSize: 14,
    color: Palette.purple,
  },
  chipScroll: {
    height: 64,
    flexGrow: 0,
    flexShrink: 0,
  },
  chipRow: {
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 16,
  },
  resultCount: {
    paddingHorizontal: Spacing.screenPadding,
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.inkPlaceholder,
    marginBottom: 8,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 108,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.dividerLight,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  resultTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 14,
    color: Palette.ink,
  },
  resultMeta: {
    marginTop: 2,
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.inkFaint,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 16,
    color: Palette.ink,
    marginTop: 8,
  },
  emptyBody: {
    textAlign: 'center',
    fontFamily: Type.bodyRegular,
    fontSize: 13.5,
    lineHeight: 20,
    color: Palette.inkMuted,
  },
  askButton: {
    marginTop: 14,
    minWidth: 160,
  },
});

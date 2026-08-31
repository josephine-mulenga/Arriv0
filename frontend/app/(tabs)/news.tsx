import { useEffect, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  IdentificationCardIcon,
  BriefcaseIcon,
  GraduationCapIcon,
  NewspaperIcon,
  BookmarkSimpleIcon,
  type Icon,
} from 'phosphor-react-native';

import { getNews, addBookmark, getBookmarks, deleteBookmark } from '@/api';
import { useAuth } from '@/AuthContext';
import { Chip } from '@/components/ui/chip';
import { IconTile } from '@/components/ui/icon-tile';
import { Palette, Spacing, Type } from '@/constants/theme';

const TABS = ['All', 'F1 Visa', 'OPT', 'CPT', 'STEM OPT', 'Saved'];

interface NewsItem {
  id: string;
  title: string;
  body: string;
  tag: string;
  link?: string;
  image_url?: string;
  affects_f1?: boolean;
  created_at?: string;
}

interface Bookmark {
  id: string;
  news_title: string;
}

const tagStyle: Record<string, { tint: string; color: string; icon: Icon }> = {
  'F1 Visa': { tint: Palette.purpleTint, color: Palette.purple, icon: IdentificationCardIcon },
  OPT: { tint: Palette.greenTint, color: Palette.green, icon: BriefcaseIcon },
  CPT: { tint: Palette.amberTint, color: Palette.amber, icon: BriefcaseIcon },
  'STEM OPT': { tint: Palette.redTint, color: Palette.red, icon: GraduationCapIcon },
};

function tagVisual(tag: string) {
  return tagStyle[tag] ?? { tint: Palette.purpleTint, color: Palette.purple, icon: NewspaperIcon };
}

function relativeAge(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const days = Math.max(0, Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

function formatDate(dateString?: string): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// The backend's news source occasionally returns the same story more than
// once (re-fetched on different runs); collapse those before rendering
// rather than showing the same headline five times in a row.
function dedupeByTitle(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.title.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function NewsScreen() {
  const { token } = useAuth();
  const [newsItems, setNewsItems] = useState<NewsItem[] | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [selectedTab, setSelectedTab] = useState('All');

  const fetchNews = async () => {
    try {
      const data = await getNews(token);
      setNewsItems(dedupeByTitle(data.news ?? []));
    } catch {
      // keep last-known list on failure
    }
  };

  const fetchBookmarks = async () => {
    try {
      const data = await getBookmarks(token);
      setBookmarks(data.bookmarks || data);
    } catch {
      // ignore; bookmark state just won't reflect saved articles
    }
  };

  useEffect(() => {
    if (token) {
      fetchNews();
      fetchBookmarks();
    }
  }, [token]);

  const isBookmarked = (item: NewsItem) => bookmarks.some((b) => b.news_title === item.title);
  const getBookmarkId = (item: NewsItem) => bookmarks.find((b) => b.news_title === item.title)?.id;

  const handleToggleBookmark = async (item: NewsItem) => {
    try {
      if (isBookmarked(item)) {
        const bookmarkId = getBookmarkId(item);
        if (bookmarkId) await deleteBookmark(bookmarkId, token);
      } else {
        await addBookmark(item, token);
      }
      await fetchBookmarks();
    } catch {
      // ignore; user can retry
    }
  };

  const allNews = newsItems ?? [];
  const filteredNews =
    selectedTab === 'All'
      ? allNews
      : selectedTab === 'Saved'
      ? allNews.filter((item) => isBookmarked(item))
      : allNews.filter((item) => item.tag === selectedTab);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Immigration News</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipRow}>
        {TABS.map((tab) => (
          <Chip key={tab} label={tab} selected={selectedTab === tab} onPress={() => setSelectedTab(tab)} />
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!newsItems && <Text style={styles.emptyText}>Loading news...</Text>}

        {newsItems && filteredNews.length === 0 && (
          <Text style={styles.emptyText}>
            {selectedTab === 'Saved' ? 'No saved articles yet.' : 'No news in this category yet.'}
          </Text>
        )}

        {filteredNews.map((item, index) => {
          const visual = tagVisual(item.tag);
          const saved = isBookmarked(item);
          return (
            <Pressable
              key={item.id ?? index}
              style={[styles.row, index === filteredNews.length - 1 && styles.rowLast]}
              onPress={() => item.link && Linking.openURL(item.link)}>
              <View style={styles.thumbColumn}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.thumbImage} />
                ) : (
                  <IconTile icon={visual.icon} tint={visual.tint} color={visual.color} size={74} iconSize={28} />
                )}
                <Pressable hitSlop={8} onPress={() => handleToggleBookmark(item)} style={styles.bookmarkButton}>
                  <BookmarkSimpleIcon
                    size={17}
                    color={saved ? Palette.purple : Palette.inkFaint}
                    weight={saved ? 'fill' : 'regular'}
                  />
                </Pressable>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.headline} numberOfLines={3}>
                  {item.title}
                </Text>
                <Text style={styles.meta}>
                  {formatDate(item.created_at)}
                  {item.created_at ? ` · ${relativeAge(item.created_at)}` : ''}
                </Text>
                <View style={[styles.badge, { backgroundColor: visual.tint }]}>
                  <Text style={[styles.badgeText, { color: visual.color }]}>{item.tag}</Text>
                </View>
                <Text style={styles.whatThisMeans}>
                  {item.affects_f1
                    ? 'This directly affects your F-1 status — worth a read.'
                    : 'General visa news — may not affect your status directly.'}
                </Text>
              </View>
            </Pressable>
          );
        })}
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
    paddingTop: 62,
    paddingHorizontal: Spacing.screenPadding,
  },
  title: {
    fontFamily: Type.headingBold,
    fontSize: 22,
    color: Palette.ink,
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
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 108,
  },
  emptyText: {
    fontFamily: Type.bodyRegular,
    fontSize: 13,
    color: Palette.inkPlaceholder,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Palette.divider,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  headline: {
    fontFamily: Type.bodyBold,
    fontSize: 14.5,
    lineHeight: 20,
    color: Palette.ink,
  },
  meta: {
    marginTop: 4,
    fontFamily: Type.bodyRegular,
    fontSize: 12,
    color: Palette.inkPlaceholder,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 9,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  badgeText: {
    fontFamily: Type.bodyBold,
    fontSize: 11,
  },
  whatThisMeans: {
    marginTop: 6,
    fontFamily: Type.bodyRegular,
    fontSize: 12,
    lineHeight: 17,
    color: Palette.inkMuted,
  },
  thumbColumn: {
    alignItems: 'center',
    gap: 8,
  },
  thumbImage: {
    width: 74,
    height: 74,
    borderRadius: 12,
    backgroundColor: Palette.dividerLight,
  },
  bookmarkButton: {
    padding: 2,
  },
});

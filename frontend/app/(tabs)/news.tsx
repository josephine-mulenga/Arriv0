import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import {
  BookmarkSimpleIcon,
  NewspaperIcon,
  SparkleIcon,
  ArrowSquareOutIcon,
  CaretDownIcon,
  CaretUpIcon,
} from 'phosphor-react-native';

import { getNews, addBookmark, getBookmarks, deleteBookmark } from '@/api';
import { useAuth } from '@/AuthContext';
import { Chip } from '@/components/ui/chip';
import { NewsThumb } from '@/components/ui/news-thumb';
import { SkeletonList } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Palette, Spacing, Type } from '@/constants/theme';
import { newsVisual } from '@/utils/newsVisuals';

const STALE_AFTER_MS = 15 * 60 * 1000;

const TABS = ['For You', 'F1 Visa', 'OPT', 'CPT', 'STEM OPT', 'Saved'];

interface NewsItem {
  id: string;
  title: string;
  body: string;
  tag: string;
  link?: string;
  image_url?: string;
  affects_f1?: boolean;
  created_at?: string;
  source?: string;
  relevance?: 'HIGH' | 'MEDIUM';
  why_relevant?: string;
}

interface Bookmark {
  id: string;
  news_title: string;
  news_body: string;
  news_link?: string;
  news_tag?: string;
  news_image_url?: string;
}

function minutesAgoLabel(timestamp: number | null): string {
  if (!timestamp) return '';
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return 'Last updated: just now';
  if (minutes === 1) return 'Last updated: 1 minute ago';
  if (minutes < 60) return `Last updated: ${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  return hours === 1 ? 'Last updated: 1 hour ago' : `Last updated: ${hours} hours ago`;
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

// Defensive — the backend now dedupes at the source, but this costs nothing
// and guards against a stray re-fetch inserting the same story twice again.
function dedupeByTitle(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.title.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function bookmarkToNewsItem(b: Bookmark): NewsItem {
  return {
    id: b.id,
    title: b.news_title,
    body: b.news_body,
    tag: b.news_tag ?? '',
    link: b.news_link,
    image_url: b.news_image_url,
  };
}

export default function NewsScreen() {
  const { token } = useAuth();
  const [newsItems, setNewsItems] = useState<NewsItem[] | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [selectedTab, setSelectedTab] = useState('For You');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string | number>>(new Set());
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [, setTick] = useState(0);
  const lastFetchedAt = useRef(0);

  // Forces a re-render every 30s purely so the "Last updated: X minutes
  // ago" label stays live while the user sits on this screen, without
  // needing an actual new fetch.
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNews = async (tag: string, targetPage: number, append: boolean) => {
    try {
      const data = await getNews(token, { tag: tag === 'For You' ? undefined : tag, page: targetPage });
      const incoming = dedupeByTitle(data.news ?? []);
      setNewsItems((prev) => (append && prev ? dedupeByTitle([...prev, ...incoming]) : incoming));
      setHasMore(!!data.has_more);
      setPage(data.page ?? targetPage);
      setErrorMessage(null);
      lastFetchedAt.current = Date.now();
      setLastUpdatedAt(Date.now());
    } catch {
      if (!append) {
        setNewsItems([]);
        setErrorMessage('Could not refresh news. Pull down to try again.');
      }
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
    if (!token) return;
    fetchBookmarks();
  }, [token]);

  useEffect(() => {
    if (!token || selectedTab === 'Saved') return;
    setNewsItems(null);
    fetchNews(selectedTab, 1, false);
  }, [token, selectedTab]);

  // Re-pull whenever the tab actually regains focus (not just on mount) if
  // it's been more than 15 minutes since the last successful fetch — the
  // screen stays mounted while the user is elsewhere, so without this a
  // plain useEffect would keep showing stale news indefinitely.
  useFocusEffect(
    useCallback(() => {
      if (!token || selectedTab === 'Saved') return;
      if (Date.now() - lastFetchedAt.current < STALE_AFTER_MS) return;
      fetchNews(selectedTab, 1, false);
    }, [token, selectedTab])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    if (selectedTab === 'Saved') {
      await fetchBookmarks();
    } else {
      await fetchNews(selectedTab, 1, false);
    }
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await fetchNews(selectedTab, page + 1, true);
    setLoadingMore(false);
  };

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

  const handleAskArri = (item: NewsItem) => {
    router.push({
      pathname: '/chat',
      params: { prefill: `Tell me about this immigration update and how it affects me: "${item.title}"` },
    });
  };

  const toggleExpanded = (id: string | number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const displayedNews = selectedTab === 'Saved' ? bookmarks.map(bookmarkToNewsItem) : newsItems ?? [];

  return (
    <Animated.View style={styles.root} entering={FadeIn.duration(220)}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Palette.purple} colors={[Palette.purple]} />
        }>
        <View style={styles.header}>
          <Text style={styles.title}>Immigration News</Text>
          {selectedTab !== 'Saved' && lastUpdatedAt ? (
            <Text style={styles.lastUpdated}>{minutesAgoLabel(lastUpdatedAt)}</Text>
          ) : null}
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

        {selectedTab !== 'Saved' && !newsItems && !errorMessage && <SkeletonList />}

        {selectedTab !== 'Saved' && errorMessage && (
          <ErrorState message={errorMessage} onRetry={() => fetchNews(selectedTab, 1, false)} />
        )}

        {!errorMessage && displayedNews.length === 0 && (newsItems || selectedTab === 'Saved') && (
          <EmptyState
            icon={selectedTab === 'Saved' ? BookmarkSimpleIcon : NewspaperIcon}
            title={selectedTab === 'Saved' ? 'No saved articles yet' : 'No new updates for your profile right now'}
            body={selectedTab === 'Saved' ? 'Bookmark articles that matter to you.' : undefined}
          />
        )}

        {displayedNews.map((item, index) => {
          const visual = newsVisual(item.tag);
          const saved = isBookmarked(item);
          const isHigh = item.relevance === 'HIGH';
          const itemKey = item.id ?? index;
          const expanded = expandedIds.has(itemKey);
          return (
            <Animated.View
              key={itemKey}
              entering={FadeInUp.delay(Math.min(index, 8) * 45).duration(320)}
              style={[styles.card, index === displayedNews.length - 1 && styles.cardLast]}>
              <Pressable style={styles.cardTop} onPress={() => toggleExpanded(itemKey)}>
                <View style={styles.thumbColumn}>
                  <NewsThumb imageUrl={item.image_url} tag={item.tag} size={74} />
                  <Pressable hitSlop={8} onPress={() => handleToggleBookmark(item)} style={styles.bookmarkButton}>
                    <BookmarkSimpleIcon
                      size={17}
                      color={saved ? Palette.purple : Palette.inkFaint}
                      weight={saved ? 'fill' : 'regular'}
                    />
                  </Pressable>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.badgeRow}>
                    {item.relevance ? (
                      <View style={[styles.relevanceBadge, isHigh ? styles.relevanceBadgeHigh : styles.relevanceBadgeMedium]}>
                        <Text style={[styles.relevanceBadgeText, isHigh ? styles.relevanceBadgeTextHigh : styles.relevanceBadgeTextMedium]}>
                          {item.relevance}
                        </Text>
                      </View>
                    ) : null}
                    {item.tag ? (
                      <View style={[styles.badge, { backgroundColor: visual.tint }]}>
                        <Text style={[styles.badgeText, { color: visual.color }]}>{item.tag}</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.headline} numberOfLines={expanded ? undefined : 1}>
                    <Text style={styles.sourcePrefix}>{item.source || 'Source'} says: </Text>
                    {item.title}
                  </Text>

                  {item.why_relevant ? (
                    <Text style={styles.whyRelevant} numberOfLines={expanded ? undefined : 2}>
                      Why this matters for you: {item.why_relevant}
                    </Text>
                  ) : null}
                </View>
                {expanded ? (
                  <CaretUpIcon size={14} color={Palette.chevron} />
                ) : (
                  <CaretDownIcon size={14} color={Palette.chevron} />
                )}
              </Pressable>

              {expanded && item.body ? <Text style={styles.expandedBody}>{item.body}</Text> : null}

              <View style={styles.cardFooter}>
                <Pressable
                  style={styles.readLink}
                  onPress={() => item.link && Linking.openURL(item.link)}
                  hitSlop={4}>
                  <ArrowSquareOutIcon size={12} color={Palette.purple} weight="bold" />
                  <Text style={styles.sourceLink}>Read on {item.source || 'source'}</Text>
                </Pressable>
                {item.created_at ? <Text style={styles.metaDot}>·</Text> : null}
                <Text style={styles.metaText}>{relativeAge(item.created_at)}</Text>
                <View style={{ flex: 1 }} />
                <Pressable style={styles.askArriLink} onPress={() => handleAskArri(item)} hitSlop={6}>
                  <SparkleIcon size={12} color={Palette.purple} weight="fill" />
                  <Text style={styles.askArriText}>Ask Arri about this</Text>
                </Pressable>
              </View>
            </Animated.View>
          );
        })}

        {selectedTab !== 'Saved' && hasMore && (
          <Pressable style={styles.loadMoreButton} onPress={handleLoadMore} disabled={loadingMore}>
            {loadingMore ? (
              <ActivityIndicator color={Palette.purple} />
            ) : (
              <Text style={styles.loadMoreText}>Load more</Text>
            )}
          </Pressable>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.white,
  },
  header: {
    paddingTop: 62,
  },
  title: {
    fontFamily: Type.headingBold,
    fontSize: 22,
    color: Palette.ink,
  },
  lastUpdated: {
    marginTop: 3,
    fontFamily: Type.bodyRegular,
    fontSize: 12,
    color: Palette.inkPlaceholder,
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
  card: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.divider,
  },
  cardLast: {
    borderBottomWidth: 0,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  expandedBody: {
    marginTop: 8,
    marginLeft: 86,
    fontFamily: Type.bodyRegular,
    fontSize: 13,
    lineHeight: 19,
    color: Palette.inkBody,
  },
  readLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 5,
  },
  relevanceBadge: {
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  relevanceBadgeHigh: {
    backgroundColor: Palette.purpleTint,
  },
  relevanceBadgeMedium: {
    backgroundColor: Palette.dividerLight,
  },
  relevanceBadgeText: {
    fontFamily: Type.bodyBold,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  relevanceBadgeTextHigh: {
    color: Palette.purple,
  },
  relevanceBadgeTextMedium: {
    color: Palette.inkFaint,
  },
  headline: {
    fontFamily: Type.bodyBold,
    fontSize: 14,
    lineHeight: 19,
    color: Palette.ink,
  },
  sourcePrefix: {
    fontFamily: Type.bodyBold,
    color: Palette.inkMuted,
  },
  whyRelevant: {
    marginTop: 4,
    fontFamily: Type.bodyRegular,
    fontSize: 12,
    lineHeight: 16,
    color: Palette.inkMuted,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 9,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  badgeText: {
    fontFamily: Type.bodyBold,
    fontSize: 10.5,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingLeft: 86,
    gap: 6,
  },
  sourceLink: {
    fontFamily: Type.bodyBold,
    fontSize: 11.5,
    color: Palette.purple,
  },
  metaDot: {
    color: Palette.inkPlaceholder,
    fontSize: 11.5,
  },
  metaText: {
    fontFamily: Type.bodyRegular,
    fontSize: 11.5,
    color: Palette.inkPlaceholder,
  },
  askArriLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  askArriText: {
    fontFamily: Type.bodySemiBold,
    fontSize: 11.5,
    color: Palette.purple,
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
  loadMoreButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadMoreText: {
    fontFamily: Type.bodySemiBold,
    fontSize: 13.5,
    color: Palette.purple,
  },
});

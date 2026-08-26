import { StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import { useEffect, useState } from 'react';
import { getNews, addBookmark, getBookmarks, deleteBookmark } from '@/api';
import { useAuth } from '@/AuthContext';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientHeaderBackground } from '@/components/gradient-header-background';

const TABS = ['All', 'F1 Visa', 'OPT', 'CPT', 'STEM OPT', 'Saved'];

export default function NewsScreen() {
  const { token } = useAuth();
  const [realNewsItems, setRealNewsItems] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [selectedTab, setSelectedTab] = useState('All');

  const fetchNews = async () => {
    try {
      const data = await getNews(token);
      setRealNewsItems(data);
    } catch (err) {
      console.log('Error fetching news:', err.message);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const data = await getBookmarks(token);
      setBookmarks(data.bookmarks || data);
    } catch (err) {
      console.log('Error fetching bookmarks:', err.message);
    }
  };

  useEffect(() => {
    if (token) {
      fetchNews();
      fetchBookmarks();
    }
  }, [token]);

  const isBookmarked = (item) => bookmarks.some((b) => b.news_title === item.title);

  const getBookmarkId = (item) => {
    const match = bookmarks.find((b) => b.news_title === item.title);
    return match ? match.id : null;
  };

  const handleToggleBookmark = async (item) => {
    try {
      if (isBookmarked(item)) {
        const bookmarkId = getBookmarkId(item);
        await deleteBookmark(bookmarkId, token);
      } else {
        await addBookmark(item, token);
      }
      await fetchBookmarks();
    } catch (err) {
      console.log('Error toggling bookmark:', err.message);
    }
  };

  const handleOpenArticle = (item) => {
    if (item.link) {
      Linking.openURL(item.link);
    }
  };

  const allNews = realNewsItems ? realNewsItems.news : [];

  const filteredNews =
    selectedTab === 'All'
      ? allNews
      : selectedTab === 'Saved'
      ? allNews.filter((item) => isBookmarked(item))
      : allNews.filter((item) => item.tag === selectedTab);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#C7D9FF', dark: '#2A2450' }}
      headerImage={<GradientHeaderBackground logoSize={50} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText style={styles.screenTitle}>News</ThemedText>
      </ThemedView>

      <ThemedView style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setSelectedTab(tab)}
            style={[styles.tabButton, selectedTab === tab && styles.tabButtonActive]}>
            <ThemedText style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
              {tab === 'Saved' ? '🔖 Saved' : tab}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ThemedView>

      {realNewsItems ? (
        filteredNews.length > 0 ? (
          filteredNews.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={item.link ? 0.7 : 1}
              onPress={() => handleOpenArticle(item)}
              disabled={!item.link}>
              <ThemedView
                style={[styles.newsCard, item.affects_f1 ? styles.relevantCard : styles.generalCard]}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.newsImage} />
                ) : null}

                <ThemedView style={styles.cardHeaderRow}>
                  <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
                  <TouchableOpacity onPress={() => handleToggleBookmark(item)} style={styles.bookmarkButton}>
                    <ThemedText style={styles.bookmarkIcon}>
                      {isBookmarked(item) ? '🔖' : '📑'}
                    </ThemedText>
                  </TouchableOpacity>
                </ThemedView>

                <ThemedText style={item.affects_f1 ? styles.tagDirect : styles.tagGeneral}>
                  {item.tag}
                </ThemedText>
                <ThemedText>{item.body}</ThemedText>

                {item.link && (
                  <ThemedText style={styles.readMoreText}>Read full article →</ThemedText>
                )}
              </ThemedView>
            </TouchableOpacity>
          ))
        ) : (
          <ThemedText style={{ paddingHorizontal: 16 }}>
            {selectedTab === 'Saved' ? 'No saved articles yet.' : 'No news in this category yet.'}
          </ThemedText>
        )
      ) : (
        <ThemedText style={{ paddingHorizontal: 16 }}>Loading...</ThemedText>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 26,
    fontFamily: 'Fredoka_700Bold',
    color: '#1A1A2E',
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F0EEFF',
  },
  tabButtonActive: {
    backgroundColor: '#6C63FF',
  },
  tabText: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 13,
    color: '#6C63FF',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Fredoka_600SemiBold',
    flex: 1,
  },
  bookmarkButton: {
    padding: 2,
  },
  bookmarkIcon: {
    fontSize: 20,
  },
  newsCard: {
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
  },
  newsImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 4,
  },
  relevantCard: { backgroundColor: '#F0EEFF' },
  generalCard: { backgroundColor: '#F5F5F7' },
  tagDirect: { color: '#6C63FF', fontWeight: '600' },
  tagGeneral: { color: '#888888', fontWeight: '600' },
  readMoreText: {
    color: '#6C63FF',
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 13,
    marginTop: 4,
  },
});
import { StyleSheet, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { getNews } from '@/api';
import { useAuth } from '@/AuthContext';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientHeaderBackground } from '@/components/gradient-header-background';

export default function NewsScreen() {
  const { token } = useAuth();
  const [realNewsItems, setRealNewsItems] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await getNews(token);
        setRealNewsItems(data);
      } catch (err) {
        console.log('Error fetching news:', err.message);
      }
    };
    if (token) fetchNews();
  }, [token]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#C7D9FF', dark: '#2A2450' }}
      headerImage={<GradientHeaderBackground logoSize={50} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText style={styles.screenTitle}>News</ThemedText>
      </ThemedView>

      {realNewsItems ? (
        realNewsItems.news.map((item) => (
          <ThemedView
            key={item.id}
            style={[styles.newsCard, item.affects_f1 ? styles.relevantCard : styles.generalCard]}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.newsImage} />
            ) : null}
            <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
            <ThemedText style={item.affects_f1 ? styles.tagDirect : styles.tagGeneral}>
              {item.tag}
            </ThemedText>
            <ThemedText>{item.body}</ThemedText>
          </ThemedView>
        ))
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
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Fredoka_600SemiBold',
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
});
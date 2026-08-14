import { StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { getNews } from '@/api';
import { useAuth } from '@/AuthContext';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';



export default function NewsScreen() {
  const { token } = useAuth();
  const [realNewsItems, setRealNewsItems] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await getNews(token);
        console.log('News data:', data);
        setRealNewsItems(data);
      } catch (err) {
        console.log('Error fetching news:', err.message);
      }
    };

    if (token) {
      fetchNews();
    }
  }, [token]);
  
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
          headerImage={<ThemedView style={{ height: 250 }} />}>
            <ThemedView style={styles.titleContainer}>
              <ThemedText type="title">News</ThemedText>
            </ThemedView>
          {realNewsItems ? (
      realNewsItems.news.map((item) => (
        <ThemedView key={item.id} style={styles.newsCard}>
          <ThemedText type="subtitle">{item.title}</ThemedText>
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
  newsCard: {
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F5F5F7',
    borderRadius: 16,
  },
});
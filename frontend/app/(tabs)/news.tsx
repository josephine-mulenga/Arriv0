import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const newsItems = [
  {
    title: 'OPT processing times reduced',
    tag: 'Affects you directly',
    body: 'USCIS announced a temporary extension to the OPT application processing timeline, giving students more flexibility if their program end date is approaching soon.',
  },
  {
    title: 'New guidance on CPT eligibility',
    tag: 'Affects you directly',
    body: 'Updated guidance clarifies which internship types qualify for Curricular Practical Training, helpful if you are exploring internships this year.',
  },
  {
    title: 'Visa interview wait times updated',
    tag: 'General F1 news',
    body: 'Several US consulates reported changes to average visa interview wait times this month, useful context if you are planning international travel.',
  },
];

export default function NewsScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={<ThemedView style={{ height: 250 }} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">News</ThemedText>
      </ThemedView>

      {newsItems.map((item, index) => (
        <ThemedView key={index} style={styles.newsCard}>
          <ThemedText type="subtitle">{item.title}</ThemedText>
          <ThemedText
            style={item.tag === 'Affects you directly' ? styles.tagDirect : styles.tagGeneral}>
            {item.tag}
          </ThemedText>
          <ThemedText>{item.body}</ThemedText>
        </ThemedView>
      ))}
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
  tagDirect: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  tagGeneral: {
    color: '#888888',
    fontWeight: '600',
  },
});
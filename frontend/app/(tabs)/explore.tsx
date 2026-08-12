import { StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useState } from 'react';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const checklists = {
  Freshman: [
    { text: 'Complete SEVIS check-in with your DSO', link: 'https://www.ice.gov/sevis' },
    { text: 'Apply for a Social Security Number (if working on campus)', link: 'https://www.ssa.gov/ssnumber/' },
    { text: 'Set up a US bank account', link: 'https://www.usa.gov/banking' },
  ],
  Sophomore: [
    { text: 'Explore CPT eligibility for internships', link: 'https://www.uscis.gov/working-in-the-united-states' },
    { text: 'Build your resume on Handshake', link: 'https://joinhandshake.com' },
  ],
  Junior: [
    { text: 'Research OPT requirements', link: 'https://www.uscis.gov/opt' },
    { text: 'Start networking for post-grad jobs', link: 'https://joinhandshake.com' },
  ],
  Senior: [
    { text: 'File your OPT application (do this 90 days before graduation)', link: 'https://www.uscis.gov/opt' },
    { text: 'Understand STEM OPT extension eligibility', link: 'https://www.ice.gov/sevis/stem' },
  ],
};

export default function TimelineScreen() {
  const [activeTab, setActiveTab] = useState('Freshman');
  const tabs = ['Freshman', 'Sophomore', 'Junior', 'Senior'];

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={<ThemedView style={{ height: 250 }} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Timeline</ThemedText>
      </ThemedView>

      <ThemedView style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}>
            <ThemedText style={activeTab === tab && styles.tabTextActive}>{tab}</ThemedText>
          </TouchableOpacity>
        ))}
      </ThemedView>

      <ThemedView style={styles.checklistContainer}>
        <ThemedText type="subtitle">{activeTab} Checklist</ThemedText>
        {checklists[activeTab].map((item, index) => (
          <TouchableOpacity key={index} onPress={() => Linking.openURL(item.link)}>
            <ThemedText style={styles.checklistItem}>• {item.text}</ThemedText>
          </TouchableOpacity>
        ))}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F7',
  },
  tabButtonActive: {
    backgroundColor: '#6C63FF',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  checklistContainer: {
    gap: 8,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#F5F5F7',
    borderRadius: 16,
  },
  checklistItem: {
  color: '#6C63FF',
  marginBottom: 4,
},
});
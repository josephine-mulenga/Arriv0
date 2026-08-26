import { StyleSheet, TextInput, TouchableOpacity, Linking } from 'react-native';
import { useEffect, useState } from 'react';
import { getDsoDirectory, searchDso } from '@/api';
import { useAuth } from '@/AuthContext';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientHeaderBackground } from '@/components/gradient-header-background';

export default function DsoDirectoryScreen() {
  const { token } = useAuth();
  const [schools, setSchools] = useState(null);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [fallbackLink, setFallbackLink] = useState(null);

  const fetchDirectory = async () => {
  try {
    const data = await getDsoDirectory(token);
    setSchools(data.directory || []);
  } catch (err) {
    console.log('Error fetching DSO directory:', err.message);
  }
};

  useEffect(() => {
    if (token) fetchDirectory();
  }, [token]);

  const handleSearch = async () => {
  if (!query.trim()) {
    fetchDirectory();
    setFallbackLink(null);
    return;
  }
  setSearching(true);
  setFallbackLink(null);
  try {
    const data = await searchDso(query, token);
    const results = data.results || [];
    setSchools(results);
    if (results.length === 0 && data.uscis_fallback_link) {
      setFallbackLink(data.uscis_fallback_link);
    }
  } catch (err) {
    console.log('Error searching DSO:', err.message);
  } finally {
    setSearching(false);
  }
};

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#C7D9FF', dark: '#2A2450' }}
      headerImage={<GradientHeaderBackground logoSize={50} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText style={styles.screenTitle}>DSO Directory</ThemedText>
      </ThemedView>

      <ThemedView style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by school name..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={searching}>
          <ThemedText style={styles.searchButtonText}>{searching ? '...' : 'Search'}</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {schools ? (
        schools.length > 0 ? (
          schools.map((school, index) => (
            <ThemedView key={school.id || index} style={styles.schoolCard}>
              <ThemedText style={styles.schoolName}>{school.school}</ThemedText>
            {school.dso_office && (
            <ThemedText style={styles.dsoName}>DSO: {school.dso_office}</ThemedText>
            )}

              <ThemedView style={styles.actionRow}>
                {school.phone && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => Linking.openURL(`tel:${school.phone}`)}>
                    <ThemedText style={styles.actionButtonText}>📞 Call</ThemedText>
                  </TouchableOpacity>
                )}
                {school.email && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => Linking.openURL(`mailto:${school.email}`)}>
                    <ThemedText style={styles.actionButtonText}>✉️ Email</ThemedText>
                  </TouchableOpacity>
                )}
                {school.website && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => Linking.openURL(school.website)}>
                    <ThemedText style={styles.actionButtonText}>🌐 Website</ThemedText>
                  </TouchableOpacity>
                )}
              </ThemedView>
            </ThemedView>
          ))
        ) : (
          <ThemedView style={styles.emptyState}>
            <ThemedText style={{ marginBottom: 8 }}>No school found matching that search.</ThemedText>
            {fallbackLink && (
              <TouchableOpacity onPress={() => Linking.openURL(fallbackLink)}>
                <ThemedText style={styles.fallbackLink}>Check USCIS's official DSO lookup →</ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>
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
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 26,
    fontFamily: 'Fredoka_700Bold',
    color: '#1A1A2E',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
  },
  searchButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  schoolCard: {
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 16,
    backgroundColor: '#F0EEFF',
    borderRadius: 20,
  },
  schoolName: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 16,
    color: '#1A1A2E',
  },
  dsoName: {
    fontSize: 13,
    color: '#888',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    backgroundColor: 'transparent',
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  actionButtonText: {
    color: '#6C63FF',
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 13,
  },
  emptyState: {
    marginHorizontal: 16,
    padding: 16,
  },
  fallbackLink: {
    color: '#6C63FF',
    fontFamily: 'Fredoka_600SemiBold',
  },
});
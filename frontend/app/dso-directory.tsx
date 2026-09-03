import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Linking } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { CaretLeftIcon, PhoneIcon, EnvelopeSimpleIcon, GlobeIcon } from 'phosphor-react-native';

import { getDsoDirectory, searchDso } from '@/api';
import { useAuth } from '@/AuthContext';
import { Palette, Radius, Type } from '@/constants/theme';

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
    } catch {
      // keep whatever was last loaded
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
    } catch {
      // keep the current list on failure
    } finally {
      setSearching(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <CaretLeftIcon size={20} color={Palette.ink} weight="bold" />
        </Pressable>
        <Text style={styles.title}>DSO Directory</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by school name..."
          placeholderTextColor={Palette.inkPlaceholder}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
        />
        <Pressable style={styles.searchButton} onPress={handleSearch} disabled={searching}>
          <Text style={styles.searchButtonText}>{searching ? '...' : 'Search'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {schools ? (
          schools.length > 0 ? (
            schools.map((school, index) => (
              <View key={school.id || index} style={styles.schoolCard}>
                <Text style={styles.schoolName}>{school.school}</Text>
                {school.dso_office ? <Text style={styles.dsoName}>DSO: {school.dso_office}</Text> : null}

                <View style={styles.actionRow}>
                  {school.phone ? (
                    <Pressable style={styles.actionButton} onPress={() => Linking.openURL(`tel:${school.phone}`)}>
                      <PhoneIcon size={14} color={Palette.purple} />
                      <Text style={styles.actionButtonText}>Call</Text>
                    </Pressable>
                  ) : null}
                  {school.email ? (
                    <Pressable style={styles.actionButton} onPress={() => Linking.openURL(`mailto:${school.email}`)}>
                      <EnvelopeSimpleIcon size={14} color={Palette.purple} />
                      <Text style={styles.actionButtonText}>Email</Text>
                    </Pressable>
                  ) : null}
                  {school.website ? (
                    <Pressable style={styles.actionButton} onPress={() => Linking.openURL(school.website)}>
                      <GlobeIcon size={14} color={Palette.purple} />
                      <Text style={styles.actionButtonText}>Website</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.bodyText}>No school found matching that search.</Text>
              {fallbackLink ? (
                <Pressable onPress={() => Linking.openURL(fallbackLink)}>
                  <Text style={styles.fallbackLink}>Check USCIS&apos;s official DSO lookup →</Text>
                </Pressable>
              ) : null}
            </View>
          )
        ) : (
          <Text style={styles.bodyText}>Loading...</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 62,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontFamily: Type.headingBold,
    fontSize: 20,
    color: Palette.ink,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Palette.borderInput,
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.input,
    paddingHorizontal: 14,
    height: 44,
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    color: Palette.ink,
  },
  searchButton: {
    backgroundColor: Palette.purple,
    paddingHorizontal: 16,
    borderRadius: Radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    fontFamily: Type.bodySemiBold,
    color: Palette.white,
  },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  schoolCard: {
    gap: 6,
    marginBottom: 12,
    padding: 16,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.cardSmall,
  },
  schoolName: {
    fontFamily: Type.headingSemiBold,
    fontSize: 15,
    color: Palette.ink,
  },
  dsoName: {
    fontFamily: Type.bodyRegular,
    fontSize: 13,
    color: Palette.inkFaint,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.dividerLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  actionButtonText: {
    fontFamily: Type.bodySemiBold,
    fontSize: 13,
    color: Palette.purple,
  },
  emptyState: {
    padding: 4,
    gap: 8,
  },
  bodyText: {
    fontFamily: Type.bodyRegular,
    fontSize: 13.5,
    color: Palette.inkMuted,
  },
  fallbackLink: {
    fontFamily: Type.bodySemiBold,
    color: Palette.purple,
  },
});

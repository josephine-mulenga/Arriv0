import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  BriefcaseIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  BuildingsIcon,
  WarningCircleIcon,
} from 'phosphor-react-native';

import { getInternships } from '@/api';
import { useAuth } from '@/AuthContext';
import { IconTile } from '@/components/ui/icon-tile';
import { Palette, Spacing, Type } from '@/constants/theme';

interface InternshipItem {
  id?: string;
  title: string;
  company?: string;
  location?: string;
  description?: string;
  url?: string;
  created?: string;
  salary_min?: number;
  salary_max?: number;
}

function formatSalary(min?: number, max?: number): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min || max || 0);
}

function stripHtml(text?: string): string {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, '');
}

export default function InternshipsScreen() {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<InternshipItem[] | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [majorMatched, setMajorMatched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  const fetchInternships = async (searchQuery: string, targetPage: number, append: boolean) => {
    if (!token) return;
    try {
      const data = await getInternships(token, { query: searchQuery || undefined, page: targetPage });
      setItems((prev) => (append && prev ? [...prev, ...(data.results ?? [])] : data.results ?? []));
      setHasMore(!!data.has_more);
      setPage(data.page ?? targetPage);
      setMajorMatched(!!data.major_matched);
      setErrorMessage(null);
      setNotConfigured(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load internships.';
      if (message.toLowerCase().includes("isn't set up")) {
        setNotConfigured(true);
      } else {
        setErrorMessage(message);
      }
      if (!append) setItems([]);
    }
  };

  useEffect(() => {
    if (!token) return;
    setItems(null);
    fetchInternships('', 1, false);
  }, [token]);

  const handleSearch = () => {
    setItems(null);
    fetchInternships(query.trim(), 1, false);
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await fetchInternships(query.trim(), page + 1, true);
    setLoadingMore(false);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Internships</Text>
        </View>

        <View style={styles.searchBar}>
          <MagnifyingGlassIcon size={17} color={Palette.inkFaint} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search internships"
            placeholderTextColor={Palette.inkPlaceholder}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>

        {majorMatched && items && items.length > 0 && (
          <View style={styles.matchBanner}>
            <Text style={styles.matchBannerText}>Matched to your major</Text>
          </View>
        )}

        <View style={styles.disclaimer}>
          <WarningCircleIcon size={15} color={Palette.inkMuted} />
          <Text style={styles.disclaimerText}>
            These are general listings pulled by keyword — we don&apos;t confirm CPT/OPT
            eligibility for any specific role. Check your own authorization status with your DSO
            or in Timeline before applying.
          </Text>
        </View>

        {notConfigured && (
          <View style={styles.emptyState}>
            <BriefcaseIcon size={36} color="#CFC9F5" />
            <Text style={styles.emptyTitle}>Internship search isn&apos;t set up yet</Text>
            <Text style={styles.emptyBody}>Check back soon — we&apos;re still connecting this feature.</Text>
          </View>
        )}

        {!notConfigured && errorMessage && (
          <View style={styles.emptyState}>
            <WarningCircleIcon size={36} color="#CFC9F5" />
            <Text style={styles.emptyTitle}>Couldn&apos;t load internships</Text>
            <Text style={styles.emptyBody}>{errorMessage}</Text>
          </View>
        )}

        {!notConfigured && !errorMessage && items === null && (
          <Text style={styles.loadingText}>Loading internships...</Text>
        )}

        {!notConfigured && !errorMessage && items !== null && items.length === 0 && (
          <View style={styles.emptyState}>
            <BriefcaseIcon size={36} color="#CFC9F5" />
            <Text style={styles.emptyTitle}>No internships found</Text>
            <Text style={styles.emptyBody}>Try a different search term.</Text>
          </View>
        )}

        {items?.map((item, index) => {
          const salary = formatSalary(item.salary_min, item.salary_max);
          return (
            <Pressable
              key={item.id ?? index}
              style={[styles.row, index === items.length - 1 && styles.rowLast]}
              onPress={() => item.url && Linking.openURL(item.url)}>
              <IconTile icon={BriefcaseIcon} tint={Palette.purpleTint} color={Palette.purple} size={44} iconSize={20} />
              <View style={{ flex: 1 }}>
                <Text style={styles.jobTitle} numberOfLines={2}>{item.title}</Text>
                {item.company ? (
                  <View style={styles.metaRow}>
                    <BuildingsIcon size={13} color={Palette.inkFaint} />
                    <Text style={styles.metaText} numberOfLines={1}>{item.company}</Text>
                  </View>
                ) : null}
                {item.location ? (
                  <View style={styles.metaRow}>
                    <MapPinIcon size={13} color={Palette.inkFaint} />
                    <Text style={styles.metaText} numberOfLines={1}>{item.location}</Text>
                  </View>
                ) : null}
                {item.description ? (
                  <Text style={styles.description} numberOfLines={2}>{stripHtml(item.description)}</Text>
                ) : null}
                {salary ? <Text style={styles.salary}>{salary}</Text> : null}
              </View>
            </Pressable>
          );
        })}

        {hasMore && items && items.length > 0 && (
          <Pressable style={styles.loadMoreButton} onPress={handleLoadMore} disabled={loadingMore}>
            {loadingMore ? (
              <ActivityIndicator color={Palette.purple} />
            ) : (
              <Text style={styles.loadMoreText}>Load more</Text>
            )}
          </Pressable>
        )}
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
  },
  title: {
    fontFamily: Type.headingBold,
    fontSize: 22,
    color: Palette.ink,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    marginBottom: 16,
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
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 108,
  },
  matchBanner: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.purpleTint,
    borderRadius: 9,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  matchBannerText: {
    fontFamily: Type.bodyBold,
    fontSize: 11,
    color: Palette.purple,
  },
  disclaimer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Palette.surfaceSubtle,
    borderWidth: 1,
    borderColor: Palette.divider,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: Type.bodyRegular,
    fontSize: 12,
    lineHeight: 17,
    color: Palette.inkMuted,
  },
  loadingText: {
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
  jobTitle: {
    fontFamily: Type.bodyBold,
    fontSize: 14.5,
    lineHeight: 20,
    color: Palette.ink,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  metaText: {
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.inkFaint,
  },
  description: {
    marginTop: 6,
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    lineHeight: 18,
    color: Palette.inkMuted,
  },
  salary: {
    marginTop: 6,
    fontFamily: Type.bodySemiBold,
    fontSize: 12.5,
    color: Palette.green,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 30,
    gap: 6,
  },
  emptyTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 16,
    color: Palette.ink,
    marginTop: 6,
  },
  emptyBody: {
    textAlign: 'center',
    fontFamily: Type.bodyRegular,
    fontSize: 13,
    lineHeight: 19,
    color: Palette.inkMuted,
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

import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  BriefcaseIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  BuildingsIcon,
  WarningCircleIcon,
  BellIcon,
  XIcon,
} from 'phosphor-react-native';

import { getInternships, searchInternshipCompanies, watchCompany, getWatchedCompanies, unwatchCompany } from '@/api';
import { useAuth } from '@/AuthContext';
import { IconTile } from '@/components/ui/icon-tile';
import { Palette, Spacing, Type } from '@/constants/theme';

interface SponsorshipSignal {
  label: string;
  sentiment: 'positive' | 'negative' | 'info';
}

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
  source?: string;
  application_url?: string;
  sponsorship_language?: SponsorshipSignal[];
  match_reasons?: string[];
}

function sponsorshipSummary(signals?: SponsorshipSignal[]): { label: string; kind: 'positive' | 'negative' } | null {
  if (!signals || signals.length === 0) return null;
  if (signals.some((s) => s.sentiment === 'negative')) return { label: 'No sponsorship', kind: 'negative' };
  if (signals.some((s) => s.sentiment === 'positive')) return { label: 'Sponsors F1/CPT', kind: 'positive' };
  return null;
}

interface CompanyResult {
  name: string;
  logo_url?: string;
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

  const [companyQuery, setCompanyQuery] = useState('');
  const [companySuggestions, setCompanySuggestions] = useState<CompanyResult[]>([]);
  const [watchedCompanies, setWatchedCompanies] = useState<CompanyResult[]>([]);
  const [brokenLogos, setBrokenLogos] = useState<Set<string>>(new Set());
  const [watching, setWatching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const data = await getWatchedCompanies(token);
        setWatchedCompanies(data.watched_companies ?? []);
      } catch {
        // leave last-known list on failure
      }
    })();
  }, [token]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = companyQuery.trim();
    debounceRef.current = setTimeout(async () => {
      if (!token || trimmed.length < 2) {
        setCompanySuggestions([]);
        return;
      }
      try {
        const data = await searchInternshipCompanies(trimmed, token);
        setCompanySuggestions(data.companies ?? []);
      } catch {
        setCompanySuggestions([]);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [companyQuery, token]);

  const handleWatchCompany = async (company: string) => {
    if (!token || watching) return;
    setWatching(true);
    try {
      const result = await watchCompany(company, token);
      setWatchedCompanies(result.watched_companies ?? []);
      setCompanyQuery('');
      setCompanySuggestions([]);
    } catch {
      // leave the search box as-is so the user can retry
    } finally {
      setWatching(false);
    }
  };

  const handleUnwatch = async (company: string) => {
    if (!token) return;
    const previous = watchedCompanies;
    setWatchedCompanies((prev) => prev.filter((c) => c.name !== company));
    try {
      const result = await unwatchCompany(company, token);
      setWatchedCompanies(result.watched_companies ?? []);
    } catch {
      setWatchedCompanies(previous);
    }
  };

  const fetchInternships = async (searchQuery: string, targetPage: number, append: boolean) => {
    if (!token) return;
    if (!append) setItems(null);
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
    fetchInternships('', 1, false);
  }, [token]);

  const handleSearch = () => {
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

        <View style={styles.watchSection}>
          <View style={styles.watchSectionHeader}>
            <BellIcon size={16} color={Palette.purple} weight="fill" />
            <Text style={styles.sectionTitle}>Watch Companies</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            You&apos;ll be notified within 30 minutes of new postings from companies you watch.
          </Text>

          <View style={styles.watchSearchBar}>
            <MagnifyingGlassIcon size={16} color={Palette.inkFaint} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a company to watch"
              placeholderTextColor={Palette.inkPlaceholder}
              value={companyQuery}
              onChangeText={setCompanyQuery}
            />
          </View>

          {companySuggestions.length > 0 && (
            <View style={styles.suggestionDropdown}>
              {companySuggestions.map((item, index) => (
                <Pressable
                  key={item.name}
                  style={[styles.suggestionRow, index === companySuggestions.length - 1 && styles.rowLast]}
                  disabled={watching}
                  onPress={() => handleWatchCompany(item.name)}>
                  {item.logo_url && !brokenLogos.has(item.logo_url) ? (
                    <Image
                      source={{ uri: item.logo_url }}
                      style={styles.companyLogo}
                      onError={() => setBrokenLogos((prev) => new Set(prev).add(item.logo_url!))}
                    />
                  ) : (
                    <BuildingsIcon size={15} color={Palette.inkFaint} />
                  )}
                  <Text style={styles.suggestionText}>{item.name}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {watchedCompanies.length > 0 && (
            <View style={styles.watchedChipsRow}>
              {watchedCompanies.map((item) => (
                <View key={item.name} style={styles.watchedChip}>
                  {item.logo_url && !brokenLogos.has(item.logo_url) ? (
                    <Image
                      source={{ uri: item.logo_url }}
                      style={styles.watchedChipLogo}
                      onError={() => setBrokenLogos((prev) => new Set(prev).add(item.logo_url!))}
                    />
                  ) : null}
                  <Text style={styles.watchedChipText}>{item.name}</Text>
                  <Pressable onPress={() => handleUnwatch(item.name)} hitSlop={8}>
                    <XIcon size={12} color={Palette.purple} weight="bold" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
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
          const applyUrl = item.application_url || item.url;
          const sponsorship = sponsorshipSummary(item.sponsorship_language);
          return (
            <Pressable
              key={item.id ?? index}
              style={[styles.row, index === items.length - 1 && styles.rowLast]}
              onPress={() => applyUrl && Linking.openURL(applyUrl)}>
              <IconTile icon={BriefcaseIcon} tint={Palette.purpleTint} color={Palette.purple} size={44} iconSize={20} />
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.jobTitle} numberOfLines={2}>{item.title}</Text>
                  {item.source ? (
                    <View style={styles.sourceBadge}>
                      <Text style={styles.sourceBadgeText}>{item.source}</Text>
                    </View>
                  ) : null}
                </View>
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
                {sponsorship ? (
                  <View style={[styles.sponsorshipBadge, sponsorship.kind === 'negative' ? styles.sponsorshipBadgeNegative : styles.sponsorshipBadgePositive]}>
                    <Text style={[styles.sponsorshipBadgeText, sponsorship.kind === 'negative' ? styles.sponsorshipBadgeTextNegative : styles.sponsorshipBadgeTextPositive]}>
                      {sponsorship.kind === 'negative' ? `⚠ ${sponsorship.label}` : sponsorship.label}
                    </Text>
                  </View>
                ) : null}
                {item.match_reasons && item.match_reasons.length > 0 ? (
                  <View style={styles.matchReasonsBlock}>
                    {item.match_reasons.map((reason, reasonIndex) => (
                      <Text key={reasonIndex} style={styles.matchReasonText} numberOfLines={2}>
                        • {reason}
                      </Text>
                    ))}
                  </View>
                ) : null}
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
  watchSection: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  watchSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 15,
    color: Palette.ink,
  },
  sectionSubtitle: {
    marginTop: 4,
    fontFamily: Type.bodyRegular,
    fontSize: 12,
    lineHeight: 17,
    color: Palette.inkMuted,
  },
  watchSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: Palette.dividerLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  suggestionDropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: Palette.divider,
    borderRadius: 12,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.divider,
  },
  suggestionText: {
    fontFamily: Type.bodyRegular,
    fontSize: 13.5,
    color: Palette.ink,
  },
  companyLogo: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  watchedChipLogo: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  watchedChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  watchedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.purpleTint,
    borderRadius: 9,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  watchedChipText: {
    fontFamily: Type.bodySemiBold,
    fontSize: 12.5,
    color: Palette.purple,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  jobTitle: {
    flex: 1,
    fontFamily: Type.bodyBold,
    fontSize: 14.5,
    lineHeight: 20,
    color: Palette.ink,
  },
  sourceBadge: {
    backgroundColor: Palette.dividerLight,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  sourceBadgeText: {
    fontFamily: Type.bodySemiBold,
    fontSize: 10.5,
    color: Palette.inkFaint,
  },
  sponsorshipBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sponsorshipBadgePositive: {
    backgroundColor: Palette.greenTint,
  },
  sponsorshipBadgeNegative: {
    backgroundColor: Palette.redTint,
  },
  sponsorshipBadgeText: {
    fontFamily: Type.bodySemiBold,
    fontSize: 11.5,
  },
  sponsorshipBadgeTextPositive: {
    color: Palette.green,
  },
  sponsorshipBadgeTextNegative: {
    color: Palette.danger,
  },
  matchReasonsBlock: {
    marginTop: 6,
    gap: 2,
  },
  matchReasonText: {
    fontFamily: Type.bodyRegular,
    fontSize: 11.5,
    lineHeight: 16,
    color: Palette.purple,
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

import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Animated, { FadeIn, FadeInUp, LinearTransition, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import {
  BriefcaseIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  BuildingsIcon,
  WarningCircleIcon,
  BellIcon,
  XIcon,
  BookmarkSimpleIcon,
  SparkleIcon,
  ShieldCheckIcon,
  ArrowSquareOutIcon,
  CaretDownIcon,
  CaretUpIcon,
} from 'phosphor-react-native';

import {
  getInternships,
  searchInternshipCompanies,
  watchCompany,
  getWatchedCompanies,
  unwatchCompany,
  addInternshipBookmark,
  getInternshipBookmarks,
  deleteInternshipBookmark,
} from '@/api';
import { useAuth } from '@/AuthContext';
import { Chip } from '@/components/ui/chip';
import { SkeletonList } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Palette, Spacing, Type, FontSize } from '@/constants/theme';
import { friendlyErrorMessage } from '@/utils/errorMessage';
import { getLastSeen, markCompaniesSeenNow } from '@/utils/watchlistSeen';

const SECTIONS = ['Recommended', 'New This Week', 'Watching', 'Saved'];
const STALE_AFTER_MS = 30 * 60 * 1000;
const NEW_POSTING_WINDOW_DAYS = 3;

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
  posted_date?: string;
  salary_min?: number;
  salary_max?: number;
  source?: string;
  application_url?: string;
  logo_url?: string;
  sponsorship_language?: SponsorshipSignal[];
  match_reasons?: string[];
  match_pills?: string[];
  match_score?: number;
}

interface CompanyResult {
  name: string;
  logo_url?: string;
}

interface Bookmark {
  id: string;
  internship_title: string;
  internship_company?: string;
  internship_url?: string;
  internship_source?: string;
  internship_location?: string;
}

function sponsorshipSummary(signals?: SponsorshipSignal[]): { label: string; kind: 'positive' | 'negative' | 'neutral' } {
  if (signals && signals.some((s) => s.sentiment === 'negative')) return { label: 'No sponsorship', kind: 'negative' };
  if (signals && signals.some((s) => s.sentiment === 'positive')) return { label: 'Sponsors F1/CPT', kind: 'positive' };
  return { label: 'Not specified', kind: 'neutral' };
}

function workAuthText(signals?: SponsorshipSignal[]): string {
  const positive = signals?.find((s) => s.sentiment === 'positive');
  if (positive) return `Employer posting mentions: "${positive.label}"`;
  const negative = signals?.find((s) => s.sentiment === 'negative');
  if (negative) return `Employer posting says: "${negative.label}"`;
  return 'Authorization information not confirmed.';
}

function matchBadgeStyle(score = 0): { bg: string; color: string } {
  if (score >= 80) return { bg: Palette.greenTint, color: Palette.green };
  if (score >= 50) return { bg: Palette.amberTint, color: Palette.amber };
  return { bg: Palette.dividerLight, color: Palette.inkFaint };
}

function isWithinDays(dateStr: string | undefined, days: number): boolean {
  if (!dateStr) return false;
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return false;
  return Date.now() - then < days * 24 * 60 * 60 * 1000;
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

function bookmarkToItem(b: Bookmark): InternshipItem {
  return {
    id: b.id,
    title: b.internship_title,
    company: b.internship_company,
    application_url: b.internship_url,
    source: b.internship_source,
    location: b.internship_location,
  };
}

export default function InternshipsScreen() {
  const { token } = useAuth();
  const [section, setSection] = useState('Recommended');
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
  const [watchingItems, setWatchingItems] = useState<InternshipItem[] | null>(null);
  const [brokenLogos, setBrokenLogos] = useState<Set<string>>(new Set());
  const [watching, setWatching] = useState(false);
  const [newCounts, setNewCounts] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string | number>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchedAt = useRef(0);

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  const fetchBookmarks = async () => {
    if (!token) return;
    try {
      const data = await getInternshipBookmarks(token);
      setBookmarks(data.bookmarks ?? []);
    } catch {
      // ignore; bookmark state just won't reflect saved internships
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchBookmarks();
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
      lastFetchedAt.current = Date.now();
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : '';
      if (rawMessage.toLowerCase().includes("isn't set up")) {
        setNotConfigured(true);
      } else {
        setErrorMessage(friendlyErrorMessage(err, 'Could not load opportunities right now.'));
      }
      if (!append) setItems([]);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchInternships('', 1, false);
  }, [token]);

  // Re-pull whenever the tab regains focus if it's been more than 30
  // minutes since the last successful fetch — the screen stays mounted
  // while the user is elsewhere, so a plain mount-only effect would keep
  // showing stale postings indefinitely.
  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      if (Date.now() - lastFetchedAt.current < STALE_AFTER_MS) return;
      fetchInternships(query.trim(), 1, false);
    }, [token])
  );

  // "Watching" is fetched lazily the first time that section is opened, one
  // getInternships call per watched company (reusing the same major/
  // company-search endpoint the rest of this screen already uses), merged
  // into one list. Also tallies how many of each company's postings are
  // newer than the last time this section was viewed, for the "New" badge
  // on the watched-company chips — then marks all of them seen so the badge
  // clears once the user has actually looked.
  useEffect(() => {
    if (section !== 'Watching' || !token || watchedCompanies.length === 0) return;
    (async () => {
      setWatchingItems(null);
      try {
        const results = await Promise.all(
          watchedCompanies.map((c) => getInternships(token, { query: c.name }).catch(() => ({ results: [] })))
        );
        const merged: InternshipItem[] = [];
        const seen = new Set<string>();
        const counts: Record<string, number> = {};
        for (let i = 0; i < results.length; i++) {
          const company = watchedCompanies[i].name;
          const lastSeenIso = await getLastSeen(company);
          const lastSeenAt = lastSeenIso
            ? new Date(lastSeenIso).getTime()
            : Date.now() - NEW_POSTING_WINDOW_DAYS * 24 * 60 * 60 * 1000;
          for (const item of results[i].results ?? []) {
            const key = `${(item.title || '').toLowerCase()}|${(item.company || '').toLowerCase()}`;
            if (!seen.has(key)) {
              seen.add(key);
              merged.push(item);
            }
            const postedAt = new Date(item.posted_date || item.created || 0).getTime();
            if (postedAt > lastSeenAt) {
              counts[company] = (counts[company] ?? 0) + 1;
            }
          }
        }
        setWatchingItems(merged);
        setNewCounts(counts);
        markCompaniesSeenNow(watchedCompanies.map((c) => c.name));
      } catch {
        setWatchingItems([]);
      }
    })();
  }, [section, token, watchedCompanies]);

  const handleSearch = () => {
    fetchInternships(query.trim(), 1, false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInternships(query.trim(), 1, false);
    setRefreshing(false);
  };

  const toggleExpanded = (id: string | number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await fetchInternships(query.trim(), page + 1, true);
    setLoadingMore(false);
  };

  const isBookmarked = (item: InternshipItem) =>
    bookmarks.some((b) => b.internship_title === item.title && b.internship_company === item.company);
  const getBookmarkId = (item: InternshipItem) =>
    bookmarks.find((b) => b.internship_title === item.title && b.internship_company === item.company)?.id;

  const handleToggleBookmark = async (item: InternshipItem) => {
    if (!token) return;
    try {
      if (isBookmarked(item)) {
        const bookmarkId = getBookmarkId(item);
        if (bookmarkId) await deleteInternshipBookmark(bookmarkId, token);
      } else {
        await addInternshipBookmark(item, token);
      }
      await fetchBookmarks();
    } catch {
      // ignore; user can retry
    }
  };

  const handleAskArri = (item: InternshipItem) => {
    router.push({
      pathname: '/chat',
      params: {
        prefill: `Tell me about this internship at ${item.company || 'this company'} and whether it fits my profile: "${item.title}"`,
      },
    });
  };

  const newThisWeek = (items ?? []).filter((item) => isWithinDays(item.posted_date || item.created, 7));
  const savedItems = bookmarks.map(bookmarkToItem);

  const displayedItems =
    section === 'Recommended' ? items :
    section === 'New This Week' ? newThisWeek :
    section === 'Watching' ? watchingItems :
    savedItems;

  const showSearch = section === 'Recommended';
  const showWatchManager = section === 'Watching';

  return (
    <Animated.View style={styles.root} entering={FadeIn.duration(220)}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Palette.purple} colors={[Palette.purple]} />
        }>
        <View style={styles.header}>
          <Text style={styles.title}>Opportunities for you</Text>
          <Text style={styles.subtitle}>Based on your major, skills, and graduation year</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipRow}>
          {SECTIONS.map((s) => (
            <Chip key={s} label={s} selected={section === s} onPress={() => setSection(s)} />
          ))}
        </ScrollView>

        {showSearch && (
          <>
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
                or in Journey before applying.
              </Text>
            </View>
          </>
        )}

        {showWatchManager && (
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
                    <Text style={styles.suggestionText} numberOfLines={1}>{item.name}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {watchedCompanies.length > 0 && (
              <Animated.View layout={LinearTransition.duration(220)} style={styles.watchedChipsRow}>
                {watchedCompanies.map((item) => {
                  const newCount = newCounts[item.name] ?? 0;
                  return (
                    <Animated.View
                      key={item.name}
                      entering={SlideInRight.duration(240)}
                      exiting={SlideOutLeft.duration(180)}
                      layout={LinearTransition.duration(220)}
                      style={styles.watchedChip}>
                      {item.logo_url && !brokenLogos.has(item.logo_url) ? (
                        <Image
                          source={{ uri: item.logo_url }}
                          style={styles.watchedChipLogo}
                          onError={() => setBrokenLogos((prev) => new Set(prev).add(item.logo_url!))}
                        />
                      ) : (
                        <BuildingsIcon size={13} color={Palette.purple} />
                      )}
                      <Text style={styles.watchedChipText} numberOfLines={1}>{item.name}</Text>
                      {newCount > 0 && (
                        <View style={styles.newBadge}>
                          <Text style={styles.newBadgeText}>New · {newCount}</Text>
                        </View>
                      )}
                      <Pressable onPress={() => handleUnwatch(item.name)} hitSlop={8}>
                        <XIcon size={12} color={Palette.purple} weight="bold" />
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </Animated.View>
            )}
          </View>
        )}

        {section === 'Recommended' && notConfigured && (
          <EmptyState
            icon={BriefcaseIcon}
            title="Internship search isn't set up yet"
            body="Check back soon — we're still connecting this feature."
          />
        )}

        {section === 'Recommended' && !notConfigured && errorMessage && (
          <ErrorState
            message="Could not load opportunities right now."
            onRetry={() => fetchInternships(query.trim(), 1, false)}
          />
        )}

        {!notConfigured && !errorMessage && displayedItems === null && <SkeletonList />}

        {!notConfigured && !errorMessage && displayedItems !== null && displayedItems.length === 0 && (
          <EmptyState
            icon={section === 'Saved' ? BookmarkSimpleIcon : BriefcaseIcon}
            title={
              section === 'Saved'
                ? 'No saved opportunities yet'
                : section === 'Watching'
                  ? 'No postings from watched companies yet'
                  : 'No matching internships'
            }
            body={
              section === 'Saved'
                ? 'Save opportunities you want to come back to.'
                : section === 'Watching' && watchedCompanies.length === 0
                  ? 'Add a company above to start watching for new postings.'
                  : section === 'Recommended'
                    ? 'Complete your profile for better matches.'
                    : 'Try a different search term.'
            }
          />
        )}

        {displayedItems?.map((item, index) => {
          const salary = formatSalary(item.salary_min, item.salary_max);
          const applyUrl = item.application_url || item.url;
          const sponsorship = sponsorshipSummary(item.sponsorship_language);
          const matchColors = matchBadgeStyle(item.match_score);
          const saved = isBookmarked(item);
          const itemKey = item.id ?? index;
          const expanded = expandedIds.has(itemKey);
          return (
            <Animated.View
              key={itemKey}
              entering={FadeInUp.delay(Math.min(index, 8) * 45).duration(320)}
              style={[styles.card, index === displayedItems.length - 1 && styles.cardLast]}>
              <Pressable onPress={() => toggleExpanded(itemKey)}>
                <View style={styles.cardTop}>
                  {item.logo_url && !brokenLogos.has(item.logo_url) ? (
                    <Image
                      source={{ uri: item.logo_url }}
                      style={styles.jobLogo}
                      onError={() => setBrokenLogos((prev) => new Set(prev).add(item.logo_url!))}
                    />
                  ) : (
                    <View style={styles.jobLogoFallback}>
                      <BriefcaseIcon size={18} color={Palette.purple} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text style={styles.jobTitle} numberOfLines={2}>{item.title}</Text>
                      {typeof item.match_score === 'number' ? (
                        <View style={[styles.matchBadge, { backgroundColor: matchColors.bg }]}>
                          <Text style={[styles.matchBadgeText, { color: matchColors.color }]}>{item.match_score}%</Text>
                        </View>
                      ) : null}
                    </View>
                    {item.company ? (
                      <View style={styles.metaRow}>
                        <BuildingsIcon size={13} color={Palette.inkFaint} />
                        <Text style={styles.metaText} numberOfLines={1}>{item.company}</Text>
                        {item.source ? (
                          <View style={styles.sourceBadge}>
                            <Text style={styles.sourceBadgeText}>{item.source}</Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                    {item.location ? (
                      <View style={styles.metaRow}>
                        <MapPinIcon size={13} color={Palette.inkFaint} />
                        <Text style={styles.metaText} numberOfLines={1}>{item.location}</Text>
                      </View>
                    ) : null}
                  </View>
                  {expanded ? (
                    <CaretUpIcon size={14} color={Palette.chevron} />
                  ) : (
                    <CaretDownIcon size={14} color={Palette.chevron} />
                  )}
                </View>

                {item.description ? (
                  <Text style={styles.description} numberOfLines={expanded ? undefined : 2}>
                    {stripHtml(item.description)}
                  </Text>
                ) : null}
                {salary ? <Text style={styles.salary}>{salary}</Text> : null}

                {expanded && (
                  <>
                    {item.match_pills && item.match_pills.length > 0 ? (
                      <View style={styles.pillsRow}>
                        {item.match_pills.map((pill, pillIndex) => (
                          <View key={pillIndex} style={styles.pill}>
                            <Text style={styles.pillText}>{pill}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    <View
                      style={[
                        styles.sponsorshipBadge,
                        sponsorship.kind === 'negative'
                          ? styles.sponsorshipBadgeNegative
                          : sponsorship.kind === 'positive'
                            ? styles.sponsorshipBadgePositive
                            : styles.sponsorshipBadgeNeutral,
                      ]}>
                      <Text
                        style={[
                          styles.sponsorshipBadgeText,
                          sponsorship.kind === 'negative'
                            ? styles.sponsorshipBadgeTextNegative
                            : sponsorship.kind === 'positive'
                              ? styles.sponsorshipBadgeTextPositive
                              : styles.sponsorshipBadgeTextNeutral,
                        ]}>
                        {sponsorship.kind === 'negative' ? `⚠ ${sponsorship.label}` : sponsorship.label}
                      </Text>
                    </View>

                    <View style={styles.workAuthBlock}>
                      <View style={styles.workAuthHeader}>
                        <ShieldCheckIcon size={13} color={Palette.inkMuted} />
                        <Text style={styles.workAuthLabel}>Work authorization</Text>
                      </View>
                      <Text style={styles.workAuthText}>{workAuthText(item.sponsorship_language)}</Text>
                    </View>
                  </>
                )}
              </Pressable>

              <View style={styles.cardFooter}>
                <Pressable hitSlop={8} onPress={() => handleToggleBookmark(item)} style={styles.footerAction}>
                  <BookmarkSimpleIcon size={16} color={saved ? Palette.purple : Palette.inkFaint} weight={saved ? 'fill' : 'regular'} />
                </Pressable>
                <Pressable style={styles.askArriLink} onPress={() => handleAskArri(item)} hitSlop={6}>
                  <SparkleIcon size={12} color={Palette.purple} weight="fill" />
                  <Text style={styles.askArriText}>Ask Arri about this</Text>
                </Pressable>
                <View style={{ flex: 1 }} />
                {applyUrl ? (
                  <Pressable style={styles.applyButton} onPress={() => Linking.openURL(applyUrl)}>
                    <Text style={styles.applyButtonText}>Apply</Text>
                    <ArrowSquareOutIcon size={12} color={Palette.white} weight="bold" />
                  </Pressable>
                ) : null}
              </View>
            </Animated.View>
          );
        })}

        {section === 'Recommended' && hasMore && items && items.length > 0 && (
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
    fontSize: 20,
    color: Palette.ink,
  },
  subtitle: {
    marginTop: 3,
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.inkFaint,
  },
  chipScroll: {
    height: 56,
    flexGrow: 0,
    flexShrink: 0,
  },
  chipRow: {
    gap: 8,
    alignItems: 'center',
    paddingVertical: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
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
    fontSize: 12,
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
    marginBottom: 12,
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
  rowLast: {
    borderBottomWidth: 0,
  },
  suggestionText: {
    flexShrink: 1,
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
  newBadge: {
    backgroundColor: Palette.danger,
    borderRadius: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  newBadgeText: {
    fontFamily: Type.bodyBold,
    fontSize: 12,
    color: Palette.white,
  },
  watchedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 200,
    backgroundColor: Palette.purpleTint,
    borderRadius: 9,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  watchedChipText: {
    flexShrink: 1,
    fontFamily: Type.bodySemiBold,
    fontSize: 12.5,
    color: Palette.purple,
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
    gap: 10,
  },
  jobLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Palette.dividerLight,
  },
  jobLogoFallback: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Palette.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 14,
    lineHeight: 19,
    color: Palette.ink,
  },
  matchBadge: {
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  matchBadgeText: {
    fontFamily: Type.bodyBold,
    fontSize: 12,
  },
  sourceBadge: {
    backgroundColor: Palette.dividerLight,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  sourceBadgeText: {
    fontFamily: Type.bodySemiBold,
    fontSize: 12,
    color: Palette.inkFaint,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  metaText: {
    fontFamily: Type.bodyRegular,
    fontSize: 12,
    color: Palette.inkFaint,
  },
  description: {
    marginTop: 6,
    fontFamily: Type.bodyRegular,
    fontSize: FontSize.body,
    lineHeight: FontSize.bodyLine,
    color: Palette.inkMuted,
  },
  salary: {
    marginTop: 6,
    fontFamily: Type.bodySemiBold,
    fontSize: 12.5,
    color: Palette.green,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  pill: {
    backgroundColor: Palette.purpleTint,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillText: {
    fontFamily: Type.bodySemiBold,
    fontSize: 12,
    color: Palette.purple,
  },
  sponsorshipBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
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
  sponsorshipBadgeNeutral: {
    backgroundColor: Palette.dividerLight,
  },
  sponsorshipBadgeText: {
    fontFamily: Type.bodySemiBold,
    fontSize: 12,
  },
  sponsorshipBadgeTextPositive: {
    color: Palette.green,
  },
  sponsorshipBadgeTextNegative: {
    color: Palette.danger,
  },
  sponsorshipBadgeTextNeutral: {
    color: Palette.inkFaint,
  },
  workAuthBlock: {
    marginTop: 8,
    backgroundColor: Palette.surfaceSubtle,
    borderWidth: 1,
    borderColor: Palette.divider,
    borderRadius: 10,
    padding: 9,
  },
  workAuthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  workAuthLabel: {
    fontFamily: Type.bodyBold,
    fontSize: 12,
    letterSpacing: 0.3,
    color: Palette.inkMuted,
  },
  workAuthText: {
    marginTop: 3,
    fontFamily: Type.bodyRegular,
    fontSize: 12,
    lineHeight: 16,
    color: Palette.inkBody,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
  },
  footerAction: {
    padding: 2,
  },
  askArriLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  askArriText: {
    fontFamily: Type.bodySemiBold,
    fontSize: 12,
    color: Palette.purple,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.purple,
    borderRadius: 9,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  applyButtonText: {
    fontFamily: Type.bodySemiBold,
    fontSize: 12,
    color: Palette.white,
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

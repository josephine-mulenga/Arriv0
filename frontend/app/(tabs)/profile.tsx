import { useCallback, useState } from 'react';
import { Alert, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  CaretRightIcon,
  CaretDownIcon,
  CaretUpIcon,
  FolderSimpleIcon,
  BellIcon,
  CloudSlashIcon,
  GiftIcon,
  CameraIcon,
  ImageIcon,
  EnvelopeSimpleIcon,
  ChatCenteredDotsIcon,
  IdentificationCardIcon,
  GraduationCapIcon,
  BriefcaseIcon,
  SlidersHorizontalIcon,
  BookmarkSimpleIcon,
  UserCircleIcon,
  LifebuoyIcon,
  WarningCircleIcon,
  type Icon,
} from 'phosphor-react-native';

import { getUserProfile, uploadAvatar, updateProfile, getOnboardingScore, getDocuments } from '@/api';
import { useAuth } from '@/AuthContext';
import { SkeletonList } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { Palette, Radius, Spacing, Type } from '@/constants/theme';

interface ProfileData {
  name?: string;
  school?: string;
  major?: string;
  visa_type?: string;
  year_level?: number;
  program_start_date?: string;
  program_end_date?: string;
  avatar_url?: string;
  has_ssn?: boolean;
  has_bank_account?: boolean;
  cpt_months_used?: number;
  career_interests?: string[];
  location_preference?: string;
  notification_time?: string;
  push_token?: string;
}

interface ScoreData {
  percentage: number;
  next_step?: string | null;
}

const SUPPORT_EMAIL = 'prince@arriv0.com';
const COFOUNDER_EMAIL = 'josephine@arriv0.com';

const yearLevelNames: Record<number, string> = {
  1: 'Freshman',
  2: 'Sophomore',
  3: 'Junior',
  4: 'Senior',
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [score, setScore] = useState<ScoreData | null>(null);
  const [docCounts, setDocCounts] = useState<{ collected: number; total: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token || !user) return;
    getUserProfile(user.id, token)
      .then((data) => {
        setProfile(data);
        setErrorMessage(null);
      })
      .catch(() => setErrorMessage('We could not load your profile.'));
    getOnboardingScore(token)
      .then(setScore)
      .catch(() => {});
    getDocuments(token)
      .then((data) => {
        const docs = data.documents ?? data ?? [];
        if (Array.isArray(docs)) {
          setDocCounts({ collected: docs.filter((d: any) => d.collected).length, total: docs.length });
        }
      })
      .catch(() => {});
  }, [token, user]);

  useFocusEffect(load);

  const doUpload = async (imageUri: string) => {
    if (!user || !token) return;
    setUploading(true);
    try {
      const publicUrl = await uploadAvatar(user.id, imageUri, token);
      await updateProfile(user.id, { avatar_url: publicUrl }, token);
      setProfile((prev) => (prev ? { ...prev, avatar_url: publicUrl } : prev));
    } catch {
      Alert.alert('Upload failed', 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Permission to access photos is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) doUpload(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Permission to use the camera is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!result.canceled) doUpload(result.assets[0].uri);
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleContactSupport = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  };

  const handleReportBug = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Bug Report — Arriv0')}`);
  };

  const graduationYear = profile?.program_end_date ? profile.program_end_date.slice(0, 4) : null;

  const toggle = (id: string) => setExpandedSection((prev) => (prev === id ? null : id));

  return (
    <Animated.View style={styles.root} entering={FadeIn.duration(220)}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>My Profile</Text>

        {errorMessage && <ErrorState message={errorMessage} onRetry={load} />}

        {!errorMessage && !profile && <SkeletonList count={4} />}

        {!errorMessage && profile && (
          <>
            <View style={styles.identityRow}>
              <Pressable onPress={() => setPickerVisible(true)} disabled={uploading}>
                {profile.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarInitials}>{getInitials(profile.name)}</Text>
                  </View>
                )}
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{profile.name ?? '...'}</Text>
                <Text style={styles.subline}>
                  {[profile.visa_type ? `${profile.visa_type} Student` : 'F1 Student', profile.major, profile.school]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
                {graduationYear ? <Text style={styles.subline}>Expected graduation {graduationYear}</Text> : null}
              </View>
            </View>

            {score && (
              <View style={styles.completenessCard}>
                <View style={styles.completenessHeader}>
                  <Text style={styles.completenessLabel}>Profile Completeness</Text>
                  <Text style={styles.completenessPercent}>{score.percentage}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, score.percentage))}%` }]} />
                </View>
                <Text style={styles.completenessBody}>
                  {score.percentage >= 100 ? "You're all set!" : 'Complete your profile for better recommendations.'}
                </Text>
              </View>
            )}

            <Section
              id="immigration"
              icon={IdentificationCardIcon}
              title="Immigration"
              whyItMatters="Better timeline"
              expanded={expandedSection === 'immigration'}
              onToggle={() => toggle('immigration')}
              actionLabel="Edit"
              onAction={() => router.push('/edit-profile')}
              rows={[
                { label: 'Visa type', value: profile.visa_type },
                { label: 'Program start', value: profile.program_start_date },
                { label: 'Program end', value: profile.program_end_date },
                {
                  label: 'CPT used',
                  value:
                    profile.cpt_months_used !== undefined ? `${profile.cpt_months_used} of 12 months` : undefined,
                },
              ]}
            />

            <Section
              id="academic"
              icon={GraduationCapIcon}
              title="Academic"
              whyItMatters="Better news"
              expanded={expandedSection === 'academic'}
              onToggle={() => toggle('academic')}
              actionLabel="Edit"
              onAction={() => router.push('/edit-profile')}
              rows={[
                { label: 'School', value: profile.school },
                { label: 'Major', value: profile.major },
                { label: 'Year level', value: profile.year_level ? yearLevelNames[profile.year_level] : undefined },
              ]}
            />

            <Section
              id="career"
              icon={BriefcaseIcon}
              title="Career"
              whyItMatters="Better opportunity matches"
              expanded={expandedSection === 'career'}
              onToggle={() => toggle('career')}
              actionLabel="Edit"
              onAction={() => router.push('/edit-profile')}
              rows={[
                {
                  label: 'Career interests',
                  value: profile.career_interests?.length ? profile.career_interests.join(', ') : undefined,
                },
                { label: 'Location preference', value: profile.location_preference },
              ]}
            />

            <Section
              id="preferences"
              icon={SlidersHorizontalIcon}
              title="Preferences"
              expanded={expandedSection === 'preferences'}
              onToggle={() => toggle('preferences')}
              actionLabel="Edit"
              onAction={() => router.push('/notification-settings')}
              rows={[
                { label: 'Push notifications', value: profile.push_token ? 'Enabled' : 'Disabled' },
                { label: 'Daily briefing time', value: profile.notification_time },
              ]}
              footer={
                !profile.push_token ? (
                  <View style={styles.notifBanner}>
                    <WarningCircleIcon size={15} color={Palette.amber} weight="fill" />
                    <Text style={styles.notifBannerText}>
                      Notifications are off. You may miss important immigration updates.
                    </Text>
                    <Pressable onPress={() => Linking.openSettings()} hitSlop={6}>
                      <Text style={styles.notifBannerAction}>Turn on</Text>
                    </Pressable>
                  </View>
                ) : undefined
              }
            />

            <Section
              id="documents"
              icon={FolderSimpleIcon}
              title="Documents"
              expanded={expandedSection === 'documents'}
              onToggle={() => toggle('documents')}
              actionLabel="View"
              onAction={() => router.push('/documents')}
              rows={[
                {
                  label: 'Collected',
                  value: docCounts ? `${docCounts.collected} of ${docCounts.total} collected` : undefined,
                },
              ]}
            />

            <Section
              id="saved"
              icon={BookmarkSimpleIcon}
              title="Saved"
              expanded={expandedSection === 'saved'}
              onToggle={() => toggle('saved')}
              actionLabel="View"
              onAction={() => router.push('/(tabs)/internships')}
              rows={[
                { label: 'Saved opportunities', value: 'In the Opportunities tab', onPress: () => router.push('/(tabs)/internships') },
                { label: 'Saved news', value: 'In the News tab', onPress: () => router.push('/(tabs)/news') },
              ]}
            />

            <Section
              id="account"
              icon={UserCircleIcon}
              title="Account"
              expanded={expandedSection === 'account'}
              onToggle={() => toggle('account')}
              rows={[
                { label: 'Email', value: user?.email },
                { label: 'Password', value: 'Change password', onPress: () => router.push('/reset-password') },
              ]}
              footer={
                <Pressable style={styles.signOutButton} onPress={handleSignOut}>
                  <Text style={styles.signOutText}>Sign out</Text>
                </Pressable>
              }
            />

            <Section
              id="help"
              icon={LifebuoyIcon}
              title="Help & Support"
              expanded={expandedSection === 'help'}
              onToggle={() => toggle('help')}
              rows={[
                { label: 'Support', value: SUPPORT_EMAIL, onPress: handleContactSupport },
                { label: 'Co-founder', value: COFOUNDER_EMAIL, onPress: () => Linking.openURL(`mailto:${COFOUNDER_EMAIL}`) },
              ]}
              footer={
                <>
                  <View style={styles.helpButtonRow}>
                    <Pressable style={styles.helpButton} onPress={handleContactSupport}>
                      <Text style={styles.helpButtonText}>Contact Support</Text>
                    </Pressable>
                    <Pressable style={[styles.helpButton, styles.helpButtonSecondary]} onPress={handleReportBug}>
                      <Text style={[styles.helpButtonText, styles.helpButtonTextSecondary]}>Report a Bug</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.helpFooterText}>We read every message and respond within 24 hours.</Text>
                </>
              }
            />

            <Text style={styles.groupLabel}>More</Text>
            <View style={styles.group}>
              <ActionRow icon={GiftIcon} label="Invite Friends" onPress={() => router.push('/referrals')} />
              <ActionRow
                icon={BellIcon}
                label="Notification Settings"
                onPress={() => router.push('/notification-settings')}
              />
              <ActionRow icon={CloudSlashIcon} label="Offline timeline" onPress={() => router.push('/(tabs)/journey')} />
              <ActionRow icon={ChatCenteredDotsIcon} label="Feedback" onPress={() => router.push('/feedback')} />
              <ActionRow icon={EnvelopeSimpleIcon} label="Contact Us" onPress={() => router.push('/contact-us')} isLast />
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setPickerVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update photo</Text>
            <Pressable
              style={styles.modalOption}
              onPress={() => {
                setPickerVisible(false);
                takePhoto();
              }}>
              <CameraIcon size={18} color={Palette.ink} />
              <Text style={styles.modalOptionText}>Take Photo</Text>
            </Pressable>
            <Pressable
              style={styles.modalOption}
              onPress={() => {
                setPickerVisible(false);
                pickFromLibrary();
              }}>
              <ImageIcon size={18} color={Palette.ink} />
              <Text style={styles.modalOptionText}>Choose from Library</Text>
            </Pressable>
            <Pressable style={styles.modalOption} onPress={() => setPickerVisible(false)}>
              <Text style={[styles.modalOptionText, { color: Palette.danger }]}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </Animated.View>
  );
}

function Section({
  id,
  icon: IconComponent,
  title,
  whyItMatters,
  expanded,
  onToggle,
  actionLabel,
  onAction,
  rows,
  footer,
}: {
  id: string;
  icon: Icon;
  title: string;
  whyItMatters?: string;
  expanded: boolean;
  onToggle: () => void;
  actionLabel?: string;
  onAction?: () => void;
  rows: { label: string; value?: string; onPress?: () => void }[];
  footer?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionWrap}>
      <Pressable style={styles.sectionHeader} onPress={onToggle}>
        <View style={styles.sectionHeaderLeft}>
          <IconComponent size={17} color={Palette.purple} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <View style={styles.sectionHeaderRight}>
          {whyItMatters ? <Text style={styles.whyItMatters}>{whyItMatters}</Text> : null}
          {expanded ? (
            <CaretUpIcon size={15} color={Palette.chevron} />
          ) : (
            <CaretDownIcon size={15} color={Palette.chevron} />
          )}
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.sectionBody}>
          {rows.map((row, index) => (
            <Pressable
              key={row.label}
              style={[styles.row, index < rows.length - 1 && styles.rowDivider]}
              onPress={row.onPress}
              disabled={!row.onPress}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>{row.value ?? 'Not set'}</Text>
                {row.onPress ? <CaretRightIcon size={14} color={Palette.chevron} /> : null}
              </View>
            </Pressable>
          ))}
          {actionLabel && onAction ? (
            <Pressable style={styles.sectionActionButton} onPress={onAction}>
              <Text style={styles.sectionActionText}>{actionLabel}</Text>
            </Pressable>
          ) : null}
          {footer}
        </View>
      )}
    </View>
  );
}

function ActionRow({
  icon: IconComponent,
  label,
  onPress,
  isLast,
}: {
  icon: Icon;
  label: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable style={[styles.row, !isLast && styles.rowDivider]} onPress={onPress}>
      <View style={styles.actionLeft}>
        <IconComponent size={18} color={Palette.purple} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <CaretRightIcon size={15} color={Palette.chevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.white,
  },
  content: {
    paddingTop: 62,
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 108,
  },
  title: {
    fontFamily: Type.headingBold,
    fontSize: 22,
    color: Palette.ink,
    marginBottom: 20,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarInitials: {
    fontFamily: Type.headingBold,
    fontSize: 19,
    color: Palette.purple,
  },
  name: {
    fontFamily: Type.headingSemiBold,
    fontSize: 16.5,
    color: Palette.ink,
  },
  subline: {
    marginTop: 2,
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.inkPlaceholder,
  },
  completenessCard: {
    backgroundColor: Palette.purpleCard,
    borderWidth: 1,
    borderColor: Palette.purpleCardBorder,
    borderRadius: Radius.cardSmall,
    padding: 14,
    marginBottom: Spacing.sectionGap,
  },
  completenessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completenessLabel: {
    fontFamily: Type.bodySemiBold,
    fontSize: 12.5,
    color: Palette.purple,
  },
  completenessPercent: {
    fontFamily: Type.headingSemiBold,
    fontSize: 15,
    color: Palette.purpleDark,
  },
  progressTrack: {
    marginTop: 8,
    height: 7,
    borderRadius: 4,
    backgroundColor: Palette.track,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Palette.purple,
  },
  completenessBody: {
    marginTop: 8,
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.inkBody,
  },
  sectionWrap: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 15,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 15,
    color: Palette.ink,
  },
  whyItMatters: {
    fontFamily: Type.bodyBold,
    fontSize: 12,
    color: Palette.purple,
  },
  sectionBody: {
    paddingHorizontal: 15,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.dividerLight,
  },
  groupLabel: {
    fontFamily: Type.headingSemiBold,
    fontSize: 15,
    color: Palette.ink,
    marginTop: Spacing.cardGap,
    marginBottom: Spacing.cardGap,
  },
  group: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 16,
    paddingHorizontal: 15,
    marginBottom: Spacing.sectionGap,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.dividerLight,
  },
  rowLabel: {
    fontFamily: Type.bodyRegular,
    fontSize: 13.5,
    color: Palette.inkMuted,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '60%',
  },
  rowValue: {
    fontFamily: Type.bodySemiBold,
    fontSize: 13,
    color: Palette.ink,
    textAlign: 'right',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionActionButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: Palette.purple,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  sectionActionText: {
    fontFamily: Type.bodySemiBold,
    fontSize: 12.5,
    color: Palette.white,
  },
  signOutButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Palette.danger,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  signOutText: {
    fontFamily: Type.bodySemiBold,
    fontSize: 12.5,
    color: Palette.danger,
  },
  helpButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  helpButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Palette.purple,
    borderRadius: 10,
    paddingVertical: 9,
  },
  helpButtonSecondary: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.purple,
  },
  helpButtonText: {
    fontFamily: Type.bodySemiBold,
    fontSize: 12.5,
    color: Palette.white,
  },
  helpButtonTextSecondary: {
    color: Palette.purple,
  },
  helpFooterText: {
    marginTop: 10,
    fontFamily: Type.bodyRegular,
    fontSize: 12,
    color: Palette.inkPlaceholder,
    textAlign: 'center',
  },
  notifBanner: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.amberTint,
    borderWidth: 1,
    borderColor: Palette.amberBorder,
    borderRadius: 10,
    padding: 10,
  },
  notifBannerText: {
    flex: 1,
    fontFamily: Type.bodyRegular,
    fontSize: 12,
    lineHeight: 16,
    color: Palette.inkBody,
  },
  notifBannerAction: {
    fontFamily: Type.bodyBold,
    fontSize: 12.5,
    color: Palette.purple,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Palette.scrim,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Palette.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
  },
  modalTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
    color: Palette.inkMuted,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Palette.dividerLight,
  },
  modalOptionText: {
    fontFamily: Type.bodyRegular,
    fontSize: 16,
    color: Palette.ink,
  },
});

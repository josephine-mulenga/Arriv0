import { useCallback, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import {
  PencilSimpleIcon,
  CaretRightIcon,
  FolderSimpleIcon,
  BellIcon,
  CloudSlashIcon,
  ClipboardTextIcon,
  CameraIcon,
  ImageIcon,
} from 'phosphor-react-native';

import { getUserProfile, uploadAvatar, updateProfile } from '@/api';
import { useAuth } from '@/AuthContext';
import { Palette, Spacing, Type } from '@/constants/theme';

interface ProfileData {
  name?: string;
  school?: string;
  visa_type?: string;
  year_level?: number;
  program_end_date?: string;
  avatar_url?: string;
}

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
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!token || !user) return;
      getUserProfile(user.id, token).then(setProfile).catch(() => {});
    }, [token, user])
  );

  const doUpload = async (imageUri: string) => {
    if (!user || !token) return;
    setUploading(true);
    try {
      const publicUrl = await uploadAvatar(user.id, imageUri);
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

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>My Profile</Text>

        <View style={styles.identityRow}>
          <Pressable onPress={() => setPickerVisible(true)} disabled={uploading}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarInitials}>{getInitials(profile?.name)}</Text>
              </View>
            )}
          </Pressable>
          <View>
            <Text style={styles.name}>{profile?.name ?? '...'}</Text>
            <Text style={styles.email}>{user?.email ?? ''}</Text>
          </View>
        </View>

        <Text style={styles.groupLabel}>My Information</Text>
        <View style={styles.group}>
          <InfoRow label="School" value={profile?.school} />
          <InfoRow label="Visa Type" value={profile?.visa_type} />
          <InfoRow
            label="Year Level"
            value={profile?.year_level ? yearLevelNames[profile.year_level] : undefined}
          />
          <InfoRow label="Program End Date" value={profile?.program_end_date} isLast />
        </View>

        <Text style={styles.groupLabel}>Account</Text>
        <View style={styles.group}>
          <ActionRow icon={PencilSimpleIcon} label="Edit Profile" onPress={() => router.push('/edit-profile')} />
          <ActionRow
            icon={ClipboardTextIcon}
            label="Complete Your Profile"
            onPress={() => router.push('/complete-profile')}
          />
          <ActionRow icon={FolderSimpleIcon} label="Documents" onPress={() => router.push('/documents')} />
          <ActionRow
            icon={BellIcon}
            label="Notification Settings"
            onPress={() => router.push('/notification-settings')}
          />
          <ActionRow
            icon={CloudSlashIcon}
            label="Offline timeline"
            onPress={() => router.push('/(tabs)/timeline')}
            isLast
          />
        </View>
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
    </View>
  );
}

function InfoRow({ label, value, isLast }: { label: string; value?: string; isLast?: boolean }) {
  return (
    <Pressable
      style={[styles.row, !isLast && styles.rowDivider]}
      onPress={() => router.push('/edit-profile')}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        <Text style={styles.rowValue}>{value ?? '—'}</Text>
        <CaretRightIcon size={15} color={Palette.chevron} />
      </View>
    </Pressable>
  );
}

function ActionRow({
  icon: IconComponent,
  label,
  onPress,
  isLast,
}: {
  icon: typeof PencilSimpleIcon;
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
    marginBottom: Spacing.sectionGap,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Palette.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarInitials: {
    fontFamily: Type.headingBold,
    fontSize: 18,
    color: Palette.purple,
  },
  name: {
    fontFamily: Type.headingSemiBold,
    fontSize: 16,
    color: Palette.ink,
  },
  email: {
    marginTop: 2,
    fontFamily: Type.bodyRegular,
    fontSize: 13,
    color: Palette.inkPlaceholder,
  },
  groupLabel: {
    fontFamily: Type.headingSemiBold,
    fontSize: 15,
    color: Palette.ink,
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
    paddingVertical: 14,
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
  },
  rowValue: {
    fontFamily: Type.bodySemiBold,
    fontSize: 14,
    color: Palette.ink,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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

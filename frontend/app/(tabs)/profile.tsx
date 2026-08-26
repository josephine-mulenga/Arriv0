import { StyleSheet, TouchableOpacity, View, Image, Alert, Modal } from 'react-native';
import { useState, useCallback } from 'react';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { getUserProfile, uploadAvatar, updateProfile } from '@/api';
import { useAuth } from '@/AuthContext';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientHeaderBackground } from '@/components/gradient-header-background';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Avatar({ name, avatarUrl, uploading, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={uploading} style={styles.avatarTouchable}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatar}>
          <ThemedText style={styles.avatarText}>{getInitials(name)}</ThemedText>
        </View>
      )}
      <View style={styles.editBadge}>
        <ThemedText style={styles.editBadgeText}>{uploading ? '...' : '✏️'}</ThemedText>
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        try {
          const data = await getUserProfile(user.id, token);
          setProfileData(data);
        } catch (err) {
          console.log('Error fetching profile:', err.message);
        }
      };

      if (token && user) {
        fetchProfile();
      }
    }, [token, user])
  );

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const doUpload = async (imageUri) => {
    setUploading(true);
    try {
      const publicUrl = await uploadAvatar(user.id, imageUri);
      await updateProfile(user.id, { avatar_url: publicUrl }, token);
      setProfileData((prev) => (prev ? { ...prev, avatar_url: publicUrl } : prev));
    } catch (err) {
      console.log('Error uploading avatar:', err.message);
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
    if (!result.canceled) {
      doUpload(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Permission to use the camera is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      doUpload(result.assets[0].uri);
    }
  };

  const handleAvatarPress = () => {
    setPickerVisible(true);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#C7D9FF', dark: '#2A2450' }}
      headerImage={<GradientHeaderBackground logoSize={50} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText style={styles.screenTitle}>My Profile</ThemedText>
      </ThemedView>

      {profileData ? (
        <>
          <ThemedView style={styles.avatarSection}>
            <Avatar
              name={profileData.name}
              avatarUrl={profileData.avatar_url}
              uploading={uploading}
              onPress={handleAvatarPress}
            />
            <ThemedText style={styles.avatarName}>{profileData.name}</ThemedText>
          </ThemedView>

          <ThemedView style={styles.infoCard}>
            <ThemedView style={styles.row}>
              <ThemedText style={styles.label}>Name</ThemedText>
              <ThemedText>{profileData.name}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.row}>
              <ThemedText style={styles.label}>School</ThemedText>
              <ThemedText>{profileData.school}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.row}>
              <ThemedText style={styles.label}>Visa Type</ThemedText>
              <ThemedText>{profileData.visa_type}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.row}>
              <ThemedText style={styles.label}>Program Start</ThemedText>
              <ThemedText>{profileData.program_start_date}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.row}>
              <ThemedText style={styles.label}>Program End</ThemedText>
              <ThemedText>{profileData.program_end_date}</ThemedText>
            </ThemedView>
          </ThemedView>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push('/edit-profile')}>
            <ThemedText style={styles.editButtonText}>✏️ Edit Profile</ThemedText>
          </TouchableOpacity>
        </>
      ) : (
        <ThemedText style={{ paddingHorizontal: 16 }}>Loading...</ThemedText>
      )}

      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => router.push('/documents')}>
        <ThemedText style={styles.settingsButtonText}>📄 Documents</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => router.push('/dso-directory')}>
        <ThemedText style={styles.settingsButtonText}>🏫 DSO Directory</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => router.push('/notification-settings')}>
        <ThemedText style={styles.settingsButtonText}>⚙️ Notification Settings</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <ThemedText style={styles.logoutButtonText}>Log Out</ThemedText>
      </TouchableOpacity>

      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Update photo</ThemedText>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setPickerVisible(false);
                takePhoto();
              }}>
              <ThemedText style={styles.modalOptionText}>📷 Take Photo</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setPickerVisible(false);
                pickFromLibrary();
              }}>
              <ThemedText style={styles.modalOptionText}>🖼️ Choose from Library</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption} onPress={() => setPickerVisible(false)}>
              <ThemedText style={[styles.modalOptionText, { color: '#D32F2F' }]}>Cancel</ThemedText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  screenTitle: {
    fontSize: 26,
    fontFamily: 'Fredoka_700Bold',
    color: '#1A1A2E',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  avatarTouchable: {
    marginBottom: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarText: {
    color: '#FFFFFF',
    fontFamily: 'Fredoka_700Bold',
    fontSize: 24,
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0DDF5',
  },
  editBadgeText: {
    fontSize: 12,
  },
  avatarName: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 16,
    color: '#1A1A2E',
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F0EEFF',
    borderRadius: 20,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  label: {
    fontFamily: 'Fredoka_600SemiBold',
    color: '#6C63FF',
  },
  editButton: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F0EEFF',
    alignItems: 'center',
  },
  editButtonText: {
    color: '#6C63FF',
    fontFamily: 'Fredoka_600SemiBold',
  },
  settingsButton: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F0EEFF',
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#6C63FF',
    fontFamily: 'Fredoka_600SemiBold',
  },
  logoutButton: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#D32F2F',
    fontFamily: 'Fredoka_600SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
  },
  modalTitle: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
    color: '#888',
  },
  modalOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEFF',
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1A1A2E',
  },
});
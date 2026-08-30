import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { FolderOpenIcon, FolderSimpleIcon, CaretLeftIcon } from 'phosphor-react-native';

import { getDocuments, updateDocument } from '@/api';
import { useAuth } from '@/AuthContext';
import { IconTile } from '@/components/ui/icon-tile';
import { StatusBadge } from '@/components/ui/status-badge';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Palette, Spacing, Type } from '@/constants/theme';

const CATEGORY_ORDER = ['Identity', 'Immigration', 'School', 'Health', 'Financial', 'Work Authorization'];

interface Doc {
  id: string;
  name: string;
  category?: string;
  description?: string;
  collected: boolean;
}

export default function DocumentsScreen() {
  const { token } = useAuth();
  const [documents, setDocuments] = useState<Doc[] | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      const data = await getDocuments(token);
      setDocuments(Array.isArray(data) ? data : data.documents || []);
    } catch {
      // keep whatever was last loaded
    }
  };

  useEffect(() => {
    if (token) fetchDocuments();
  }, [token]);

  const handleToggle = async (doc: Doc) => {
    if (!documents) return;
    setUpdatingId(doc.id);
    try {
      await updateDocument(doc.id, !doc.collected, '', token);
      setDocuments((prev) =>
        (prev ?? []).map((d) => (d.id === doc.id ? { ...d, collected: !d.collected } : d))
      );
    } catch {
      // leave state as-is; user can retry the toggle
    } finally {
      setUpdatingId(null);
    }
  };

  const grouped: Record<string, Doc[]> = {};
  (documents ?? []).forEach((doc) => {
    const category = doc.category || 'Other';
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(doc);
  });
  const orderedCategories = [
    ...CATEGORY_ORDER.filter((c) => grouped[c]),
    ...Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  const validCount = (documents ?? []).filter((d) => d.collected).length;
  const missingCount = (documents ?? []).filter((d) => !d.collected).length;

  if (documents && documents.length === 0) {
    return (
      <View style={styles.root}>
        <ScreenHeader />
        <View style={styles.emptyState}>
          <FolderOpenIcon size={44} color="#CFC9F5" />
          <Text style={styles.emptyTitle}>Nothing tracked yet</Text>
          <Text style={styles.emptyBody}>
            Add the documents your status depends on and Arriv0 will warn you before any of them
            expire.
          </Text>
          <PrimaryButton
            label="Add my documents"
            onPress={() => router.push('/chat')}
            style={styles.emptyButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          {documents ? `${validCount} valid · ${missingCount} missing for OPT` : 'Loading...'}
        </Text>

        {orderedCategories.map((category) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {grouped[category].map((doc) => (
              <Pressable
                key={doc.id}
                style={styles.docRow}
                onPress={() => handleToggle(doc)}
                disabled={updatingId === doc.id}>
                <IconTile
                  icon={FolderSimpleIcon}
                  size={40}
                  iconSize={18}
                  tint={doc.collected ? Palette.greenTint : Palette.redTint}
                  color={doc.collected ? Palette.green : Palette.red}
                />
                <View style={styles.docTextWrap}>
                  <Text style={styles.docName}>{doc.name}</Text>
                  {doc.description ? <Text style={styles.docDescription}>{doc.description}</Text> : null}
                </View>
                <StatusBadge
                  label={doc.collected ? 'Valid' : 'Missing'}
                  color={doc.collected ? Palette.green : Palette.red}
                  tint={doc.collected ? Palette.greenTint : Palette.redTint}
                />
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function ScreenHeader() {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} hitSlop={8}>
        <CaretLeftIcon size={20} color={Palette.ink} weight="bold" />
      </Pressable>
      <Text style={styles.title}>Documents</Text>
      <View style={{ width: 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 62,
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 16,
  },
  title: {
    fontFamily: Type.headingBold,
    fontSize: 22,
    color: Palette.ink,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 108,
  },
  subtitle: {
    fontFamily: Type.bodyRegular,
    fontSize: 13,
    color: Palette.inkFaint,
    marginBottom: Spacing.sectionGap,
  },
  categorySection: {
    marginBottom: Spacing.sectionGap,
  },
  categoryTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 15,
    color: Palette.ink,
    marginBottom: Spacing.cardGap,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  docTextWrap: {
    flex: 1,
  },
  docName: {
    fontFamily: Type.headingSemiBold,
    fontSize: 14,
    color: Palette.ink,
  },
  docDescription: {
    marginTop: 2,
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.inkFaint,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 18,
    color: Palette.ink,
    marginTop: 8,
  },
  emptyBody: {
    textAlign: 'center',
    fontFamily: Type.bodyRegular,
    fontSize: 13.5,
    lineHeight: 21,
    color: Palette.inkMuted,
  },
  emptyButton: {
    marginTop: 12,
    minWidth: 200,
  },
});

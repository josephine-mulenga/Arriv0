import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useEffect, useState } from 'react';
import { getDocuments, updateDocument } from '@/api';
import { useAuth } from '@/AuthContext';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GradientHeaderBackground } from '@/components/gradient-header-background';

const CATEGORY_ORDER = ['Identity', 'Immigration', 'School', 'Health', 'Financial', 'Work Authorization'];

export default function DocumentsScreen() {
  const { token } = useAuth();
  const [documents, setDocuments] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchDocuments = async () => {
    try {
      const data = await getDocuments(token);
      setDocuments(Array.isArray(data) ? data : data.documents || []);
    } catch (err) {
      console.log('Error fetching documents:', err.message);
    }
  };

  useEffect(() => {
    if (token) fetchDocuments();
  }, [token]);

  const handleToggle = async (doc) => {
    setUpdatingId(doc.id);
    try {
      await updateDocument(doc.id, !doc.collected, doc.notes || '', token);
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, collected: !d.collected } : d))
      );
    } catch (err) {
      console.log('Error updating document:', err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const grouped = documents
    ? documents.reduce((acc, doc) => {
        const category = doc.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(doc);
        return acc;
      }, {})
    : {};

  const orderedCategories = [
    ...CATEGORY_ORDER.filter((c) => grouped[c]),
    ...Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  const totalCount = documents ? documents.length : 0;
  const collectedCount = documents ? documents.filter((d) => d.collected).length : 0;

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#C7D9FF', dark: '#2A2450' }}
      headerImage={<GradientHeaderBackground logoSize={50} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText style={styles.screenTitle}>Documents</ThemedText>
      </ThemedView>

      {documents ? (
        <>
          <ThemedView style={styles.progressSummary}>
            <ThemedText style={styles.progressText}>
              {collectedCount} of {totalCount} collected
            </ThemedText>
          </ThemedView>

          {orderedCategories.map((category) => (
            <ThemedView key={category} style={styles.categorySection}>
              <ThemedText style={styles.categoryTitle}>{category}</ThemedText>

              {grouped[category].map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  style={styles.docRow}
                  onPress={() => handleToggle(doc)}
                  disabled={updatingId === doc.id}>
                  <View style={[styles.checkbox, doc.collected && styles.checkboxChecked]}>
                    {doc.collected && <ThemedText style={styles.checkMark}>✓</ThemedText>}
                  </View>
                  <ThemedView style={styles.docTextWrap}>
                    <ThemedText style={doc.collected ? styles.docNameDone : styles.docName}>
                      {doc.name}
                    </ThemedText>
                    {doc.description && (
                      <ThemedText style={styles.docDescription}>{doc.description}</ThemedText>
                    )}
                  </ThemedView>
                </TouchableOpacity>
              ))}
            </ThemedView>
          ))}
        </>
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
  progressSummary: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F0EEFF',
    borderRadius: 20,
    alignItems: 'center',
  },
  progressText: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 16,
  },
  categorySection: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F5F5F7',
    borderRadius: 20,
    gap: 4,
  },
  categoryTitle: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 16,
    color: '#6C63FF',
    marginBottom: 8,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6C63FF',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#6C63FF',
  },
  checkMark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  docTextWrap: {
    flex: 1,
    gap: 2,
    backgroundColor: 'transparent',
  },
  docName: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 15,
    color: '#1A1A2E',
  },
  docNameDone: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 15,
    color: '#4CAF50',
    textDecorationLine: 'line-through',
  },
  docDescription: {
    fontSize: 13,
    color: '#888',
  },
});
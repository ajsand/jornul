import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Appbar, Text, Chip, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { format } from 'date-fns';
import { JournalItem, db } from '@/lib/storage/db';
import { theme } from '@/lib/theme';

export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<JournalItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    try {
      if (!id) return;
      
      try {
        await db.init();
        const journalItem = await db.getItem(id);
        setItem(journalItem);
      } catch (dbError) {
        console.warn('Database query failed, checking store:', dbError);
        // Fallback to checking the store
        const { items } = useJournalStore.getState();
        const storeItem = items.find(item => item.id === id);
        setItem(storeItem || null);
      }
    } catch (error) {
      console.error('Failed to load item:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Loading..." titleStyle={styles.headerTitle} />
        </Appbar.Header>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Not Found" titleStyle={styles.headerTitle} />
        </Appbar.Header>
        <View style={styles.errorContainer}>
          <Text variant="headlineSmall" style={styles.errorTitle}>
            Journal Entry Not Found
          </Text>
          <Text style={styles.errorText}>
            This journal entry may have been deleted or moved.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Journal Entry" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.metaInfo}>
              <Text variant="titleMedium" style={styles.date}>
                {format(new Date(item.created_at), 'EEEE, MMMM d, yyyy')}
              </Text>
              <Text style={styles.time}>
                {format(new Date(item.created_at), 'h:mm a')}
              </Text>
            </View>

            <View style={styles.contentSection}>
              <Text variant="bodyLarge" style={styles.text}>
                {item.clean_text}
              </Text>
            </View>

            {item.tags.length > 0 && (
              <View style={styles.tagsSection}>
                <Text variant="titleSmall" style={styles.tagsTitle}>
                  Tags
                </Text>
                <View style={styles.tagsContainer}>
                  {item.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      style={styles.tag}
                      textStyle={styles.tagText}
                      compact
                    >
                      {tag}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.infoSection}>
              <Text variant="bodySmall" style={styles.infoText}>
                Type: {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </Text>
              {item.embedding && (
                <Text variant="bodySmall" style={styles.infoText}>
                  AI embedding: Generated ({item.embedding.length} dimensions)
                </Text>
              )}
              <Text variant="bodySmall" style={styles.infoText}>
                Word count: {item.clean_text.split(/\s+/).length}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surface,
  },
  headerTitle: {
    color: theme.colors.onSurface,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: theme.colors.surface,
  },
  metaInfo: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  date: {
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  time: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  contentSection: {
    marginBottom: 24,
  },
  text: {
    color: theme.colors.onSurface,
    lineHeight: 24,
  },
  tagsSection: {
    marginBottom: 24,
  },
  tagsTitle: {
    color: theme.colors.onSurface,
    marginBottom: 8,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: theme.colors.primaryContainer,
  },
  tagText: {
    color: theme.colors.onPrimaryContainer,
  },
  infoSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    paddingTop: 16,
  },
  infoText: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorText: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
  },
});
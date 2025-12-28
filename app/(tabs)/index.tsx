import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Appbar, Text, Chip, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { JournalList } from '@/components/JournalList';
import { useJournalStore } from '@/lib/store';
import { db } from '@/lib/storage/db';
import { theme } from '@/lib/theme';

export default function HomeScreen() {
  const { items, selectedTags, setItems, setSelectedTags, filteredItems } = useJournalStore();
  const [allTags, setAllTags] = useState<{ tag: string; count: number }[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await db.init();
      const journalItems = await db.queryAllItems();
      const tags = await db.getAllTags();
      setItems(journalItems);
      setAllTags(tags);
    } catch (error) {
      console.error('Failed to load data:', error);
      // Add some sample data if database fails
      const sampleItems = [
        {
          id: 'sample-1',
          type: 'text' as const,
          clean_text: 'Welcome to JournalLink! This is your first sample entry.',
          tags: ['welcome', 'sample'],
          created_at: Date.now() - 86400000, // 1 day ago
        }
      ];
      setItems(sampleItems);
    }
  };

  const handleTagPress = (tag: string) => {
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newSelectedTags);
  };

  const clearFilters = () => {
    setSelectedTags([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Journal" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      {allTags.length > 0 && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filtersContent}>
              {selectedTags.length > 0 && (
                <Chip
                  onPress={clearFilters}
                  style={styles.clearChip}
                  textStyle={styles.clearChipText}
                  icon="close"
                  compact
                >
                  Clear
                </Chip>
              )}
              {allTags.map(({ tag, count }) => (
                <Chip
                  key={tag}
                  onPress={() => handleTagPress(tag)}
                  style={[
                    styles.filterChip,
                    selectedTags.includes(tag) && styles.selectedFilterChip
                  ]}
                  textStyle={[
                    styles.filterChipText,
                    selectedTags.includes(tag) && styles.selectedFilterChipText
                  ]}
                  compact
                >
                  {tag} ({count})
                </Chip>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      <View style={styles.content}>
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              Start Your Journal
            </Text>
            <Text style={styles.emptyText}>
              Create your first entry to begin capturing your thoughts and experiences.
            </Text>
          </View>
        ) : (
          <JournalList
            items={filteredItems()}
            selectedTags={selectedTags}
            onTagPress={handleTagPress}
          />
        )}
      </View>

      <FAB
        icon={() => <Plus size={24} color={theme.colors.onPrimary} />}
        style={styles.fab}
        onPress={() => router.push('/(tabs)/scratch')}
      />
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
  filtersContainer: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  filtersContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  clearChip: {
    backgroundColor: theme.colors.error,
  },
  clearChipText: {
    color: theme.colors.onError,
  },
  filterChip: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  selectedFilterChip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  filterChipText: {
    color: theme.colors.onSurfaceVariant,
  },
  selectedFilterChipText: {
    color: theme.colors.onPrimaryContainer,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: theme.colors.primary,
  },
});
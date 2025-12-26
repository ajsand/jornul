import React from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { format } from 'date-fns';
import { router } from 'expo-router';
import { JournalItem } from '@/lib/storage/db';
import { theme } from '@/lib/theme';

interface JournalListProps {
  items: JournalItem[];
  selectedTags: string[];
  onTagPress: (tag: string) => void;
}

export function JournalList({ items, selectedTags, onTagPress }: JournalListProps) {
  const renderItem = ({ item }: { item: JournalItem }) => (
    <TouchableOpacity
      onPress={() => router.push(`/item/${item.id}`)}
      activeOpacity={0.7}
    >
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="titleMedium" style={styles.title}>
              {item.clean_text.slice(0, 50)}
              {item.clean_text.length > 50 ? '...' : ''}
            </Text>
            <Text style={styles.date}>
              {format(new Date(item.created_at), 'MMM d, yyyy')}
            </Text>
          </View>
          
          <Text style={styles.content} numberOfLines={3}>
            {item.clean_text}
          </Text>
          
          {item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => onTagPress(tag)}
                  activeOpacity={0.7}
                >
                  <Chip
                    style={[
                      styles.tag,
                      selectedTags.includes(tag) && styles.selectedTag
                    ]}
                    textStyle={[
                      styles.tagText,
                      selectedTags.includes(tag) && styles.selectedTagText
                    ]}
                    compact
                  >
                    {tag}
                  </Chip>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    color: theme.colors.onSurface,
    flex: 1,
    marginRight: 8,
    fontWeight: '500',
  },
  date: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  content: {
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: theme.colors.surfaceVariant,
    height: 28,
  },
  selectedTag: {
    backgroundColor: theme.colors.primaryContainer,
  },
  tagText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
  },
  selectedTagText: {
    color: theme.colors.onPrimaryContainer,
  },
});
import React from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { MediaItem } from '@/lib/storage/types';
import { TypeIcon } from './TypeIcon';
import { getMediaTitle, getMediaPreview, formatMediaDate } from '@/lib/utils/mediaHelpers';
import { theme } from '@/lib/theme';

interface MediaItemListProps {
  items: MediaItem[];
  onItemPress: (id: string) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function MediaItemList({ 
  items, 
  onItemPress, 
  refreshing = false,
  onRefresh 
}: MediaItemListProps) {
  const renderItem = ({ item }: { item: MediaItem }) => {
    const title = getMediaTitle(item);
    const preview = getMediaPreview(item);
    const dateText = formatMediaDate(item.created_at);

    return (
      <TouchableOpacity
        onPress={() => onItemPress(item.id)}
        activeOpacity={0.7}
      >
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <TypeIcon 
                type={item.type} 
                size={24} 
                color={theme.colors.primary} 
              />
            </View>
            
            <View style={styles.contentContainer}>
              <View style={styles.headerRow}>
                <Text 
                  variant="titleMedium" 
                  style={styles.title}
                  numberOfLines={1}
                >
                  {title}
                </Text>
                <Text style={styles.date}>{dateText}</Text>
              </View>
              
              {preview && (
                <Text 
                  style={styles.preview} 
                  numberOfLines={2}
                >
                  {preview}
                </Text>
              )}
              
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  if (items.length === 0) {
    return null; // Parent handles empty state
  }

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
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
    marginTop: 2,
  },
  preview: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
    textTransform: 'capitalize',
  },
});





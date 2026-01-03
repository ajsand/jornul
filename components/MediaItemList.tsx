import React from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { MediaItem } from '@/lib/storage/types';
import { TypeIcon } from './TypeIcon';
import { getMediaTitle, getMediaPreview, formatMediaDate } from '@/lib/utils/mediaHelpers';
import { theme } from '@/lib/theme';

type ViewMode = 'list' | 'grid';

interface MediaItemListProps {
  items: MediaItem[];
  onItemPress: (id: string) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  viewMode?: ViewMode;
}

const GRID_COLUMNS = 2;
const GRID_SPACING = 8;
const SCREEN_PADDING = 16;

export function MediaItemList({
  items,
  onItemPress,
  refreshing = false,
  onRefresh,
  viewMode = 'list',
}: MediaItemListProps) {
  const screenWidth = Dimensions.get('window').width;
  const gridItemWidth = (screenWidth - SCREEN_PADDING * 2 - GRID_SPACING * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

  const renderListItem = ({ item }: { item: MediaItem }) => {
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

  const renderGridItem = ({ item, index }: { item: MediaItem; index: number }) => {
    const title = getMediaTitle(item);
    const dateText = formatMediaDate(item.created_at);
    const isRightColumn = index % GRID_COLUMNS === 1;

    return (
      <TouchableOpacity
        onPress={() => onItemPress(item.id)}
        activeOpacity={0.7}
        style={[
          styles.gridItemWrapper,
          { width: gridItemWidth },
          isRightColumn && styles.gridItemRight,
        ]}
      >
        <Card style={styles.gridCard}>
          <Card.Content style={styles.gridCardContent}>
            <View style={styles.gridIconContainer}>
              <TypeIcon
                type={item.type}
                size={32}
                color={theme.colors.primary}
              />
            </View>
            <Text
              variant="titleSmall"
              style={styles.gridTitle}
              numberOfLines={2}
            >
              {title}
            </Text>
            <Text style={styles.gridMeta}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Text>
            <Text style={styles.gridDate}>{dateText}</Text>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  if (items.length === 0) {
    return null; // Parent handles empty state
  }

  if (viewMode === 'grid') {
    return (
      <FlatList
        data={items}
        renderItem={renderGridItem}
        keyExtractor={(item) => item.id}
        numColumns={GRID_COLUMNS}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    );
  }

  return (
    <FlatList
      data={items}
      renderItem={renderListItem}
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
  // Grid styles
  gridContainer: {
    padding: SCREEN_PADDING,
    paddingBottom: 32,
  },
  gridItemWrapper: {
    marginBottom: GRID_SPACING,
  },
  gridItemRight: {
    marginLeft: GRID_SPACING,
  },
  gridCard: {
    backgroundColor: theme.colors.surface,
    height: 140,
  },
  gridCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    height: '100%',
  },
  gridIconContainer: {
    marginBottom: 8,
  },
  gridTitle: {
    color: theme.colors.onSurface,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 4,
  },
  gridMeta: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
    textTransform: 'capitalize',
  },
  gridDate: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 10,
    marginTop: 2,
  },
});







import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Appbar, Text, Searchbar, Menu, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowUpDown } from 'lucide-react-native';
import { MediaItemList } from '@/components/MediaItemList';
import { MediaItem } from '@/lib/storage/types';
import { db } from '@/lib/storage/db';
import { theme } from '@/lib/theme';

type SortOrder = 'newest' | 'oldest';

export default function LibraryScreen() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    initializeDatabase();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadItems();
    }
  }, [loading, loadItems]);

  const loadItems = useCallback(async () => {
    try {
      const result = await db.listMediaItems({
        searchText: searchQuery || undefined,
        orderBy: 'created_at',
        orderDirection: sortOrder === 'newest' ? 'DESC' : 'ASC',
      });
      setItems(result);
    } catch (error) {
      console.error('Failed to load items:', error);
      setItems([]);
    }
  }, [searchQuery, sortOrder]);

  const initializeDatabase = async () => {
    try {
      await db.init();
      await loadItems();
    } catch (error) {
      console.error('Failed to initialize database:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const handleItemPress = (id: string) => {
    router.push(`/item/${id}`);
  };

  const handleSortChange = (order: SortOrder) => {
    setSortOrder(order);
    setMenuVisible(false);
  };

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.Content title="Library" titleStyle={styles.headerTitle} />
        </Appbar.Header>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Library" titleStyle={styles.headerTitle} />
        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={
            <IconButton
              icon={() => <ArrowUpDown size={24} color={theme.colors.onSurface} />}
              onPress={openMenu}
            />
          }
        >
          <Menu.Item
            onPress={() => handleSortChange('newest')}
            title="Newest First"
            leadingIcon={sortOrder === 'newest' ? 'check' : undefined}
          />
          <Menu.Item
            onPress={() => handleSortChange('oldest')}
            title="Oldest First"
            leadingIcon={sortOrder === 'oldest' ? 'check' : undefined}
          />
        </Menu>
      </Appbar.Header>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search items..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          {searchQuery ? (
            <>
              <Text variant="headlineSmall" style={styles.emptyTitle}>
                No results found
              </Text>
              <Text style={styles.emptyText}>
                No items match "{searchQuery}"
              </Text>
              <IconButton
                icon="close"
                mode="contained"
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              />
            </>
          ) : (
            <>
              <Text variant="headlineSmall" style={styles.emptyTitle}>
                Your Library is Empty
              </Text>
              <Text style={styles.emptyText}>
                Start adding content to see it here.{'\n'}
                Tap the + tab to create your first item.
              </Text>
            </>
          )}
        </View>
      ) : (
        <MediaItemList
          items={items}
          onItemPress={handleItemPress}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  searchBar: {
    backgroundColor: theme.colors.surfaceVariant,
    elevation: 0,
  },
  searchInput: {
    color: theme.colors.onSurface,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyText: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
  },
  clearButton: {
    marginTop: 16,
  },
});


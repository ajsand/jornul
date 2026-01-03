import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Appbar, Text, Searchbar, Menu, IconButton, Chip, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  ArrowUpDown,
  List,
  LayoutGrid,
  Filter,
  X,
  Calendar,
  Globe,
  Tag,
} from 'lucide-react-native';
import { MediaItemList } from '@/components/MediaItemList';
import { MediaItem, MediaType, TagWithCount } from '@/lib/storage/types';
import { db } from '@/lib/storage/db';
import * as repos from '@/lib/storage/repositories';
import { theme } from '@/lib/theme';

type SortOrder = 'newest' | 'oldest';
type ViewMode = 'list' | 'grid';

const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  text: 'Notes',
  url: 'Links',
  image: 'Images',
  audio: 'Audio',
  video: 'Video',
  pdf: 'PDFs',
};

export default function LibraryScreen() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState<MediaType | null>(null);
  const [sourceDomainFilter, setSourceDomainFilter] = useState<string | null>(null);
  const [dateRangeFilter, setDateRangeFilter] = useState<'today' | 'week' | 'month' | null>(null);

  // Available filter options
  const [availableTypes, setAvailableTypes] = useState<MediaType[]>([]);
  const [availableDomains, setAvailableDomains] = useState<string[]>([]);

  // Tag facets for search results
  const [tagFacets, setTagFacets] = useState<TagWithCount[]>([]);
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([]);

  const hasActiveFilters = typeFilter || sourceDomainFilter || dateRangeFilter || selectedTagFilters.length > 0;

  const getDateRange = useCallback((range: 'today' | 'week' | 'month' | null): { dateFrom?: number; dateTo?: number } => {
    if (!range) return {};

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    switch (range) {
      case 'today':
        return { dateFrom: now - day, dateTo: now };
      case 'week':
        return { dateFrom: now - 7 * day, dateTo: now };
      case 'month':
        return { dateFrom: now - 30 * day, dateTo: now };
      default:
        return {};
    }
  }, []);

  const loadItems = useCallback(async () => {
    try {
      const rawDb = db.getRawDb();
      const dateRange = getDateRange(dateRangeFilter);

      // Use FTS search when there's a search query
      if (searchQuery.trim()) {
        const ftsResults = await repos.searchMediaItems(rawDb, searchQuery, {
          type: typeFilter || undefined,
          sourceDomain: sourceDomainFilter || undefined,
          dateFrom: dateRange.dateFrom,
          dateTo: dateRange.dateTo,
        });

        // Apply tag filters if any
        let filteredResults = ftsResults;
        if (selectedTagFilters.length > 0) {
          // Get items that have all selected tags
          const itemsWithTags = await Promise.all(
            ftsResults.map(async (item) => {
              const itemTags = await repos.getTagsForItem(rawDb, item.id);
              const tagNames = itemTags.map(t => t.name);
              const hasAllTags = selectedTagFilters.every(tag => tagNames.includes(tag));
              return hasAllTags ? item : null;
            })
          );
          filteredResults = itemsWithTags.filter((item): item is MediaItem => item !== null);
        }

        setItems(filteredResults);

        // Get tag facets for search results
        const facets = await repos.getSearchTagFacets(rawDb, searchQuery, 8);
        setTagFacets(facets);
      } else {
        // No search query - use regular listing
        const result = await repos.listMediaItems(rawDb, {
          type: typeFilter || undefined,
          sourceDomain: sourceDomainFilter || undefined,
          dateFrom: dateRange.dateFrom,
          dateTo: dateRange.dateTo,
          tags: selectedTagFilters.length > 0 ? selectedTagFilters : undefined,
          orderBy: 'created_at',
          orderDirection: sortOrder === 'newest' ? 'DESC' : 'ASC',
        });
        setItems(result);
        setTagFacets([]); // Clear facets when not searching
      }
    } catch (error) {
      console.error('Failed to load items:', error);
      setItems([]);
      setTagFacets([]);
    }
  }, [searchQuery, sortOrder, typeFilter, sourceDomainFilter, dateRangeFilter, selectedTagFilters, getDateRange]);

  const loadFilterOptions = useCallback(async () => {
    try {
      const rawDb = db.getRawDb();
      const types = await repos.getUniqueMediaTypes(rawDb);
      const domains = await repos.getUniqueSourceDomains(rawDb);
      setAvailableTypes(types as MediaType[]);
      setAvailableDomains(domains);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  }, []);

  useEffect(() => {
    initializeDatabase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        loadItems();
        loadFilterOptions();
      }
    }, [loading, loadItems, loadFilterOptions])
  );

  useEffect(() => {
    if (!loading) {
      loadItems();
    }
  }, [loading, loadItems]);

  const initializeDatabase = async () => {
    try {
      await db.init();
      await loadFilterOptions();
      await loadItems();
    } catch (error) {
      console.error('Failed to initialize database:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFilterOptions();
    await loadItems();
    setRefreshing(false);
  };

  const handleItemPress = (id: string) => {
    router.push(`/item/${id}`);
  };

  const handleSortChange = (order: SortOrder) => {
    setSortOrder(order);
    setSortMenuVisible(false);
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'list' ? 'grid' : 'list');
  };

  const clearFilters = () => {
    setTypeFilter(null);
    setSourceDomainFilter(null);
    setDateRangeFilter(null);
    setSelectedTagFilters([]);
  };

  const toggleTagFilter = (tagName: string) => {
    setSelectedTagFilters(prev =>
      prev.includes(tagName)
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  const openSortMenu = () => setSortMenuVisible(true);
  const closeSortMenu = () => setSortMenuVisible(false);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.Content title="Vault" titleStyle={styles.headerTitle} />
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
        <Appbar.Content title="Vault" titleStyle={styles.headerTitle} />
        <IconButton
          icon={() => (
            <Filter
              size={22}
              color={hasActiveFilters ? theme.colors.primary : theme.colors.onSurface}
            />
          )}
          onPress={() => setShowFilters(!showFilters)}
        />
        <IconButton
          icon={() => (
            viewMode === 'list'
              ? <LayoutGrid size={22} color={theme.colors.onSurface} />
              : <List size={22} color={theme.colors.onSurface} />
          )}
          onPress={toggleViewMode}
        />
        <Menu
          visible={sortMenuVisible}
          onDismiss={closeSortMenu}
          anchor={
            <IconButton
              icon={() => <ArrowUpDown size={22} color={theme.colors.onSurface} />}
              onPress={openSortMenu}
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
          placeholder="Search vault..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          {hasActiveFilters && (
            <View style={styles.activeFiltersRow}>
              <Text style={styles.filterSectionLabel}>Active:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFiltersScroll}>
                {typeFilter && (
                  <Chip
                    compact
                    onClose={() => setTypeFilter(null)}
                    style={styles.activeFilterChip}
                    textStyle={styles.activeFilterText}
                  >
                    {MEDIA_TYPE_LABELS[typeFilter]}
                  </Chip>
                )}
                {sourceDomainFilter && (
                  <Chip
                    compact
                    onClose={() => setSourceDomainFilter(null)}
                    style={styles.activeFilterChip}
                    textStyle={styles.activeFilterText}
                    icon={() => <Globe size={12} color={theme.colors.primary} />}
                  >
                    {sourceDomainFilter}
                  </Chip>
                )}
                {dateRangeFilter && (
                  <Chip
                    compact
                    onClose={() => setDateRangeFilter(null)}
                    style={styles.activeFilterChip}
                    textStyle={styles.activeFilterText}
                    icon={() => <Calendar size={12} color={theme.colors.primary} />}
                  >
                    {dateRangeFilter === 'today' ? 'Today' : dateRangeFilter === 'week' ? 'This Week' : 'This Month'}
                  </Chip>
                )}
                {selectedTagFilters.map(tagName => (
                  <Chip
                    key={tagName}
                    compact
                    onClose={() => toggleTagFilter(tagName)}
                    style={styles.activeFilterChip}
                    textStyle={styles.activeFilterText}
                    icon={() => <Tag size={12} color={theme.colors.primary} />}
                  >
                    {tagName}
                  </Chip>
                ))}
              </ScrollView>
              <IconButton
                icon={() => <X size={16} color={theme.colors.onSurfaceVariant} />}
                size={20}
                onPress={clearFilters}
              />
            </View>
          )}

          <Divider style={styles.filterDivider} />

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionLabel}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {availableTypes.map(type => (
                  <Chip
                    key={type}
                    selected={typeFilter === type}
                    onPress={() => setTypeFilter(typeFilter === type ? null : type)}
                    style={styles.filterChip}
                    compact
                  >
                    {MEDIA_TYPE_LABELS[type] || type}
                  </Chip>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionLabel}>Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                <Chip
                  selected={dateRangeFilter === 'today'}
                  onPress={() => setDateRangeFilter(dateRangeFilter === 'today' ? null : 'today')}
                  style={styles.filterChip}
                  compact
                >
                  Today
                </Chip>
                <Chip
                  selected={dateRangeFilter === 'week'}
                  onPress={() => setDateRangeFilter(dateRangeFilter === 'week' ? null : 'week')}
                  style={styles.filterChip}
                  compact
                >
                  This Week
                </Chip>
                <Chip
                  selected={dateRangeFilter === 'month'}
                  onPress={() => setDateRangeFilter(dateRangeFilter === 'month' ? null : 'month')}
                  style={styles.filterChip}
                  compact
                >
                  This Month
                </Chip>
              </View>
            </ScrollView>
          </View>

          {availableDomains.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionLabel}>Source</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  {availableDomains.map(domain => (
                    <Chip
                      key={domain}
                      selected={sourceDomainFilter === domain}
                      onPress={() => setSourceDomainFilter(sourceDomainFilter === domain ? null : domain)}
                      style={styles.filterChip}
                      compact
                    >
                      {domain}
                    </Chip>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          <Divider style={styles.filterDivider} />
        </View>
      )}

      {/* Tag facets - shown when searching */}
      {searchQuery.trim() && tagFacets.length > 0 && (
        <View style={styles.tagFacetsContainer}>
          <View style={styles.tagFacetsHeader}>
            <Tag size={14} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.tagFacetsLabel}>Filter by tag:</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {tagFacets.map(tag => (
                <Chip
                  key={tag.id}
                  selected={selectedTagFilters.includes(tag.name)}
                  onPress={() => toggleTagFilter(tag.name)}
                  style={styles.tagFacetChip}
                  compact
                >
                  {tag.name} ({tag.usage_count})
                </Chip>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          {searchQuery || hasActiveFilters ? (
            <>
              <Text variant="headlineSmall" style={styles.emptyTitle}>
                No results found
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? `No items match "${searchQuery}"`
                  : 'No items match the selected filters'}
              </Text>
              {hasActiveFilters && (
                <Chip
                  icon="close"
                  mode="outlined"
                  onPress={clearFilters}
                  style={styles.clearFiltersChip}
                >
                  Clear filters
                </Chip>
              )}
            </>
          ) : (
            <>
              <Text variant="headlineSmall" style={styles.emptyTitle}>
                Your Vault is Empty
              </Text>
              <Text style={styles.emptyText}>
                Start adding content to see it here.{'\n'}
                Tap Scratch to create your first item.
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
          viewMode={viewMode}
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
  clearFiltersChip: {
    marginTop: 16,
  },
  // Filter styles
  filtersContainer: {
    backgroundColor: theme.colors.surface,
    paddingBottom: 8,
  },
  filterDivider: {
    backgroundColor: theme.colors.outline,
  },
  filterSection: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  filterSectionLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  activeFiltersScroll: {
    flex: 1,
    marginLeft: 8,
  },
  activeFilterChip: {
    marginRight: 8,
    backgroundColor: theme.colors.primaryContainer,
  },
  activeFilterText: {
    color: theme.colors.onPrimaryContainer,
  },
  // Tag facets styles
  tagFacetsContainer: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  tagFacetsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  tagFacetsLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tagFacetChip: {
    backgroundColor: theme.colors.tertiaryContainer,
  },
});

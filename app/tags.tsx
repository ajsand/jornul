import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import {
  Appbar,
  Text,
  Card,
  Chip,
  IconButton,
  Searchbar,
  Dialog,
  Portal,
  Button,
  TextInput,
  Menu,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Tag, MoreVertical, Edit2, Trash2, Merge } from 'lucide-react-native';
import { db } from '@/lib/storage/db';
import * as repos from '@/lib/storage/repositories';
import { TagWithCount } from '@/lib/storage/types';
import { renameTag, mergeTags } from '@/lib/services/aets';
import { theme } from '@/lib/theme';

export default function TagsScreen() {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [, setLoading] = useState(true);

  // Dialog states
  const [renameDialogVisible, setRenameDialogVisible] = useState(false);
  const [mergeDialogVisible, setMergeDialogVisible] = useState(false);
  const [selectedTag, setSelectedTag] = useState<TagWithCount | null>(null);
  const [newName, setNewName] = useState('');
  const [mergeTarget, setMergeTarget] = useState<TagWithCount | null>(null);

  // Menu state
  const [menuVisible, setMenuVisible] = useState<number | null>(null);

  const loadTags = useCallback(async () => {
    try {
      await db.init();
      const rawDb = db.getRawDb();
      const allTags = await repos.listTags(rawDb, {
        sortBy: 'count',
        sortDirection: 'DESC',
      });
      setTags(allTags);
    } catch (error) {
      console.error('Failed to load tags:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  useFocusEffect(
    useCallback(() => {
      loadTags();
    }, [loadTags])
  );

  const filteredTags = searchQuery
    ? tags.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : tags;

  const handleRename = async () => {
    if (!selectedTag || !newName.trim()) return;

    try {
      const rawDb = db.getRawDb();
      await renameTag(rawDb, selectedTag.id, newName.trim());
      setRenameDialogVisible(false);
      setSelectedTag(null);
      setNewName('');
      loadTags();
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleMerge = async () => {
    if (!selectedTag || !mergeTarget) return;

    try {
      const rawDb = db.getRawDb();
      await mergeTags(rawDb, selectedTag.id, mergeTarget.id);
      setMergeDialogVisible(false);
      setSelectedTag(null);
      setMergeTarget(null);
      loadTags();
      Alert.alert('Success', `Merged "${selectedTag.name}" into "${mergeTarget.name}"`);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleDelete = async (tag: TagWithCount) => {
    Alert.alert(
      'Delete Tag',
      `Are you sure you want to delete "${tag.name}"? This will remove it from all items.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const rawDb = db.getRawDb();
              await repos.deleteTag(rawDb, tag.id);
              loadTags();
            } catch (error) {
              Alert.alert('Error', (error as Error).message);
            }
          },
        },
      ]
    );
  };

  const openRenameDialog = (tag: TagWithCount) => {
    setSelectedTag(tag);
    setNewName(tag.name);
    setMenuVisible(null);
    setRenameDialogVisible(true);
  };

  const openMergeDialog = (tag: TagWithCount) => {
    setSelectedTag(tag);
    setMergeTarget(null);
    setMenuVisible(null);
    setMergeDialogVisible(true);
  };

  const getKindColor = (kind: string | null) => {
    switch (kind) {
      case 'emergent':
        return theme.colors.tertiary;
      case 'manual':
        return theme.colors.primary;
      case 'system':
        return theme.colors.secondary;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const renderTag = ({ item }: { item: TagWithCount }) => (
    <Card style={styles.tagCard}>
      <Card.Content style={styles.tagContent}>
        <View style={styles.tagInfo}>
          <View style={styles.tagNameRow}>
            <Tag size={16} color={getKindColor(item.kind)} />
            <Text variant="titleMedium" style={styles.tagName}>
              {item.name}
            </Text>
          </View>
          <View style={styles.tagMeta}>
            <Chip compact style={styles.countChip} textStyle={styles.countChipText}>
              {item.usage_count} item{item.usage_count !== 1 ? 's' : ''}
            </Chip>
            <Text style={[styles.kindLabel, { color: getKindColor(item.kind) }]}>
              {item.kind || 'manual'}
            </Text>
          </View>
        </View>

        <Menu
          visible={menuVisible === item.id}
          onDismiss={() => setMenuVisible(null)}
          anchor={
            <IconButton
              icon={() => <MoreVertical size={20} color={theme.colors.onSurfaceVariant} />}
              onPress={() => setMenuVisible(item.id)}
            />
          }
        >
          <Menu.Item
            onPress={() => openRenameDialog(item)}
            title="Rename"
            leadingIcon={() => <Edit2 size={16} color={theme.colors.onSurface} />}
          />
          <Menu.Item
            onPress={() => openMergeDialog(item)}
            title="Merge into..."
            leadingIcon={() => <Merge size={16} color={theme.colors.onSurface} />}
          />
          <Menu.Item
            onPress={() => {
              setMenuVisible(null);
              handleDelete(item);
            }}
            title="Delete"
            leadingIcon={() => <Trash2 size={16} color={theme.colors.error} />}
          />
        </Menu>
      </Card.Content>
    </Card>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Tag size={48} color={theme.colors.onSurfaceVariant} />
      <Text variant="titleMedium" style={styles.emptyTitle}>
        No Tags Yet
      </Text>
      <Text style={styles.emptyText}>
        Tags will emerge automatically from your content.{'\n'}
        Start adding items to see tags appear.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Tags" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search tags..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />
      </View>

      <View style={styles.statsContainer}>
        <Chip compact icon="tag-multiple">
          {tags.length} tag{tags.length !== 1 ? 's' : ''}
        </Chip>
        <Chip compact icon="sparkles" style={styles.statChip}>
          {tags.filter(t => t.kind === 'emergent').length} emergent
        </Chip>
        <Chip compact icon="account" style={styles.statChip}>
          {tags.filter(t => t.kind === 'manual').length} manual
        </Chip>
      </View>

      <FlatList
        data={filteredTags}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTag}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
      />

      {/* Rename Dialog */}
      <Portal>
        <Dialog visible={renameDialogVisible} onDismiss={() => setRenameDialogVisible(false)}>
          <Dialog.Title>Rename Tag</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="New name"
              value={newName}
              onChangeText={setNewName}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRenameDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleRename} disabled={!newName.trim()}>
              Rename
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Merge Dialog */}
      <Portal>
        <Dialog visible={mergeDialogVisible} onDismiss={() => setMergeDialogVisible(false)}>
          <Dialog.Title>Merge Tag</Dialog.Title>
          <Dialog.Content>
            <Text style={{ marginBottom: 16 }}>
              Merge &quot;{selectedTag?.name}&quot; into another tag. All items will be moved to the target tag.
            </Text>
            <Text style={styles.selectLabel}>Select target tag:</Text>
            <View style={styles.mergeChipContainer}>
              {tags
                .filter(t => t.id !== selectedTag?.id)
                .slice(0, 10)
                .map(tag => (
                  <Chip
                    key={tag.id}
                    selected={mergeTarget?.id === tag.id}
                    onPress={() => setMergeTarget(tag)}
                    style={styles.mergeChip}
                    compact
                  >
                    {tag.name}
                  </Chip>
                ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setMergeDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleMerge} disabled={!mergeTarget}>
              Merge
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  statsContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  statChip: {
    marginLeft: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  tagCard: {
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
  },
  tagContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  tagInfo: {
    flex: 1,
  },
  tagNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagName: {
    color: theme.colors.onSurface,
  },
  tagMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginLeft: 24,
  },
  countChip: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  countChipText: {
    fontSize: 11,
  },
  kindLabel: {
    fontSize: 11,
    textTransform: 'capitalize',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 48,
  },
  emptyTitle: {
    color: theme.colors.onSurface,
    marginTop: 16,
  },
  emptyText: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  selectLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  mergeChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mergeChip: {
    marginBottom: 4,
  },
});

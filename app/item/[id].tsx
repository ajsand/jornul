import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Linking, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Appbar, Text, Chip, Card, Button, Snackbar, Divider, Dialog, Portal, TextInput as PaperInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { format } from 'date-fns';
import { ExternalLink, Calendar, Clock, FileText, Plus, Tag, Link2, ChevronRight, Trash2 } from 'lucide-react-native';
import { JournalItem, db } from '@/lib/storage/db';
import { MediaItem, MediaItemWithTags } from '@/lib/storage/types';
import * as repos from '@/lib/storage/repositories';
import { useJournalStore } from '@/lib/store';
import { getMediaTitle } from '@/lib/utils/mediaHelpers';
import { addManualTag } from '@/lib/services/aets';
import { TypeIcon } from '@/components/TypeIcon';
import { theme } from '@/lib/theme';

type DisplayItem = JournalItem | MediaItemWithTags;

export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<DisplayItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [editedNotes, setEditedNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [addTagDialogVisible, setAddTagDialogVisible] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<{id: number; name: string; usage_count: number}[]>([]);
  const [relatedItems, setRelatedItems] = useState<MediaItem[]>([]);
  
  // Confirmation dialog states (cross-platform alternative to Alert.alert)
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [removeTagDialogVisible, setRemoveTagDialogVisible] = useState(false);
  const [tagToRemove, setTagToRemove] = useState<{id: number; name: string} | null>(null);

  const loadItem = useCallback(async () => {
    try {
      if (!id) return;

      try {
        await db.init();
        const rawDb = db.getRawDb();
        // Use modular repository instead of deprecated db method
        const mediaItem = await repos.getMediaItem(rawDb, id);
        if (mediaItem) {
          setItem(mediaItem);
          setEditedNotes(mediaItem.notes || '');
          setHasUnsavedChanges(false);
          return;
        }
        // Fallback to checking the store for legacy items
        const { items } = useJournalStore.getState();
        const storeItem = items.find(item => item.id === id);
        setItem(storeItem || null);
        setEditedNotes('');
        setHasUnsavedChanges(false);
      } catch (dbError) {
        console.warn('Database query failed, checking store:', dbError);
        // Fallback to checking the store
        const { items } = useJournalStore.getState();
        const storeItem = items.find(item => item.id === id);
        setItem(storeItem || null);
        setEditedNotes('');
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Failed to load item:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  const loadRelatedItems = useCallback(async (currentItem: MediaItemWithTags) => {
    if (!currentItem.tags || currentItem.tags.length === 0) {
      setRelatedItems([]);
      return;
    }

    try {
      const rawDb = db.getRawDb();
      const tagIds = currentItem.tags.map((t: any) => t.id);
      
      // Find items that share at least one tag with the current item
      // Count shared tags and sort by most shared
      const candidateItemIds = new Map<string, number>();
      
      for (const tagId of tagIds) {
        const itemIds = await repos.getItemsForTag(rawDb, tagId, 20);
        for (const itemId of itemIds) {
          if (itemId !== currentItem.id) {
            candidateItemIds.set(itemId, (candidateItemIds.get(itemId) || 0) + 1);
          }
        }
      }

      // Sort by number of shared tags (descending) and take top 5
      const sortedCandidates = Array.from(candidateItemIds.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([itemId]) => itemId);

      // Fetch the actual items
      const items: MediaItem[] = [];
      for (const itemId of sortedCandidates) {
        const item = await repos.getMediaItem(rawDb, itemId);
        if (item) {
          items.push(item);
        }
      }

      setRelatedItems(items);
    } catch (error) {
      console.error('Failed to load related items:', error);
      setRelatedItems([]);
    }
  }, []);

  // Load related items when the item changes
  useEffect(() => {
    if (item && !('clean_text' in item)) {
      loadRelatedItems(item as MediaItemWithTags);
    }
  }, [item, loadRelatedItems]);

  const handleSaveNotes = async () => {
    if (!item || isSaving) return;

    setIsSaving(true);
    try {
      const isLegacyItem = 'clean_text' in item;
      if (isLegacyItem) {
        showSnackbar('Legacy items cannot be edited');
        return;
      }

      const rawDb = db.getRawDb();
      await repos.updateMediaItem(rawDb, item.id, { notes: editedNotes });
      const updated = await repos.getMediaItem(rawDb, item.id);
      if (updated) {
        setItem(updated);
        setHasUnsavedChanges(false);
        showSnackbar('Notes saved successfully');
      }
    } catch (error) {
      console.error('Failed to save notes:', error);
      showSnackbar('Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveTag = (tagId: number, tagName: string) => {
    if (!item) return;
    setTagToRemove({ id: tagId, name: tagName });
    setRemoveTagDialogVisible(true);
  };

  const confirmRemoveTag = async () => {
    if (!item || !tagToRemove) return;
    
    try {
      const rawDb = db.getRawDb();
      await repos.detachTagFromItem(rawDb, item.id, tagToRemove.id);
      const updated = await repos.getMediaItem(rawDb, item.id);
      if (updated) {
        setItem(updated);
        showSnackbar('Tag removed');
      }
    } catch (error) {
      console.error('Failed to remove tag:', error);
      showSnackbar('Failed to remove tag');
    } finally {
      setRemoveTagDialogVisible(false);
      setTagToRemove(null);
    }
  };

  const handleAddTag = async (tagNameToAdd?: string) => {
    const name = tagNameToAdd || newTagName.trim();
    if (!item || !name) return;

    try {
      const rawDb = db.getRawDb();
      await addManualTag(rawDb, item.id, name);
      const updated = await repos.getMediaItem(rawDb, item.id);
      if (updated) {
        setItem(updated);
        showSnackbar('Tag added');
      }
      setAddTagDialogVisible(false);
      setNewTagName('');
      setTagSuggestions([]);
    } catch (error) {
      console.error('Failed to add tag:', error);
      showSnackbar((error as Error).message || 'Failed to add tag');
    }
  };

  const handleTagNameChange = async (text: string) => {
    setNewTagName(text);

    // Fetch suggestions when user types at least 2 chars
    if (text.trim().length >= 2 && item) {
      try {
        const rawDb = db.getRawDb();
        const suggestions = await repos.findSimilarTags(rawDb, text.trim(), 5);
        // Filter out tags already on the item
        const isLegacy = 'clean_text' in item;
        const itemTags = isLegacy
          ? (item as JournalItem).tags || []
          : (item as MediaItemWithTags).tags || [];
        const currentTagNames = itemTags.map((t: any) =>
          typeof t === 'string' ? t.toLowerCase() : t.name?.toLowerCase()
        ).filter(Boolean);
        const filtered = suggestions.filter(
          s => !currentTagNames.includes(s.name.toLowerCase())
        );
        setTagSuggestions(filtered);
      } catch {
        setTagSuggestions([]);
      }
    } else {
      setTagSuggestions([]);
    }
  };

  const handleSelectSuggestion = (suggestion: {id: number; name: string}) => {
    handleAddTag(suggestion.name);
  };

  const handleNotesChange = (text: string) => {
    setEditedNotes(text);
    const isLegacyItem = item && 'clean_text' in item;
    if (!isLegacyItem && item) {
      const originalNotes = (item as MediaItemWithTags).notes || '';
      setHasUnsavedChanges(text !== originalNotes);
    }
  };

  const handleOpenUrl = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        showSnackbar('Cannot open this URL');
      }
    } catch (error) {
      console.error('Failed to open URL:', error);
      showSnackbar('Failed to open URL');
    }
  };

  const handleDeleteItem = () => {
    if (!item) return;
    setDeleteDialogVisible(true);
  };

  const confirmDeleteItem = async () => {
    if (!item) return;
    
    try {
      const rawDb = db.getRawDb();
      await repos.deleteMediaItem(rawDb, item.id);
      // Update Zustand store to reflect deletion immediately
      const { removeItem } = useJournalStore.getState();
      removeItem(item.id);
      setDeleteDialogVisible(false);
      router.back();
    } catch (error) {
      console.error('Failed to delete item:', error);
      setDeleteDialogVisible(false);
      showSnackbar('Failed to delete item');
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
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

  // Extract display data with compatibility for both old and new types
  const isLegacyItem = 'clean_text' in item;
  const displayTitle = isLegacyItem 
    ? ((item as JournalItem).clean_text || 'Untitled').slice(0, 50)
    : getMediaTitle(item as MediaItemWithTags);
  
  const mediaItem = !isLegacyItem ? (item as MediaItemWithTags) : null;
  const displayTags = isLegacyItem
    ? (item as JournalItem).tags || []
    : (item as MediaItemWithTags).tags || [];

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={displayTitle} titleStyle={styles.headerTitle} />
        {!isLegacyItem && (
          <Appbar.Action
            icon={() => <Trash2 size={22} color={theme.colors.error} />}
            onPress={handleDeleteItem}
            accessibilityLabel="Delete item"
          />
        )}
      </Appbar.Header>

      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView style={styles.content}>
          {/* Metadata Card */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.metadataRow}>
                <TypeIcon type={item.type} size={28} color={theme.colors.primary} />
                <View style={styles.metadataContent}>
                  <Text variant="titleMedium" style={styles.metadataTitle}>
                    {mediaItem?.title || displayTitle}
                  </Text>
                  <Text variant="bodySmall" style={styles.metadataType}>
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  </Text>
                </View>
              </View>

              <Divider style={styles.divider} />

              {mediaItem?.source_url && (
                <View style={styles.metadataItem}>
                  <ExternalLink size={16} color={theme.colors.primary} />
                  <Text 
                    style={styles.metadataLink}
                    onPress={() => handleOpenUrl(mediaItem.source_url!)}
                    numberOfLines={1}
                  >
                    {mediaItem.source_url}
                  </Text>
                </View>
              )}

              <View style={styles.metadataItem}>
                <Calendar size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.metadataText}>
                  Created: {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                </Text>
              </View>

              {mediaItem && (
                <View style={styles.metadataItem}>
                  <Clock size={16} color={theme.colors.onSurfaceVariant} />
                  <Text style={styles.metadataText}>
                    Updated: {format(new Date(mediaItem.updated_at), 'MMM d, yyyy h:mm a')}
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Notes Section */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <FileText size={20} color={theme.colors.onSurface} />
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Notes
                </Text>
              </View>
              
              {isLegacyItem ? (
                <Text style={styles.text}>
                  {(item as JournalItem).clean_text || 'No content'}
                </Text>
              ) : (
                <>
                  <TextInput
                    style={styles.notesInput}
                    value={editedNotes}
                    onChangeText={handleNotesChange}
                    placeholder="Add your notes here..."
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    multiline
                    numberOfLines={8}
                    textAlignVertical="top"
                    editable={!isSaving}
                  />
                  {hasUnsavedChanges && (
                    <Button
                      mode="contained"
                      onPress={handleSaveNotes}
                      loading={isSaving}
                      disabled={isSaving}
                      style={styles.saveButton}
                    >
                      {isSaving ? 'Saving...' : 'Save Notes'}
                    </Button>
                  )}
                </>
              )}
            </Card.Content>
          </Card>

          {/* Tags Section */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.tagsSectionHeader}>
                <View style={styles.sectionHeader}>
                  <Tag size={20} color={theme.colors.onSurface} />
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Tags
                  </Text>
                </View>
                {!isLegacyItem && (
                  <Button
                    mode="text"
                    compact
                    icon={() => <Plus size={16} color={theme.colors.primary} />}
                    onPress={() => setAddTagDialogVisible(true)}
                  >
                    Add
                  </Button>
                )}
              </View>

              {displayTags.length > 0 ? (
                <View style={styles.tagsContainer}>
                  {isLegacyItem ? (
                    (displayTags as string[]).map((tag, index) => (
                      <Chip
                        key={index}
                        style={styles.tag}
                        textStyle={styles.tagText}
                        compact
                      >
                        {tag}
                      </Chip>
                    ))
                  ) : (
                    (displayTags as {id: number; name: string; kind?: string; source?: string; confidence?: number | null}[]).map((tag) => (
                      <View key={tag.id} style={styles.tagWrapper}>
                        <Chip
                          style={[
                            styles.tag,
                            tag.kind === 'emergent' && styles.emergentTag,
                            tag.source === 'user' && styles.manualTag,
                          ]}
                          textStyle={styles.tagText}
                          onClose={() => handleRemoveTag(tag.id, tag.name)}
                          compact
                        >
                          {tag.name}
                        </Chip>
                        {tag.confidence != null && tag.source !== 'user' && (
                          <View
                            style={[
                              styles.confidenceDot,
                              { opacity: Math.max(0.3, tag.confidence) },
                            ]}
                          />
                        )}
                      </View>
                    ))
                  )}
                </View>
              ) : (
                <Text style={styles.emptyText}>No tags yet. Tags will be added automatically or you can add them manually.</Text>
              )}
            </Card.Content>
          </Card>

          {/* Related Items Section */}
          {!isLegacyItem && relatedItems.length > 0 && (
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.sectionHeader}>
                  <Link2 size={20} color={theme.colors.onSurface} />
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Related Items
                  </Text>
                </View>
                <Text style={styles.relatedSubtext}>
                  Items with similar tags
                </Text>
                
                {relatedItems.map((relatedItem) => (
                  <TouchableOpacity
                    key={relatedItem.id}
                    style={styles.relatedItem}
                    onPress={() => router.push(`/item/${relatedItem.id}`)}
                  >
                    <TypeIcon type={relatedItem.type} size={20} color={theme.colors.primary} />
                    <View style={styles.relatedItemContent}>
                      <Text
                        variant="bodyMedium"
                        style={styles.relatedItemTitle}
                        numberOfLines={1}
                      >
                        {relatedItem.title || 'Untitled'}
                      </Text>
                      <Text style={styles.relatedItemType}>
                        {relatedItem.type}
                      </Text>
                    </View>
                    <ChevronRight size={20} color={theme.colors.onSurfaceVariant} />
                  </TouchableOpacity>
                ))}
              </Card.Content>
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Add Tag Dialog */}
      <Portal>
        <Dialog visible={addTagDialogVisible} onDismiss={() => {
          setAddTagDialogVisible(false);
          setTagSuggestions([]);
        }}>
          <Dialog.Title>Add Tag</Dialog.Title>
          <Dialog.Content>
            <PaperInput
              label="Tag name"
              value={newTagName}
              onChangeText={handleTagNameChange}
              mode="outlined"
              autoFocus
            />
            {tagSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsLabel}>Suggestions:</Text>
                <View style={styles.suggestionsChips}>
                  {tagSuggestions.map(suggestion => (
                    <Chip
                      key={suggestion.id}
                      onPress={() => handleSelectSuggestion(suggestion)}
                      style={styles.suggestionChip}
                      compact
                    >
                      {suggestion.name} ({suggestion.usage_count})
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setAddTagDialogVisible(false);
              setNewTagName('');
              setTagSuggestions([]);
            }}>
              Cancel
            </Button>
            <Button onPress={() => handleAddTag()} disabled={!newTagName.trim()}>
              Add
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete Item Confirmation Dialog */}
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Delete Item</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this item? This cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={confirmDeleteItem} textColor={theme.colors.error}>Delete</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Remove Tag Confirmation Dialog */}
        <Dialog visible={removeTagDialogVisible} onDismiss={() => {
          setRemoveTagDialogVisible(false);
          setTagToRemove(null);
        }}>
          <Dialog.Title>Remove Tag</Dialog.Title>
          <Dialog.Content>
            <Text>Remove &quot;{tagToRemove?.name}&quot; from this item?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setRemoveTagDialogVisible(false);
              setTagToRemove(null);
            }}>Cancel</Button>
            <Button onPress={confirmRemoveTag} textColor={theme.colors.error}>Remove</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
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
    marginBottom: 16,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metadataContent: {
    flex: 1,
    marginLeft: 12,
  },
  metadataTitle: {
    color: theme.colors.onSurface,
    fontWeight: '600',
  },
  metadataType: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  divider: {
    marginVertical: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metadataText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  metadataLink: {
    color: theme.colors.primary,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    textDecorationLine: 'underline',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: theme.colors.onSurface,
    fontWeight: '600',
    marginLeft: 8,
  },
  text: {
    color: theme.colors.onSurface,
    lineHeight: 24,
    fontSize: 16,
  },
  notesInput: {
    minHeight: 150,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    padding: 12,
    color: theme.colors.onSurface,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  saveButton: {
    marginTop: 8,
  },
  tagsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tagWrapper: {
    position: 'relative',
  },
  tag: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  confidenceDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.tertiary,
  },
  emergentTag: {
    backgroundColor: theme.colors.tertiaryContainer,
  },
  manualTag: {
    backgroundColor: theme.colors.primaryContainer,
  },
  tagText: {
    color: theme.colors.onSurfaceVariant,
  },
  emptyText: {
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    marginTop: 8,
  },
  relatedSubtext: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    marginBottom: 12,
    marginTop: -4,
  },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  relatedItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  relatedItemTitle: {
    color: theme.colors.onSurface,
  },
  relatedItemType: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    textTransform: 'capitalize',
    marginTop: 2,
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
  snackbar: {
    backgroundColor: theme.colors.inverseSurface,
  },
  suggestionsContainer: {
    marginTop: 12,
  },
  suggestionsLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  suggestionsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionChip: {
    backgroundColor: theme.colors.secondaryContainer,
  },
});
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Alert, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import { Appbar, Text, Chip, Card, Button, Snackbar, IconButton, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { format } from 'date-fns';
import { ExternalLink, Calendar, Clock, FileText } from 'lucide-react-native';
import { JournalItem, db } from '@/lib/storage/db';
import { MediaItemWithTags } from '@/lib/storage/types';
import { useJournalStore } from '@/lib/store';
import { getMediaTitle } from '@/lib/utils/mediaHelpers';
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

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    try {
      if (!id) return;
      
      try {
        await db.init();
        // Try new API first
        const mediaItem = await db.getMediaItem(id);
        if (mediaItem) {
          setItem(mediaItem);
          setEditedNotes(mediaItem.notes || '');
          setHasUnsavedChanges(false);
          return;
        }
        // Fallback to legacy API
        const journalItem = await db.getItem(id);
        setItem(journalItem);
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
  };

  const handleSaveNotes = async () => {
    if (!item || isSaving) return;
    
    setIsSaving(true);
    try {
      const isLegacyItem = 'clean_text' in item;
      if (isLegacyItem) {
        showSnackbar('Legacy items cannot be edited');
        return;
      }

      await db.updateMediaItem(item.id, { notes: editedNotes });
      const updated = await db.getMediaItem(item.id);
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

  const handleRemoveTag = async (tagId: number, tagName: string) => {
    if (!item) return;

    Alert.alert(
      'Remove Tag',
      `Remove "${tagName}" from this item?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.detachTagFromItem(item.id, tagId);
              const updated = await db.getMediaItem(item.id);
              if (updated) {
                setItem(updated);
                showSnackbar('Tag removed');
              }
            } catch (error) {
              console.error('Failed to remove tag:', error);
              showSnackbar('Failed to remove tag');
            }
          },
        },
      ]
    );
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
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Tags
              </Text>
              
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
                    (displayTags as {id: number; name: string}[]).map((tag) => (
                      <Chip
                        key={tag.id}
                        style={styles.tag}
                        textStyle={styles.tagText}
                        onClose={() => handleRemoveTag(tag.id, tag.name)}
                        compact
                      >
                        {tag.name}
                      </Chip>
                    ))
                  )}
                </View>
              ) : (
                <Text style={styles.emptyText}>No tags yet</Text>
              )}
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    backgroundColor: theme.colors.primaryContainer,
  },
  tagText: {
    color: theme.colors.onPrimaryContainer,
  },
  emptyText: {
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    marginTop: 8,
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
});
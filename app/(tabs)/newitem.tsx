import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Appbar, TextInput, Button, Card, Text, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { v4 as uuidv4 } from 'uuid';
import { Camera, Mic } from 'lucide-react-native';
import { useJournalStore } from '@/lib/store';
import { db } from '@/lib/storage/db';
import { embed } from '@/lib/ai/embeddings';
import { theme } from '@/lib/theme';

export default function NewItemScreen() {
  const { addItem } = useJournalStore();
  const [text, setText] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please enter some text for your journal entry.');
      return;
    }

    setLoading(true);
    try {
      const id = uuidv4();
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Create the journal item
      const item = {
        id,
        type: 'text' as const,
        clean_text: text.trim(),
        tags: tagArray,
        created_at: Date.now(),
      };

      // Try to save to database, but continue even if it fails
      try {
        await db.init();
        await db.insertItem(item);

        // Compute and save embedding if text is suitable
        if (text.length <= 1024) {
          const embedding = embed(text);
          await db.updateItemEmbedding(id, embedding);
          item.embedding = embedding;
        }
      } catch (dbError) {
        console.warn('Database save failed, continuing with in-memory storage:', dbError);
      }

      // Add to store
      addItem(item);

      // Navigate back
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/');
      }
    } catch (error) {
      console.error('Failed to save journal entry:', error);
      Alert.alert('Error', 'Failed to save your journal entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleComingSoon = (feature: string) => {
    Alert.alert('Coming Soon', `${feature} support will be available in a future update.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="New Entry" titleStyle={styles.headerTitle} />
        <Appbar.Action 
          icon="check" 
          onPress={handleSave}
          disabled={loading || !text.trim()}
        />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Text Entry
            </Text>
            <TextInput
              mode="outlined"
              multiline
              numberOfLines={8}
              placeholder="What's on your mind today?"
              value={text}
              onChangeText={setText}
              style={styles.textInput}
              textAlignVertical="top"
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
            />

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Tags (comma separated)
            </Text>
            <TextInput
              mode="outlined"
              placeholder="travel, food, thoughts, goals"
              value={tags}
              onChangeText={setTags}
              style={styles.tagsInput}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
            />

            {tags.length > 0 && (
              <View style={styles.tagsPreview}>
                {tags
                  .split(',')
                  .map(tag => tag.trim())
                  .filter(tag => tag.length > 0)
                  .map((tag, index) => (
                    <Chip key={index} style={styles.tagChip} textStyle={styles.tagText} compact>
                      {tag}
                    </Chip>
                  ))}
              </View>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Import Files
            </Text>
            <Text style={styles.sectionDescription}>
              Import multiple files at once (images, documents, audio, video)
            </Text>
            <Button
              mode="contained"
              onPress={() => router.push('/import')}
              style={styles.importButton}
              icon="file-upload"
            >
              Import Files
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Media (Coming Soon)
            </Text>
            <View style={styles.mediaButtons}>
              <Button
                mode="outlined"
                icon={() => <Camera size={20} color={theme.colors.outline} />}
                onPress={() => handleComingSoon('Image')}
                style={styles.mediaButton}
                textColor={theme.colors.outline}
                disabled
              >
                Add Image
              </Button>
              <Button
                mode="outlined"
                icon={() => <Mic size={20} color={theme.colors.outline} />}
                onPress={() => handleComingSoon('Audio')}
                style={styles.mediaButton}
                textColor={theme.colors.outline}
                disabled
              >
                Add Audio
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          disabled={loading || !text.trim()}
          style={styles.saveButton}
        >
          Save Entry
        </Button>
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
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  sectionTitle: {
    color: theme.colors.onSurface,
    marginBottom: 12,
    fontWeight: '500',
  },
  sectionDescription: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 12,
    fontSize: 14,
  },
  importButton: {
    marginTop: 8,
  },
  textInput: {
    marginBottom: 16,
    backgroundColor: theme.colors.background,
    minHeight: 120,
  },
  tagsInput: {
    marginBottom: 12,
    backgroundColor: theme.colors.background,
  },
  tagsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  tagText: {
    color: theme.colors.onPrimaryContainer,
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaButton: {
    flex: 1,
    borderColor: theme.colors.outline,
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 32,
  },
});
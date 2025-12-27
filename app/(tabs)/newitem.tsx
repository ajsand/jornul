import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView, Clipboard } from 'react-native';
import { Appbar, TextInput, Button, Card, Text, Chip, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { v4 as uuidv4 } from 'uuid';
import * as DocumentPicker from 'expo-document-picker';
import { Clipboard as ClipboardIcon, FileUp } from 'lucide-react-native';
import { db } from '@/lib/storage/db';
import { processIngestItem } from '@/lib/ingest/processor';
import { theme } from '@/lib/theme';

export default function NewItemScreen() {
  const [text, setText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<{ name: string; uri: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePaste = async () => {
    try {
      const clipboardContent = await Clipboard.getString();
      if (clipboardContent) {
        setText(clipboardContent);
      } else {
        Alert.alert('Clipboard Empty', 'No text found in clipboard');
      }
    } catch (error) {
      console.error('Failed to paste from clipboard:', error);
      Alert.alert('Error', 'Failed to paste from clipboard');
    }
  };

  const handlePickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf', 'audio/*', 'video/*'],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      // Handle both single and multiple file selection
      const files = result.assets || [];
      const newFiles = files.map(asset => ({
        name: asset.name,
        uri: asset.uri,
      }));

      setSelectedFiles(prev => [...prev, ...newFiles]);
    } catch (error) {
      console.error('Error picking files:', error);
      Alert.alert('Error', 'Failed to pick files. Please try again.');
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!text.trim() && selectedFiles.length === 0) {
      Alert.alert('Error', 'Please add some text or files to save.');
      return;
    }

    setLoading(true);
    try {
      await db.init();
      const ingestIds: string[] = [];

      // Create ingest item for text/URL if provided
      if (text.trim()) {
        const ingestId = uuidv4();
        await db.createIngestItem({
          id: ingestId,
          source_type: 'text',
          raw_content: text.trim(),
        });
        ingestIds.push(ingestId);
      }

      // Create ingest items for each file
      for (const file of selectedFiles) {
        const ingestId = uuidv4();
        await db.createIngestItem({
          id: ingestId,
          source_type: 'file',
          file_uri: file.uri,
        });
        ingestIds.push(ingestId);
      }

      // Process all ingest items in background
      // In a production app, this would be done by a background task
      setTimeout(async () => {
        for (const ingestId of ingestIds) {
          try {
            await processIngestItem(ingestId);
          } catch (error) {
            console.error(`Failed to process ingest item ${ingestId}:`, error);
          }
        }
      }, 100);

      // Show success message
      const itemCount = ingestIds.length;
      Alert.alert(
        'Success',
        `Added ${itemCount} item${itemCount > 1 ? 's' : ''} to your library. Processing in background...`,
        [{ text: 'OK', onPress: () => router.push('/(tabs)/library') }]
      );

      // Clear form
      setText('');
      setSelectedFiles([]);
    } catch (error) {
      console.error('Failed to save items:', error);
      Alert.alert('Error', 'Failed to save your items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Quick Add" titleStyle={styles.headerTitle} />
        <Appbar.Action
          icon="check"
          onPress={handleSave}
          disabled={loading || (!text.trim() && selectedFiles.length === 0)}
        />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.titleRow}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Paste or Type
              </Text>
              <IconButton
                icon={() => <ClipboardIcon size={20} color={theme.colors.primary} />}
                onPress={handlePaste}
                size={20}
                mode="contained-tonal"
              />
            </View>
            <TextInput
              mode="outlined"
              multiline
              numberOfLines={8}
              placeholder="Paste a link, add some text, or start typing..."
              value={text}
              onChangeText={setText}
              style={styles.textInput}
              textAlignVertical="top"
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
            />
            <Text style={styles.hint}>
              Text or URL will be automatically detected and processed
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Add Files
            </Text>
            <Text style={styles.sectionDescription}>
              Images, PDFs, audio, and video files
            </Text>
            <Button
              mode="outlined"
              onPress={handlePickFiles}
              style={styles.fileButton}
              icon={() => <FileUp size={20} color={theme.colors.primary} />}
            >
              Pick Files
            </Button>

            {selectedFiles.length > 0 && (
              <View style={styles.filesPreview}>
                {selectedFiles.map((file, index) => (
                  <Chip
                    key={index}
                    style={styles.fileChip}
                    textStyle={styles.fileText}
                    onClose={() => handleRemoveFile(index)}
                  >
                    {file.name}
                  </Chip>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          disabled={loading || (!text.trim() && selectedFiles.length === 0)}
          style={styles.saveButton}
        >
          {loading ? 'Saving...' : 'Save to Library'}
        </Button>

        <Text style={styles.footer}>
          Items will be processed automatically after saving.
          You can continue using the app while processing happens in the background.
        </Text>
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  sectionDescription: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 12,
    fontSize: 14,
  },
  textInput: {
    marginBottom: 8,
    backgroundColor: theme.colors.background,
    minHeight: 120,
  },
  hint: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    fontStyle: 'italic',
  },
  fileButton: {
    marginTop: 8,
    borderColor: theme.colors.primary,
  },
  filesPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  fileChip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  fileText: {
    color: theme.colors.onPrimaryContainer,
    fontSize: 12,
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  footer: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 32,
    lineHeight: 18,
  },
});
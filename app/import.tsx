import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Appbar, Text, Button, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { v4 as uuidv4 } from 'uuid';
import { Upload, FileUp } from 'lucide-react-native';
import { ImportProgressList, ImportItem, ImportStatus } from '@/components/ImportProgressList';
import { 
  inferMediaType, 
  extractTitleFromFilename, 
  copyFileToAppDirectory,
  formatFileSize 
} from '@/lib/utils/fileHelpers';
import { db } from '@/lib/storage/db';
import { theme } from '@/lib/theme';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_FILES = 50;

export default function ImportScreen() {
  const [importItems, setImportItems] = useState<ImportItem[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);

  const updateItemStatus = (
    id: string, 
    status: ImportStatus, 
    error?: string, 
    progress?: number
  ) => {
    setImportItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, status, error, progress } : item
      )
    );
  };

  const handlePickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: false,
      });

      if (result.canceled) {
        return;
      }

      // Handle both single and multiple file selection
      const files = result.assets || [];
      
      if (files.length === 0) {
        return;
      }

      // Check file limit
      if (importItems.length + files.length > MAX_FILES) {
        Alert.alert(
          'Too Many Files',
          `You can only import up to ${MAX_FILES} files at once.`
        );
        return;
      }

      // Validate and add files
      const newItems: ImportItem[] = [];
      const skippedFiles: string[] = [];
      
      for (const file of files) {
        // Check file size
        if (file.size && file.size > MAX_FILE_SIZE) {
          skippedFiles.push(file.name);
          continue;
        }

        // Store all file info immediately
        newItems.push({
          id: uuidv4(),
          filename: file.name,
          status: 'pending',
          size: file.size || 0,
          uri: file.uri,
          mimeType: file.mimeType || undefined,
        });
      }

      // Show alert if any files were skipped
      if (skippedFiles.length > 0) {
        Alert.alert(
          'Files Skipped',
          `${skippedFiles.length} file(s) too large (max ${formatFileSize(MAX_FILE_SIZE)}):\n${skippedFiles.slice(0, 3).join(', ')}${skippedFiles.length > 3 ? '...' : ''}`
        );
      }

      setImportItems(prev => [...prev, ...newItems]);

    } catch (error) {
      console.error('Failed to pick files:', error);
      Alert.alert('Error', 'Failed to pick files. Please try again.');
    }
  };

  const handleStartImport = async () => {
    setIsImporting(true);
    await db.init();

    let successCount = 0;
    let errorCount = 0;

    for (const item of importItems) {
      if (item.status !== 'pending') continue;

      try {
        updateItemStatus(item.id, 'importing', undefined, 0);

        if (!item.uri) {
          throw new Error('File URI missing');
        }

        // Copy file to app directory
        updateItemStatus(item.id, 'importing', undefined, 30);
        const destUri = await copyFileToAppDirectory(item.uri, item.filename);

        // Infer media type
        updateItemStatus(item.id, 'importing', undefined, 50);
        const mediaType = inferMediaType(item.mimeType || '', item.filename);

        // Extract title
        const title = extractTitleFromFilename(item.filename);

        // Create metadata
        const metadata = {
          originalFilename: item.filename,
          mimeType: item.mimeType || 'application/octet-stream',
          size: item.size || 0,
          importedAt: Date.now(),
        };

        // Create MediaItem in database
        updateItemStatus(item.id, 'importing', undefined, 80);
        await db.createMediaItem({
          id: uuidv4(),
          type: mediaType,
          title: title,
          local_uri: destUri,
          metadata_json: JSON.stringify(metadata),
        });

        updateItemStatus(item.id, 'success', undefined, 100);
        successCount++;

      } catch (error: any) {
        console.error(`Failed to import ${item.filename}:`, error);
        updateItemStatus(item.id, 'error', error.message || 'Import failed');
        errorCount++;
      }
    }

    setIsImporting(false);
    setImportComplete(true);

    // Show summary
    if (successCount > 0) {
      Alert.alert(
        'Import Complete',
        `Successfully imported ${successCount} file(s).${errorCount > 0 ? `\n${errorCount} file(s) failed.` : ''}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleDone = () => {
    router.replace('/(tabs)/library');
  };

  const handleAddMore = async () => {
    await handlePickFiles();
  };

  const handleCancel = () => {
    if (isImporting) {
      Alert.alert(
        'Cancel Import?',
        'Import is in progress. Are you sure you want to cancel?',
        [
          { text: 'Continue', style: 'cancel' },
          { 
            text: 'Cancel', 
            style: 'destructive',
            onPress: () => router.back()
          }
        ]
      );
    } else {
      router.back();
    }
  };

  const successCount = importItems.filter(i => i.status === 'success').length;
  const errorCount = importItems.filter(i => i.status === 'error').length;
  const pendingCount = importItems.filter(i => i.status === 'pending').length;

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={handleCancel} />
        <Appbar.Content title="Import Files" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {importItems.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Upload size={64} color={theme.colors.onSurfaceVariant} />
              <Text variant="headlineSmall" style={styles.emptyTitle}>
                No Files Selected
              </Text>
              <Text style={styles.emptyText}>
                Tap the button below to select files to import
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <>
            <Card style={styles.statsCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.statsTitle}>
                  Import Summary
                </Text>
                <View style={styles.statsRow}>
                  <Text style={styles.statsText}>Total: {importItems.length}</Text>
                  <Text style={styles.statsText}>Pending: {pendingCount}</Text>
                  <Text style={[styles.statsText, styles.successText]}>Success: {successCount}</Text>
                  {errorCount > 0 && (
                    <Text style={[styles.statsText, styles.errorText]}>Errors: {errorCount}</Text>
                  )}
                </View>
              </Card.Content>
            </Card>

            <ImportProgressList items={importItems} />
          </>
        )}
      </ScrollView>

      <View style={styles.actions}>
        {!isImporting && !importComplete && (
          <Button
            mode="outlined"
            onPress={handlePickFiles}
            icon={() => <FileUp size={20} color={theme.colors.primary} />}
            style={styles.actionButton}
            disabled={importItems.length >= MAX_FILES}
          >
            {importItems.length === 0 ? 'Select Files' : 'Add More Files'}
          </Button>
        )}

        {importItems.length > 0 && !isImporting && !importComplete && (
          <Button
            mode="contained"
            onPress={handleStartImport}
            style={styles.actionButton}
          >
            Start Import ({pendingCount} files)
          </Button>
        )}

        {isImporting && (
          <Button
            mode="contained"
            loading
            disabled
            style={styles.actionButton}
          >
            Importing...
          </Button>
        )}

        {importComplete && (
          <>
            <Button
              mode="outlined"
              onPress={handleAddMore}
              style={styles.actionButton}
            >
              Import More Files
            </Button>
            <Button
              mode="contained"
              onPress={handleDone}
              style={styles.actionButton}
            >
              Go to Library
            </Button>
          </>
        )}
      </View>
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
  },
  emptyCard: {
    margin: 16,
    backgroundColor: theme.colors.surface,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    color: theme.colors.onSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  statsCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
  },
  statsTitle: {
    color: theme.colors.onSurface,
    marginBottom: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statsText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
  },
  successText: {
    color: '#4CAF50',
  },
  errorText: {
    color: theme.colors.error,
  },
  actions: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
  },
  actionButton: {
    width: '100%',
  },
});


import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Appbar, TextInput, Button, Text, HelperText, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { v4 as uuidv4 } from 'uuid';
import * as Clipboard from 'expo-clipboard';
import { Clipboard as ClipboardIcon, Save, Sparkles, Upload } from 'lucide-react-native';
import { db } from '@/lib/storage/db';
import * as repos from '@/lib/storage/repositories';
import {
  pickMultipleFiles,
  processBatchUpload,
  startJobRunner,
  registerAllJobHandlers,
  isJobRunnerActive,
  extractUrls,
  countUrls,
} from '@/lib/services';
import { theme } from '@/lib/theme';

type ContentType = 'unknown' | 'url' | 'urls' | 'note';

/**
 * Detect content type - single URL, multiple URLs, or note
 */
function detectContentType(text: string): ContentType {
  if (!text.trim()) return 'unknown';

  const trimmed = text.trim();
  const urlCount = countUrls(trimmed);

  if (urlCount > 1) {
    return 'urls';
  }

  if (urlCount === 1) {
    return 'url';
  }

  // Check for URL-like patterns without protocol
  if (/^(www\.)?[\w-]+\.[a-z]{2,}(\/\S*)?$/i.test(trimmed)) {
    return 'url';
  }

  return 'note';
}

/**
 * Extract title from URL
 */
function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.replace(/\/$/, '');
    const segments = pathname.split('/').filter(s => s.length > 0);

    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      return decodeURIComponent(lastSegment).replace(/[-_]/g, ' ').trim();
    }

    return urlObj.hostname;
  } catch {
    return 'Link';
  }
}

/**
 * Extract title from text content
 */
function extractTitleFromText(text: string): string {
  const cleaned = text.trim();
  const firstLine = cleaned.split('\n')[0].trim();

  if (firstLine.length > 0 && firstLine.length <= 60) {
    return firstLine;
  }

  const firstSentence = cleaned.split(/[.!?]/)[0].trim();
  if (firstSentence.length > 0 && firstSentence.length <= 60) {
    return firstSentence;
  }

  return cleaned.slice(0, 50) + (cleaned.length > 50 ? '...' : '');
}

/**
 * Normalize URL (add https:// if missing)
 */
function normalizeUrl(text: string): string {
  const trimmed = text.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return 'https://' + trimmed;
  }
  return trimmed;
}

export default function ScratchScreen() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const contentType = detectContentType(text);
  const hasContent = text.trim().length > 0;

  const handleMassUpload = useCallback(async () => {
    try {
      const files = await pickMultipleFiles();

      if (!files || files.length === 0) {
        return; // User cancelled
      }

      setUploading(true);

      const result = await processBatchUpload(files);

      if (result.success) {
        Alert.alert(
          'Import Started',
          `${result.itemCount} file${result.itemCount > 1 ? 's' : ''} added. Check Inbox for progress.`,
          [
            { text: 'View Inbox', onPress: () => router.push('/(tabs)/inbox') },
            { text: 'OK' },
          ]
        );
      } else {
        Alert.alert('Import Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Mass upload error:', error);
      Alert.alert('Error', 'Failed to import files. Please try again.');
    } finally {
      setUploading(false);
    }
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      if (clipboardContent) {
        setText(clipboardContent);
      } else {
        Alert.alert('Empty Clipboard', 'Nothing to paste');
      }
    } catch (error) {
      console.error('Failed to paste:', error);
      Alert.alert('Error', 'Could not read clipboard');
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!hasContent) return;

    setLoading(true);
    try {
      await db.init();
      const rawDb = db.getRawDb();

      const itemId = uuidv4();
      const content = text.trim();
      const isUrlType = contentType === 'url' || contentType === 'urls';
      const urls = isUrlType ? extractUrls(content) : [];

      // Prepare initial title (will be updated by job with fetched content)
      let title: string;
      if (urls.length > 1) {
        title = `${urls.length} Links`;
      } else if (urls.length === 1) {
        title = extractTitleFromUrl(normalizeUrl(urls[0]));
      } else {
        title = extractTitleFromText(content);
      }

      // For URL entries, store all URLs in metadata
      // The job will fetch actual content and update title/tags
      const metadata: Record<string, any> = {
        source: 'scratch',
        captured_at: Date.now(),
      };

      if (urls.length > 0) {
        metadata.urls = urls;
        metadata.pendingUrlFetch = true; // Flag for job to fetch content
      }

      // Create media item directly via repository
      await repos.createMediaItem(rawDb, {
        id: itemId,
        type: isUrlType ? 'url' : 'text',
        title,
        source_url: urls.length === 1 ? normalizeUrl(urls[0]) : (urls.length > 1 ? urls[0] : null),
        extracted_text: isUrlType ? (urls.length > 1 ? urls.join('\n') : null) : content,
        notes: null,
        local_uri: null,
        metadata_json: JSON.stringify(metadata),
      });

      // Enqueue a job for normalization and tagging (will fetch URL content)
      const jobId = uuidv4();
      await repos.createJob(rawDb, {
        id: jobId,
        kind: 'normalize_and_tag',
        payload_json: JSON.stringify({
          itemId,
          fetchUrlContent: urls.length > 0, // Signal to fetch URL metadata
        }),
      });

      // Start job runner to process the job (if not already running)
      if (!isJobRunnerActive()) {
        registerAllJobHandlers();
        await startJobRunner();
      }

      // Success feedback
      const typeLabel = urls.length > 1 ? `${urls.length} Links` : (urls.length === 1 ? 'Link' : 'Note');
      Alert.alert(
        'Saved!',
        `${typeLabel} captured. Fetching content and generating tags...`,
        [
          { text: 'Add Another', onPress: () => setText('') },
          { text: 'View Library', onPress: () => router.push('/(tabs)/library') },
        ]
      );

      setText('');
    } catch (error: any) {
      console.error('Failed to save:', error);
      Alert.alert('Error', `Failed to save: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [text, hasContent, contentType]);

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Scratch" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <TextInput
            mode="outlined"
            multiline
            numberOfLines={10}
            placeholder="Paste a link or jot down a thought..."
            value={text}
            onChangeText={setText}
            style={styles.textInput}
            textAlignVertical="top"
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            autoFocus
          />

          {hasContent && (
            <HelperText type="info" style={styles.typeIndicator}>
              <Sparkles size={12} color={theme.colors.primary} />
              {' '}Detected: {contentType === 'urls' ? `${countUrls(text)} Links` : contentType === 'url' ? 'Link' : 'Note'}
            </HelperText>
          )}
        </View>

        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={handlePaste}
            style={styles.actionButton}
            icon={() => <ClipboardIcon size={20} color={theme.colors.primary} />}
          >
            Paste
          </Button>

          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={loading || !hasContent}
            style={[styles.actionButton, styles.saveButton]}
            icon={() => <Save size={20} color={theme.colors.onPrimary} />}
          >
            Save
          </Button>
        </View>

        <Divider style={styles.divider} />

        <Button
          mode="outlined"
          onPress={handleMassUpload}
          loading={uploading}
          disabled={uploading}
          style={styles.uploadButton}
          icon={() => <Upload size={20} color={theme.colors.secondary} />}
          textColor={theme.colors.secondary}
        >
          Import Files
        </Button>

        <Text style={styles.hint}>
          Quick capture for links and notes.{'\n'}
          Use Import Files for photos, PDFs, audio, and video.
        </Text>
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
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    flex: 1,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    fontSize: 16,
  },
  typeIndicator: {
    color: theme.colors.primary,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
  divider: {
    marginVertical: 12,
    backgroundColor: theme.colors.outline,
  },
  uploadButton: {
    marginBottom: 16,
    borderColor: theme.colors.secondary,
  },
  hint: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    paddingBottom: 16,
  },
});

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Appbar, Text, Switch, List, Card, Button, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSettingsStore } from '@/lib/store';
import { theme } from '@/lib/theme';
import { db } from '@/lib/storage/db';

interface HealthStats {
  dbStatus: string;
  mediaItemCount: number;
  tagCount: number;
  entryCount: number;
}

export default function SettingsScreen() {
  const {
    darkMode,
    bleEnabled,
    qrFallback,
    setDarkMode,
    setBleEnabled,
    setQrFallback
  } = useSettingsStore();

  const [healthStats, setHealthStats] = useState<HealthStats>({
    dbStatus: 'Checking...',
    mediaItemCount: 0,
    tagCount: 0,
    entryCount: 0,
  });

  // Snackbar state for web-compatible feedback
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const loadHealthStats = async () => {
    try {
      const items = await db.listMediaItems();
      const tags = await db.listTags();
      // For entries, we'll count journal_entries table if needed
      // For now, just use media items as a proxy
      setHealthStats({
        dbStatus: 'Connected',
        mediaItemCount: items.length,
        tagCount: tags.length,
        entryCount: items.length, // Could be different if journal_entries is separate
      });
    } catch (error) {
      setHealthStats({
        dbStatus: 'Error: ' + (error as Error).message,
        mediaItemCount: 0,
        tagCount: 0,
        entryCount: 0,
      });
    }
  };

  useEffect(() => {
    loadHealthStats();
  }, []);

  const buildMode = __DEV__ ? 'Development' : 'Production';

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Settings" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Appearance
            </Text>
            <List.Item
              title="Dark Mode"
              description="Use dark theme for better night viewing"
              left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
              right={() => (
                <Switch
                  value={darkMode}
                  onValueChange={(value) => {
                    setDarkMode(value);
                    showSnackbar(`Switched to ${value ? 'dark' : 'light'} mode`);
                  }}
                />
              )}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Sync Options
            </Text>
            <List.Item
              title="Bluetooth Sync"
              description="Enable Bluetooth for device-to-device sync"
              left={(props) => <List.Icon {...props} icon="bluetooth" />}
              right={() => (
                <Switch
                  value={bleEnabled}
                  onValueChange={(value) => {
                    setBleEnabled(value);
                    showSnackbar(
                      value
                        ? 'Bluetooth sync enabled'
                        : 'Bluetooth sync disabled'
                    );
                  }}
                />
              )}
            />
            <List.Item
              title="QR Code Fallback"
              description="Use QR codes when Bluetooth is unavailable"
              left={(props) => <List.Icon {...props} icon="qrcode" />}
              right={() => (
                <Switch
                  value={qrFallback}
                  onValueChange={(value) => {
                    setQrFallback(value);
                    showSnackbar(
                      value
                        ? 'QR code fallback enabled'
                        : 'QR code fallback disabled'
                    );
                  }}
                />
              )}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              About JournalLink
            </Text>
            <Text style={styles.aboutText}>
              JournalLink helps you connect with others through shared experiences and interests 
              discovered in your personal journals. All data is stored locally and encrypted 
              for your privacy.
            </Text>
            <View style={styles.versionContainer}>
              <Text style={styles.versionText}>Version 1.0.0 MVP</Text>
              <Text style={styles.versionSubtext}>
                AI embeddings and conversation starters are currently using stub implementations.
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Content Management
            </Text>
            <List.Item
              title="Manage Tags"
              description={`${healthStats.tagCount} emergent tags • Rename, merge, delete`}
              left={(props) => <List.Icon {...props} icon="tag-multiple" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/tags')}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              App Health (Debug)
            </Text>
            <List.Item
              title="Database Status"
              description={healthStats.dbStatus}
              left={(props) => <List.Icon {...props} icon="database" />}
            />
            <List.Item
              title="Media Items"
              description={`${healthStats.mediaItemCount} items in vault`}
              left={(props) => <List.Icon {...props} icon="file-multiple" />}
            />
            <List.Item
              title="Tags"
              description={`${healthStats.tagCount} unique tags`}
              left={(props) => <List.Icon {...props} icon="tag-multiple" />}
            />
            <List.Item
              title="Build Mode"
              description={buildMode}
              left={(props) => <List.Icon {...props} icon="cog" />}
            />
            <Button
              mode="outlined"
              onPress={loadHealthStats}
              style={{ marginTop: 8 }}
            >
              Refresh Stats
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Future Features
            </Text>
            <List.Item
              title="Image Support"
              description="Add photos to your journal entries"
              left={(props) => <List.Icon {...props} icon="camera" />}
              right={() => <Text style={styles.comingSoon}>Coming Soon</Text>}
            />
            <List.Item
              title="Audio Notes"
              description="Record voice memos and transcriptions"
              left={(props) => <List.Icon {...props} icon="microphone" />}
              right={() => <Text style={styles.comingSoon}>Coming Soon</Text>}
            />
            <List.Item
              title="Advanced AI"
              description="Better embeddings and smart clustering"
              left={(props) => <List.Icon {...props} icon="brain" />}
              right={() => <Text style={styles.comingSoon}>Coming Soon</Text>}
            />
          </Card.Content>
        </Card>
      </ScrollView>

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
    marginBottom: 8,
    fontWeight: '500',
  },
  aboutText: {
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 16,
  },
  versionContainer: {
    alignItems: 'center',
  },
  versionText: {
    color: theme.colors.onSurface,
    fontWeight: '500',
    marginBottom: 4,
  },
  versionSubtext: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    textAlign: 'center',
  },
  comingSoon: {
    color: theme.colors.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  snackbar: {
    backgroundColor: theme.colors.inverseSurface,
  },
});
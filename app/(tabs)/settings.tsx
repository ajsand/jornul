import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, Text, Switch, List, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '@/lib/store';
import { theme } from '@/lib/theme';

export default function SettingsScreen() {
  const { 
    darkMode, 
    bleEnabled, 
    qrFallback, 
    setDarkMode, 
    setBleEnabled, 
    setQrFallback 
  } = useSettingsStore();

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Settings" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <View style={styles.content}>
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
                    // Show feedback to user
                    Alert.alert('Theme Updated', `Switched to ${value ? 'dark' : 'light'} mode`);
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
                    Alert.alert(
                      'Bluetooth Sync', 
                      value 
                        ? 'Bluetooth sync is now enabled. You can connect with nearby devices.' 
                        : 'Bluetooth sync has been disabled.'
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
                    Alert.alert(
                      'QR Fallback', 
                      value 
                        ? 'QR code fallback is now enabled for when Bluetooth is unavailable.' 
                        : 'QR code fallback has been disabled.'
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
});
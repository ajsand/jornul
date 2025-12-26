import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Appbar, Text, Button, Card, List, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bluetooth, QrCode, Wifi } from 'lucide-react-native';
import { InsightCard } from '@/components/InsightCard';
import { useSyncStore, useSettingsStore } from '@/lib/store';
import { BLEManager } from '@/lib/sync/ble';
import { buildSignature, compare } from '@/lib/sync/signatures';
import { theme } from '@/lib/theme';

let bleManager: BLEManager | null = null;

export default function SyncScreen() {
  const {
    isAdvertising,
    isScanning,
    discoveredDevices,
    currentSync,
    setAdvertising,
    setScanning,
    addDiscoveredDevice,
    setSyncResult,
    clearSync,
  } = useSyncStore();

  const { bleEnabled, qrFallback } = useSettingsStore();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    initializeBLE();
    return () => {
      if (bleManager) {
        bleManager.destroy();
        bleManager = null;
      }
    };
  }, []);

  const initializeBLE = async () => {
    try {
      // For MVP, skip actual BLE initialization to avoid permission issues
      console.log('BLE initialization skipped for MVP');
      setInitializing(false);
    } catch (error) {
      console.error('Failed to initialize BLE:', error);
      setInitializing(false);
    }
  };

  const startAdvertising = async () => {
    try {
      // Mock advertising for MVP
      console.log('Mock advertising started');
      setAdvertising(true);
      
      // Show success message
      Alert.alert('Success', 'Your device is now visible to others nearby for syncing.');
    } catch (error) {
      console.error('Failed to start advertising:', error);
      Alert.alert('Error', 'Failed to start advertising. Please try again.');
    }
  };

  const stopAdvertising = async () => {
    try {
      console.log('Mock advertising stopped');
      setAdvertising(false);
    } catch (error) {
      console.error('Failed to stop advertising:', error);
    }
  };

  const startScanning = async () => {
    try {
      // Mock scanning for MVP
      console.log('Mock scanning started');
      setScanning(true);
      
      // Add mock devices after a delay
      setTimeout(() => {
        addDiscoveredDevice({
          id: 'mock-device-1',
          name: 'JournalLink User (Alex)',
        });
        
        setTimeout(() => {
          addDiscoveredDevice({
            id: 'mock-device-2',
            name: 'JournalLink User (Sam)',
          });
        }, 2000);
      }, 1500);
    } catch (error) {
      console.error('Failed to start scanning:', error);
      Alert.alert('Error', 'Failed to start scanning. Please try again.');
    }
  };

  const stopScanning = async () => {
    try {
      console.log('Mock scanning stopped');
      setScanning(false);
    } catch (error) {
      console.error('Failed to stop scanning:', error);
    }
  };

  const connectToDevice = async (deviceId: string) => {
    try {
      const device = discoveredDevices.find(d => d.id === deviceId);
      if (!device) return;

      // Mock sync result for MVP
      const mockResult = {
        sharedTags: ['travel', 'food', 'books'],
        similarityScore: Math.floor(Math.random() * 60) + 40, // 40-100%
        questions: [
          "What's the most interesting place you've written about recently?",
          "If you could have dinner with anyone you've mentioned in your journal, who would it be?",
          "What's a book, movie, or show that's influenced your recent thoughts?"
        ]
      };
      
      setSyncResult(device, mockResult);
      await stopScanning();
      
      Alert.alert('Connected!', `Successfully synced with ${device.name}`);
    } catch (error) {
      console.error('Failed to connect to device:', error);
      Alert.alert('Connection Error', 'Failed to connect to the device. Please try again.');
    }
  };

  const handleQRSync = () => {
    Alert.alert(
      'QR Sync Coming Soon', 
      'QR code sync will allow you to share your journal signature when Bluetooth is unavailable. This feature will be available in the next update.',
      [{ text: 'OK' }]
    );
  };

  const resetSync = () => {
    clearSync();
    console.log('Sync reset');
  };

  if (initializing) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.Content title="Sync" titleStyle={styles.headerTitle} />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Initializing Bluetooth...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Sync" titleStyle={styles.headerTitle} />
        {(isAdvertising || isScanning || currentSync.result) && (
          <Appbar.Action icon="close" onPress={resetSync} />
        )}
      </Appbar.Header>

      <View style={styles.content}>
        {currentSync.result ? (
          <InsightCard 
            result={currentSync.result} 
            deviceName={currentSync.device?.name || 'Unknown Device'}
          />
        ) : (
          <>
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="headlineSmall" style={styles.cardTitle}>
                  Connect with Others
                </Text>
                <Text style={styles.cardDescription}>
                  Share your journal insights with people nearby and discover common interests.
                </Text>
              </Card.Content>
            </Card>

            {bleEnabled && (
              <Card style={styles.card}>
                <Card.Content>
                  <View style={styles.sectionHeader}>
                    <Bluetooth size={24} color={theme.colors.primary} />
                    <Text variant="titleLarge" style={styles.sectionTitle}>
                      Bluetooth Sync
                    </Text>
                  </View>

                  <View style={styles.buttonRow}>
                    <Button
                      mode={isAdvertising ? "contained" : "outlined"}
                      onPress={isAdvertising ? stopAdvertising : startAdvertising}
                      style={styles.button}
                      loading={isAdvertising}
                      disabled={isScanning}
                    >
                      {isAdvertising ? 'Stop Hosting' : 'Start Hosting'}
                    </Button>
                    
                    <Button
                      mode={isScanning ? "contained" : "outlined"}
                      onPress={isScanning ? stopScanning : startScanning}
                      style={styles.button}
                      loading={isScanning}
                      disabled={isAdvertising}
                    >
                      {isScanning ? 'Stop Scanning' : 'Scan for Devices'}
                    </Button>
                  </View>

                  {isAdvertising && (
                    <Text style={styles.statusText}>
                      Your device is visible to others nearby
                    </Text>
                  )}

                  {isScanning && (
                    <Text style={styles.statusText}>
                      Scanning for nearby devices...
                    </Text>
                  )}

                  {discoveredDevices.length > 0 && (
                    <View style={styles.devicesList}>
                      <Text variant="titleMedium" style={styles.devicesTitle}>
                        Discovered Devices
                      </Text>
                      {discoveredDevices.map((device) => (
                        <List.Item
                          key={device.id}
                          title={device.name}
                          description={`ID: ${device.id.slice(0, 8)}...`}
                          left={(props) => <List.Icon {...props} icon="bluetooth" />}
                          right={(props) => (
                            <Button
                              mode="contained"
                              compact
                              onPress={() => connectToDevice(device.id)}
                            >
                              Connect
                            </Button>
                          )}
                          style={styles.deviceItem}
                        />
                      ))}
                    </View>
                  )}
                </Card.Content>
              </Card>
            )}

            {qrFallback && (
              <Card style={styles.card}>
                <Card.Content>
                  <View style={styles.sectionHeader}>
                    <QrCode size={24} color={theme.colors.secondary} />
                    <Text variant="titleLarge" style={styles.sectionTitle}>
                      QR Code Backup
                    </Text>
                  </View>
                  <Text style={styles.sectionDescription}>
                    Use QR codes when Bluetooth isn't available
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={handleQRSync}
                    style={styles.qrButton}
                    icon={() => <QrCode size={20} color={theme.colors.secondary} />}
                  >
                    Generate QR Code
                  </Button>
                </Card.Content>
              </Card>
            )}
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.onSurface,
  },
  card: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  cardTitle: {
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: 8,
  },
  cardDescription: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    color: theme.colors.onSurface,
    marginLeft: 12,
    flex: 1,
  },
  sectionDescription: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
  },
  qrButton: {
    borderColor: theme.colors.secondary,
  },
  statusText: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  devicesList: {
    marginTop: 16,
  },
  devicesTitle: {
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  deviceItem: {
    backgroundColor: theme.colors.surfaceVariant,
    marginBottom: 4,
    borderRadius: 8,
  },
});
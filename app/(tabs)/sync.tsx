import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, ScrollView, Modal, Dimensions } from 'react-native';
import {
  Appbar,
  Text,
  Button,
  Card,
  List,
  ActivityIndicator,
  Portal,
  Dialog,
  Chip,
  IconButton,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bluetooth,
  QrCode,
  Camera,
  Clock,
  Check,
  X,
  Users,
  Heart,
  Star,
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { BarCodeScanner, BarCodeScannerResult } from 'expo-barcode-scanner';
import { v4 as uuidv4 } from 'uuid';

import { InsightCard } from '@/components/InsightCard';
import { useSyncStore, useSettingsStore } from '@/lib/store';
import { BLEManager } from '@/lib/sync/ble';
import {
  buildSignature,
  compare,
  compressSignature,
  decompressSignature,
  isValidSignature,
} from '@/lib/sync/signatures';
import { DeviceSignature, PendingSession } from '@/lib/sync/types';
import { db } from '@/lib/storage/db';
import * as repos from '@/lib/storage/repositories';
import { theme } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const QR_SIZE = SCREEN_WIDTH - 100;

let bleManager: BLEManager | null = null;

export default function SyncScreen() {
  const {
    isAdvertising,
    isScanning,
    discoveredDevices,
    currentSync,
    pendingSessions,
    showQrModal,
    showScanModal,
    setAdvertising,
    setScanning,
    addDiscoveredDevice,
    setSyncResult,
    clearSync,
    setPendingSessions,
    addPendingSession,
    updatePendingSessionStatus,
    removePendingSession,
    setShowQrModal,
    setShowScanModal,
  } = useSyncStore();

  const { bleEnabled } = useSettingsStore();
  const [initializing, setInitializing] = useState(true);
  const [signature, setSignature] = useState<DeviceSignature | null>(null);
  const [qrValue, setQrValue] = useState<string>('');
  const [generatingQr, setGeneratingQr] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  // Load pending sessions from database
  const loadPendingSessions = useCallback(async () => {
    try {
      await db.init();
      const rawDb = db.getRawDb();
      const sessions = await repos.listPendingSessions(rawDb);
      setPendingSessions(sessions);
    } catch (error) {
      console.error('Failed to load pending sessions:', error);
    }
  }, [setPendingSessions]);

  useEffect(() => {
    initializeBLE();
    loadPendingSessions();
    return () => {
      if (bleManager) {
        bleManager.destroy();
        bleManager = null;
      }
    };
  }, [loadPendingSessions]);

  const initializeBLE = async () => {
    try {
      console.log('BLE initialization skipped for MVP');
      setInitializing(false);
    } catch (error) {
      console.error('Failed to initialize BLE:', error);
      setInitializing(false);
    }
  };

  // ========== QR Code Generation ==========

  const generateQRCode = async () => {
    setGeneratingQr(true);
    try {
      const sig = await buildSignature();
      setSignature(sig);
      const compressed = compressSignature(sig);
      setQrValue(compressed);
      setShowQrModal(true);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      Alert.alert('Error', 'Failed to generate QR code. Please try again.');
    } finally {
      setGeneratingQr(false);
    }
  };

  // ========== QR Code Scanning ==========

  const requestCameraPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasCameraPermission(status === 'granted');
    return status === 'granted';
  };

  const openScanner = async () => {
    const hasPermission = hasCameraPermission ?? (await requestCameraPermission());
    if (!hasPermission) {
      Alert.alert(
        'Camera Permission Required',
        'Please grant camera access to scan QR codes.',
        [{ text: 'OK' }]
      );
      return;
    }
    setScanned(false);
    setShowScanModal(true);
  };

  const handleBarCodeScanned = async ({ data }: BarCodeScannerResult) => {
    if (scanned) return;
    setScanned(true);

    try {
      // Parse the scanned signature
      const importedSig = decompressSignature(data);

      if (!isValidSignature(importedSig)) {
        Alert.alert('Invalid QR Code', 'This QR code does not contain a valid signature.');
        setShowScanModal(false);
        return;
      }

      // Check if we already have a pending session for this device
      await db.init();
      const rawDb = db.getRawDb();
      const exists = await repos.hasPendingSessionForDevice(rawDb, importedSig.deviceId);

      if (exists) {
        Alert.alert(
          'Already Connected',
          'You already have a pending session with this device.',
          [{ text: 'OK' }]
        );
        setShowScanModal(false);
        return;
      }

      // Create pending session
      const sessionId = uuidv4();
      const newSession: PendingSession = {
        id: sessionId,
        deviceId: importedSig.deviceId,
        importedSignature: importedSig,
        importedAt: Date.now(),
        status: 'awaiting_consent',
      };

      await repos.insertPendingSession(rawDb, {
        id: sessionId,
        deviceId: importedSig.deviceId,
        signature: importedSig,
      });

      addPendingSession(newSession);
      setShowScanModal(false);

      Alert.alert(
        'Signature Imported!',
        'The signature has been saved. Review it in the Pending Sessions section.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to process scanned QR code:', error);
      Alert.alert('Error', 'Failed to process the QR code. Please try again.');
      setShowScanModal(false);
    }
  };

  // ========== Pending Session Actions ==========

  const handleAcceptSession = async (session: PendingSession) => {
    try {
      await db.init();
      const rawDb = db.getRawDb();
      await repos.updatePendingSessionStatus(rawDb, session.id, 'accepted');
      updatePendingSessionStatus(session.id, 'accepted');

      // Compare signatures and show result
      if (signature) {
        const result = compare(signature, session.importedSignature);
        Alert.alert(
          'Session Accepted',
          `You share ${result.sharedTags.length} interests with this person!`
        );
      } else {
        Alert.alert('Session Accepted', 'The session has been accepted.');
      }
    } catch (error) {
      console.error('Failed to accept session:', error);
      Alert.alert('Error', 'Failed to accept session. Please try again.');
    }
  };

  const handleRejectSession = async (session: PendingSession) => {
    try {
      await db.init();
      const rawDb = db.getRawDb();
      await repos.updatePendingSessionStatus(rawDb, session.id, 'rejected');
      updatePendingSessionStatus(session.id, 'rejected');
    } catch (error) {
      console.error('Failed to reject session:', error);
      Alert.alert('Error', 'Failed to reject session. Please try again.');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await db.init();
      const rawDb = db.getRawDb();
      await repos.deletePendingSession(rawDb, sessionId);
      removePendingSession(sessionId);
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  // ========== Bluetooth (existing) ==========

  const startAdvertising = async () => {
    try {
      console.log('Mock advertising started');
      setAdvertising(true);
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
      console.log('Mock scanning started');
      setScanning(true);
      setTimeout(() => {
        addDiscoveredDevice({ id: 'mock-device-1', name: 'JournalLink User (Alex)' });
        setTimeout(() => {
          addDiscoveredDevice({ id: 'mock-device-2', name: 'JournalLink User (Sam)' });
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
      const device = discoveredDevices.find((d) => d.id === deviceId);
      if (!device) return;

      const mockResult = {
        sharedTags: ['travel', 'food', 'books'],
        similarityScore: Math.floor(Math.random() * 60) + 40,
        questions: [
          "What's the most interesting place you've written about recently?",
          "If you could have dinner with anyone you've mentioned in your journal, who would it be?",
          "What's a book, movie, or show that's influenced your recent thoughts?",
        ],
      };

      setSyncResult(device, mockResult);
      await stopScanning();
      Alert.alert('Connected!', `Successfully synced with ${device.name}`);
    } catch (error) {
      console.error('Failed to connect to device:', error);
      Alert.alert('Connection Error', 'Failed to connect to the device. Please try again.');
    }
  };

  const resetSync = () => {
    clearSync();
    console.log('Sync reset');
  };

  // ========== Render ==========

  if (initializing) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.Content title="Sync" titleStyle={styles.headerTitle} />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Initializing...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const awaitingConsentSessions = pendingSessions.filter((s) => s.status === 'awaiting_consent');

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Sync" titleStyle={styles.headerTitle} />
        {(isAdvertising || isScanning || currentSync.result) && (
          <Appbar.Action icon="close" onPress={resetSync} />
        )}
      </Appbar.Header>

      <ScrollView style={styles.content}>
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

            {/* QR Code Section */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.sectionHeader}>
                  <QrCode size={24} color={theme.colors.primary} />
                  <Text variant="titleLarge" style={styles.sectionTitle}>
                    QR Code Exchange
                  </Text>
                </View>
                <Text style={styles.sectionDescription}>
                  Share your signature via QR code for quick in-person sync
                </Text>
                <View style={styles.buttonRow}>
                  <Button
                    mode="contained"
                    onPress={generateQRCode}
                    style={styles.button}
                    loading={generatingQr}
                    icon={() => <QrCode size={18} color="#fff" />}
                  >
                    Show My QR
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={openScanner}
                    style={styles.button}
                    icon={() => <Camera size={18} color={theme.colors.primary} />}
                  >
                    Scan QR
                  </Button>
                </View>
              </Card.Content>
            </Card>

            {/* Pending Sessions */}
            {awaitingConsentSessions.length > 0 && (
              <Card style={styles.card}>
                <Card.Content>
                  <View style={styles.sectionHeader}>
                    <Users size={24} color={theme.colors.tertiary} />
                    <Text variant="titleLarge" style={styles.sectionTitle}>
                      Pending Sessions
                    </Text>
                    <Chip compact style={styles.badge}>
                      {awaitingConsentSessions.length}
                    </Chip>
                  </View>

                  {awaitingConsentSessions.map((session) => (
                    <PendingSessionItem
                      key={session.id}
                      session={session}
                      onAccept={() => handleAcceptSession(session)}
                      onReject={() => handleRejectSession(session)}
                      onDelete={() => handleDeleteSession(session.id)}
                    />
                  ))}
                </Card.Content>
              </Card>
            )}

            {/* Bluetooth Section */}
            {bleEnabled && (
              <Card style={styles.card}>
                <Card.Content>
                  <View style={styles.sectionHeader}>
                    <Bluetooth size={24} color={theme.colors.secondary} />
                    <Text variant="titleLarge" style={styles.sectionTitle}>
                      Bluetooth Sync
                    </Text>
                  </View>

                  <View style={styles.buttonRow}>
                    <Button
                      mode={isAdvertising ? 'contained' : 'outlined'}
                      onPress={isAdvertising ? stopAdvertising : startAdvertising}
                      style={styles.button}
                      loading={isAdvertising}
                      disabled={isScanning}
                    >
                      {isAdvertising ? 'Stop Hosting' : 'Start Hosting'}
                    </Button>

                    <Button
                      mode={isScanning ? 'contained' : 'outlined'}
                      onPress={isScanning ? stopScanning : startScanning}
                      style={styles.button}
                      loading={isScanning}
                      disabled={isAdvertising}
                    >
                      {isScanning ? 'Stop Scanning' : 'Scan'}
                    </Button>
                  </View>

                  {isAdvertising && (
                    <Text style={styles.statusText}>Your device is visible to others nearby</Text>
                  )}

                  {isScanning && (
                    <Text style={styles.statusText}>Scanning for nearby devices...</Text>
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
                          right={() => (
                            <Button mode="contained" compact onPress={() => connectToDevice(device.id)}>
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
          </>
        )}
      </ScrollView>

      {/* QR Code Modal */}
      <Portal>
        <Dialog visible={showQrModal} onDismiss={() => setShowQrModal(false)} style={styles.qrDialog}>
          <Dialog.Title style={styles.dialogTitle}>Your Signature QR</Dialog.Title>
          <Dialog.Content style={styles.qrDialogContent}>
            {qrValue ? (
              <>
                <View style={styles.qrContainer}>
                  <QRCode value={qrValue} size={QR_SIZE} backgroundColor="white" color="black" />
                </View>
                {signature && (
                  <View style={styles.signatureInfo}>
                    <Text style={styles.signatureLabel}>What&apos;s shared:</Text>
                    <View style={styles.signatureStats}>
                      <View style={styles.statItem}>
                        <Heart size={16} color="#4CAF50" />
                        <Text style={styles.statText}>{signature.swipeSummary.totalLikes} likes</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Star size={16} color="#FFD700" />
                        <Text style={styles.statText}>
                          {signature.swipeSummary.totalFavorites} favorites
                        </Text>
                      </View>
                    </View>
                    <View style={styles.topicsContainer}>
                      <Text style={styles.topicsLabel}>Top interests:</Text>
                      <View style={styles.topicChips}>
                        {signature.topTags.slice(0, 5).map((tag) => (
                          <Chip key={tag} compact style={styles.topicChip}>
                            {tag}
                          </Chip>
                        ))}
                      </View>
                    </View>
                  </View>
                )}
              </>
            ) : (
              <ActivityIndicator size="large" />
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowQrModal(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* QR Scanner Modal */}
      <Modal visible={showScanModal} animationType="slide" onRequestClose={() => setShowScanModal(false)}>
        <SafeAreaView style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <Text variant="titleLarge" style={styles.scannerTitle}>
              Scan QR Code
            </Text>
            <IconButton
              icon={() => <X size={24} color={theme.colors.onSurface} />}
              onPress={() => setShowScanModal(false)}
            />
          </View>
          <View style={styles.scannerContent}>
            <BarCodeScanner
              onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
              style={styles.scanner}
              barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
            />
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerFrame} />
            </View>
          </View>
          <Text style={styles.scannerHint}>Point your camera at a JournalLink QR code</Text>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ========== Pending Session Item Component ==========

interface PendingSessionItemProps {
  session: PendingSession;
  onAccept: () => void;
  onReject: () => void;
  onDelete: () => void;
}

function PendingSessionItem({ session, onAccept, onReject, onDelete }: PendingSessionItemProps) {
  const sig = session.importedSignature;
  const importedDate = new Date(session.importedAt);
  const timeAgo = getTimeAgo(importedDate);

  return (
    <View style={styles.pendingSession}>
      <View style={styles.pendingSessionHeader}>
        <View style={styles.pendingSessionInfo}>
          <Text variant="titleSmall" style={styles.pendingDeviceId}>
            Device: {sig.deviceId.slice(0, 8)}...
          </Text>
          <View style={styles.pendingTimeRow}>
            <Clock size={12} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.pendingTime}>{timeAgo}</Text>
          </View>
        </View>
        <Chip compact mode="outlined" style={styles.awaitingChip}>
          Awaiting consent
        </Chip>
      </View>

      <View style={styles.pendingSignaturePreview}>
        <View style={styles.pendingStats}>
          <Text style={styles.pendingStatLabel}>
            {sig.swipeSummary.totalLikes + sig.swipeSummary.totalFavorites} interests
          </Text>
          <Text style={styles.pendingStatLabel}>{sig.topTags.length} topics</Text>
        </View>
        {sig.topTags.length > 0 && (
          <View style={styles.pendingTags}>
            {sig.topTags.slice(0, 3).map((tag) => (
              <Chip key={tag} compact style={styles.pendingTagChip} textStyle={styles.pendingTagText}>
                {tag}
              </Chip>
            ))}
            {sig.topTags.length > 3 && (
              <Text style={styles.moreTags}>+{sig.topTags.length - 3} more</Text>
            )}
          </View>
        )}
      </View>

      <Divider style={styles.pendingDivider} />

      <View style={styles.pendingActions}>
        <Button
          mode="contained"
          compact
          onPress={onAccept}
          style={styles.acceptButton}
          icon={() => <Check size={16} color="#fff" />}
        >
          Accept
        </Button>
        <Button
          mode="outlined"
          compact
          onPress={onReject}
          style={styles.rejectButton}
          icon={() => <X size={16} color={theme.colors.error} />}
        >
          Reject
        </Button>
        <IconButton
          icon="delete-outline"
          size={20}
          onPress={onDelete}
          style={styles.deleteButton}
        />
      </View>
    </View>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
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
    marginBottom: 8,
  },
  button: {
    flex: 1,
  },
  badge: {
    backgroundColor: theme.colors.primaryContainer,
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
  // QR Dialog
  qrDialog: {
    maxWidth: 400,
    alignSelf: 'center',
  },
  dialogTitle: {
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  qrDialogContent: {
    alignItems: 'center',
  },
  qrContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
  },
  signatureInfo: {
    width: '100%',
    padding: 12,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
  },
  signatureLabel: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    marginBottom: 8,
  },
  signatureStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: theme.colors.onSurface,
    fontSize: 14,
  },
  topicsContainer: {
    marginTop: 8,
  },
  topicsLabel: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    marginBottom: 6,
  },
  topicChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  topicChip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  // Scanner
  scannerContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
  },
  scannerTitle: {
    color: theme.colors.onSurface,
  },
  scannerContent: {
    flex: 1,
    position: 'relative',
  },
  scanner: {
    ...StyleSheet.absoluteFillObject,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scannerHint: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    padding: 16,
    backgroundColor: theme.colors.surface,
  },
  // Pending Sessions
  pendingSession: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  pendingSessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  pendingSessionInfo: {
    flex: 1,
  },
  pendingDeviceId: {
    color: theme.colors.onSurface,
  },
  pendingTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  pendingTime: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  awaitingChip: {
    backgroundColor: theme.colors.tertiaryContainer,
  },
  pendingSignaturePreview: {
    marginBottom: 8,
  },
  pendingStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  pendingStatLabel: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 13,
  },
  pendingTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  pendingTagChip: {
    backgroundColor: theme.colors.surface,
    height: 24,
  },
  pendingTagText: {
    fontSize: 11,
  },
  moreTags: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    fontStyle: 'italic',
  },
  pendingDivider: {
    marginVertical: 8,
  },
  pendingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    flex: 1,
    borderColor: theme.colors.error,
  },
  deleteButton: {
    margin: 0,
  },
});

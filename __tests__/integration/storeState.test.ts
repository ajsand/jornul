/**
 * Integration tests for Zustand Store State Management
 * Tests the store layer for Journal, Sync, and Settings
 */

import { useJournalStore, useSyncStore, useSettingsStore } from '@/lib/store';
import { JournalItem } from '@/lib/storage/db';

// Mock types that match the store's expected types
interface MockTag {
  id: number;
  name: string;
  slug: string | null;
  kind: string;
  created_at: number;
  updated_at: number | null;
  confidence: number | null;
  source: string;
}

function makeTag(name: string, id = 0): MockTag {
  return { id, name, slug: name, kind: 'manual', created_at: 0, updated_at: null, confidence: null, source: 'user' };
}

interface MockJournalItem {
  id: string;
  type: string;
  title: string | null;
  tags: MockTag[];
  created_at: number;
}

describe('Store State Management', () => {
  describe('Journal Store', () => {
    beforeEach(() => {
      // Reset store to initial state
      useJournalStore.setState({
        items: [],
        selectedTags: [],
      });
    });

    it('should set items', () => {
      const items: MockJournalItem[] = [
        { id: '1', type: 'text', title: 'Note 1', tags: [makeTag('work')], created_at: Date.now() },
        { id: '2', type: 'url', title: 'Link 1', tags: [makeTag('tech')], created_at: Date.now() },
      ];

      useJournalStore.getState().setItems(items as any);

      const state = useJournalStore.getState();
      expect(state.items).toHaveLength(2);
      expect(state.items[0].id).toBe('1');
    });

    it('should add item to beginning', () => {
      const initialItems: MockJournalItem[] = [
        { id: '1', type: 'text', title: 'Old Note', tags: [], created_at: Date.now() - 1000 },
      ];
      useJournalStore.setState({ items: initialItems as any });

      const newItem: MockJournalItem = {
        id: '2',
        type: 'text',
        title: 'New Note',
        tags: [] as MockTag[],
        created_at: Date.now(),
      };
      useJournalStore.getState().addItem(newItem as any);

      const state = useJournalStore.getState();
      expect(state.items).toHaveLength(2);
      expect(state.items[0].id).toBe('2'); // New item at beginning
    });

    it('should remove item by id', () => {
      const items: MockJournalItem[] = [
        { id: '1', type: 'text', title: 'Note 1', tags: [] as MockTag[], created_at: Date.now() },
        { id: '2', type: 'text', title: 'Note 2', tags: [] as MockTag[], created_at: Date.now() },
      ];
      useJournalStore.setState({ items: items as any });

      useJournalStore.getState().removeItem('1');

      const state = useJournalStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].id).toBe('2');
    });

    it('should filter items by selected tags', () => {
      const items: MockJournalItem[] = [
        { id: '1', type: 'text', title: 'Work Note', tags: [makeTag('work'), makeTag('important')], created_at: Date.now() },
        { id: '2', type: 'text', title: 'Personal Note', tags: [makeTag('personal')], created_at: Date.now() },
        { id: '3', type: 'url', title: 'Tech Article', tags: [makeTag('tech'), makeTag('work')], created_at: Date.now() },
      ];
      useJournalStore.setState({ items: items as any });

      // Set filter to 'work' tag
      useJournalStore.getState().setSelectedTags(['work']);

      const filtered = useJournalStore.getState().filteredItems();
      expect(filtered).toHaveLength(2);
      expect(filtered.every(item => item.tags.some(t => t.name === 'work'))).toBe(true);
    });

    it('should return all items when no tags selected', () => {
      const items: MockJournalItem[] = [
        { id: '1', type: 'text', title: 'Note 1', tags: [makeTag('a')], created_at: Date.now() },
        { id: '2', type: 'text', title: 'Note 2', tags: [makeTag('b')], created_at: Date.now() },
      ];
      useJournalStore.setState({ items: items as any, selectedTags: [] });

      const filtered = useJournalStore.getState().filteredItems();
      expect(filtered).toHaveLength(2);
    });
  });

  describe('Settings Store', () => {
    beforeEach(() => {
      // Reset to defaults
      useSettingsStore.setState({
        darkMode: true,
        bleEnabled: true,
        qrFallback: false,
        hasSeenOnboarding: false,
      });
    });

    it('should toggle dark mode', () => {
      expect(useSettingsStore.getState().darkMode).toBe(true);

      useSettingsStore.getState().setDarkMode(false);
      expect(useSettingsStore.getState().darkMode).toBe(false);

      useSettingsStore.getState().setDarkMode(true);
      expect(useSettingsStore.getState().darkMode).toBe(true);
    });

    it('should track onboarding completion', () => {
      expect(useSettingsStore.getState().hasSeenOnboarding).toBe(false);

      useSettingsStore.getState().setHasSeenOnboarding(true);
      expect(useSettingsStore.getState().hasSeenOnboarding).toBe(true);
    });

    it('should toggle BLE and QR settings', () => {
      useSettingsStore.getState().setBleEnabled(false);
      expect(useSettingsStore.getState().bleEnabled).toBe(false);

      useSettingsStore.getState().setQrFallback(true);
      expect(useSettingsStore.getState().qrFallback).toBe(true);
    });
  });

  describe('Sync Store', () => {
    beforeEach(() => {
      useSyncStore.setState({
        isAdvertising: false,
        isScanning: false,
        discoveredDevices: [],
        currentSync: { device: null, result: null },
        pendingSessions: [],
        showQrModal: false,
        showScanModal: false,
        consentSession: {
          pendingSessionId: null,
          config: null,
          capsule: null,
          step: 'idle',
        },
        showConsentModal: false,
        showCapsulePreview: false,
      });
    });

    it('should toggle advertising state', () => {
      useSyncStore.getState().setAdvertising(true);
      expect(useSyncStore.getState().isAdvertising).toBe(true);

      useSyncStore.getState().setAdvertising(false);
      expect(useSyncStore.getState().isAdvertising).toBe(false);
    });

    it('should manage discovered devices', () => {
      const device = { id: 'device-1', name: 'Friend Phone', rssi: -50 };

      useSyncStore.getState().addDiscoveredDevice(device as any);

      const state = useSyncStore.getState();
      expect(state.discoveredDevices).toHaveLength(1);
      expect(state.discoveredDevices[0].id).toBe('device-1');
    });

    it('should deduplicate discovered devices', () => {
      const device = { id: 'device-1', name: 'Friend Phone', rssi: -50 };

      useSyncStore.getState().addDiscoveredDevice(device as any);
      useSyncStore.getState().addDiscoveredDevice({ ...device, rssi: -45 } as any);

      // Should still have only one device (updated)
      const state = useSyncStore.getState();
      expect(state.discoveredDevices).toHaveLength(1);
    });

    it('should manage pending sessions', () => {
      const session = {
        id: 'session-1',
        deviceId: 'device-1',
        importedSignature: { deviceId: 'device-1', topTags: [], swipeSummary: {}, recentTopics: [], timestamp: Date.now() },
        importedAt: Date.now(),
        status: 'awaiting_consent' as const,
      };

      useSyncStore.getState().addPendingSession(session as any);
      expect(useSyncStore.getState().pendingSessions).toHaveLength(1);

      useSyncStore.getState().updatePendingSessionStatus('session-1', 'accepted');
      expect(useSyncStore.getState().pendingSessions[0].status).toBe('accepted');

      useSyncStore.getState().removePendingSession('session-1');
      expect(useSyncStore.getState().pendingSessions).toHaveLength(0);
    });

    it('should start consent flow', () => {
      useSyncStore.getState().startConsentFlow('session-123');

      const state = useSyncStore.getState();
      expect(state.consentSession.pendingSessionId).toBe('session-123');
      expect(state.consentSession.step).toBe('configuring');
      expect(state.showConsentModal).toBe(true);
    });

    it('should update consent config', () => {
      useSyncStore.getState().startConsentFlow('session-123');
      useSyncStore.getState().updateConsentConfig({
        mode: 'heart',
        includeSensitive: true,
      });

      const config = useSyncStore.getState().consentSession.config;
      expect(config!.mode).toBe('heart');
      expect(config!.includeSensitive).toBe(true);
    });

    it('should complete consent flow', () => {
      useSyncStore.getState().startConsentFlow('session-123');
      useSyncStore.getState().completeConsent();

      const state = useSyncStore.getState();
      expect(state.consentSession.step).toBe('ready');
      expect(state.showConsentModal).toBe(false);
    });

    it('should cancel consent flow and reset state', () => {
      useSyncStore.getState().startConsentFlow('session-123');
      useSyncStore.getState().cancelConsent();

      const state = useSyncStore.getState();
      expect(state.consentSession.step).toBe('idle');
      expect(state.consentSession.pendingSessionId).toBeNull();
      expect(state.showConsentModal).toBe(false);
    });

    it('should clear sync state', () => {
      useSyncStore.getState().setAdvertising(true);
      useSyncStore.getState().setScanning(true);
      useSyncStore.getState().addDiscoveredDevice({ id: 'test', name: 'Test' } as any);

      useSyncStore.getState().clearSync();

      const state = useSyncStore.getState();
      expect(state.isAdvertising).toBe(false);
      expect(state.isScanning).toBe(false);
      expect(state.discoveredDevices).toHaveLength(0);
    });
  });
});


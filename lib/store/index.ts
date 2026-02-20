import { create } from 'zustand';
import { JournalItem } from '../storage/db'; // kept for backward compat
import { MediaItemWithTags, ItemIngestStatus } from '../storage/types';
import {
  BLEDevice,
  DeviceSignature,
  SyncResult,
  PendingSession,
  PendingSessionStatus,
  ConsentConfig,
  CompareCapsule,
  ConsentStep,
  ConsentSession,
} from '../sync/types';

interface JournalState {
  items: MediaItemWithTags[];
  selectedTags: string[];
  ingestStatusMap: Record<string, ItemIngestStatus>;
  setItems: (items: MediaItemWithTags[]) => void;
  addItem: (item: MediaItemWithTags) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<MediaItemWithTags>) => void;
  setSelectedTags: (tags: string[]) => void;
  setIngestStatus: (id: string, status: ItemIngestStatus) => void;
  filteredItems: () => MediaItemWithTags[];
}

interface SyncState {
  isAdvertising: boolean;
  isScanning: boolean;
  discoveredDevices: BLEDevice[];
  currentSync: {
    device: BLEDevice | null;
    result: SyncResult | null;
  };
  // QR/Signature Exchange
  pendingSessions: PendingSession[];
  showQrModal: boolean;
  showScanModal: boolean;
  // Consent Flow State (Iteration 24)
  consentSession: ConsentSession;
  showConsentModal: boolean;
  showCapsulePreview: boolean;
  // Actions
  setAdvertising: (advertising: boolean) => void;
  setScanning: (scanning: boolean) => void;
  setDiscoveredDevices: (devices: BLEDevice[]) => void;
  addDiscoveredDevice: (device: BLEDevice) => void;
  setSyncResult: (device: BLEDevice, result: SyncResult) => void;
  clearSync: () => void;
  // Pending Session Actions
  setPendingSessions: (sessions: PendingSession[]) => void;
  addPendingSession: (session: PendingSession) => void;
  updatePendingSessionStatus: (id: string, status: PendingSessionStatus) => void;
  removePendingSession: (id: string) => void;
  // QR Modal Actions
  setShowQrModal: (show: boolean) => void;
  setShowScanModal: (show: boolean) => void;
  // Consent Flow Actions (Iteration 24)
  startConsentFlow: (pendingSessionId: string) => void;
  updateConsentConfig: (updates: Partial<ConsentConfig>) => void;
  setCapsule: (capsule: CompareCapsule) => void;
  setConsentStep: (step: ConsentStep) => void;
  completeConsent: () => void;
  cancelConsent: () => void;
  setShowConsentModal: (show: boolean) => void;
  setShowCapsulePreview: (show: boolean) => void;
}

interface SettingsState {
  darkMode: boolean;
  bleEnabled: boolean;
  qrFallback: boolean;
  hasSeenOnboarding: boolean;
  cloudEnabled: boolean;
  diagnosticsEnabled: boolean;
  isHydrated: boolean;
  setDarkMode: (enabled: boolean) => void;
  setBleEnabled: (enabled: boolean) => void;
  setQrFallback: (enabled: boolean) => void;
  setHasSeenOnboarding: (seen: boolean) => void;
  setCloudEnabled: (enabled: boolean) => void;
  setDiagnosticsEnabled: (enabled: boolean) => void;
  setIsHydrated: (hydrated: boolean) => void;
  hydrateFromMeta: (meta: Record<string, string>) => void;
}

const useJournalStore = create<JournalState>((set, get) => ({
  items: [],
  selectedTags: [],
  ingestStatusMap: {},
  setItems: (items) => set({ items }),
  addItem: (item) => set((state) => ({ items: [item, ...state.items] })),
  removeItem: (id) => set((state) => ({ items: state.items.filter(item => item.id !== id) })),
  updateItem: (id, updates) => set((state) => ({
    items: state.items.map(item => item.id === id ? { ...item, ...updates } : item),
  })),
  setSelectedTags: (tags) => set({ selectedTags: tags }),
  setIngestStatus: (id, status) => set((state) => ({
    ingestStatusMap: { ...state.ingestStatusMap, [id]: status },
  })),
  filteredItems: () => {
    const { items, selectedTags } = get();
    if (selectedTags.length === 0) return items;
    return items.filter(item =>
      selectedTags.some(tag => item.tags.some(t => t.name === tag))
    );
  },
}));

// Default consent config
const defaultConsentConfig: ConsentConfig = {
  mode: 'friend',
  selectedTopics: [],
  includeSensitive: false,
  useCloud: false,
  cloudProvider: null,
};

// Initial consent session state
const initialConsentSession: ConsentSession = {
  pendingSessionId: null,
  config: null,
  capsule: null,
  step: 'idle',
};

const useSyncStore = create<SyncState>((set) => ({
  isAdvertising: false,
  isScanning: false,
  discoveredDevices: [],
  currentSync: {
    device: null,
    result: null,
  },
  pendingSessions: [],
  showQrModal: false,
  showScanModal: false,
  // Consent Flow State
  consentSession: initialConsentSession,
  showConsentModal: false,
  showCapsulePreview: false,

  setAdvertising: (advertising) => set({ isAdvertising: advertising }),
  setScanning: (scanning) => set({ isScanning: scanning }),
  setDiscoveredDevices: (devices) => set({ discoveredDevices: devices }),
  addDiscoveredDevice: (device) => set((state) => ({
    discoveredDevices: [...state.discoveredDevices.filter(d => d.id !== device.id), device]
  })),
  setSyncResult: (device, result) => set({
    currentSync: { device, result }
  }),
  clearSync: () => set({
    currentSync: { device: null, result: null },
    discoveredDevices: [],
    isAdvertising: false,
    isScanning: false,
  }),

  // Pending Session Actions
  setPendingSessions: (sessions) => set({ pendingSessions: sessions }),
  addPendingSession: (session) => set((state) => ({
    pendingSessions: [session, ...state.pendingSessions.filter(s => s.id !== session.id)]
  })),
  updatePendingSessionStatus: (id, status) => set((state) => ({
    pendingSessions: state.pendingSessions.map(s =>
      s.id === id ? { ...s, status } : s
    )
  })),
  removePendingSession: (id) => set((state) => ({
    pendingSessions: state.pendingSessions.filter(s => s.id !== id)
  })),

  // QR Modal Actions
  setShowQrModal: (show) => set({ showQrModal: show }),
  setShowScanModal: (show) => set({ showScanModal: show }),

  // Consent Flow Actions (Iteration 24)
  startConsentFlow: (pendingSessionId) => set({
    consentSession: {
      pendingSessionId,
      config: { ...defaultConsentConfig },
      capsule: null,
      step: 'configuring',
    },
    showConsentModal: true,
  }),

  updateConsentConfig: (updates) => set((state) => ({
    consentSession: {
      ...state.consentSession,
      config: state.consentSession.config
        ? { ...state.consentSession.config, ...updates }
        : { ...defaultConsentConfig, ...updates },
    },
  })),

  setCapsule: (capsule) => set((state) => ({
    consentSession: {
      ...state.consentSession,
      capsule,
      step: 'reviewing',
    },
  })),

  setConsentStep: (step) => set((state) => ({
    consentSession: {
      ...state.consentSession,
      step,
    },
  })),

  completeConsent: () => set((state) => ({
    consentSession: {
      ...state.consentSession,
      step: 'ready',
    },
    showConsentModal: false,
    showCapsulePreview: false,
  })),

  cancelConsent: () => set({
    consentSession: initialConsentSession,
    showConsentModal: false,
    showCapsulePreview: false,
  }),

  setShowConsentModal: (show) => set({ showConsentModal: show }),
  setShowCapsulePreview: (show) => set({ showCapsulePreview: show }),
}));

const useSettingsStore = create<SettingsState>((set) => ({
  darkMode: true,
  bleEnabled: true,
  qrFallback: false,
  hasSeenOnboarding: false,
  cloudEnabled: false,
  diagnosticsEnabled: false,
  isHydrated: false,
  setDarkMode: (enabled) => set({ darkMode: enabled }),
  setBleEnabled: (enabled) => set({ bleEnabled: enabled }),
  setQrFallback: (enabled) => set({ qrFallback: enabled }),
  setHasSeenOnboarding: (seen) => set({ hasSeenOnboarding: seen }),
  setCloudEnabled: (enabled) => set({ cloudEnabled: enabled }),
  setDiagnosticsEnabled: (enabled) => set({ diagnosticsEnabled: enabled }),
  setIsHydrated: (hydrated) => set({ isHydrated: hydrated }),
  hydrateFromMeta: (meta) => {
    const updates: Partial<SettingsState> = { isHydrated: true };
    if ('settings.darkMode' in meta) {
      updates.darkMode = meta['settings.darkMode'] === 'true';
    }
    if ('settings.bleEnabled' in meta) {
      updates.bleEnabled = meta['settings.bleEnabled'] === 'true';
    }
    if ('settings.qrFallback' in meta) {
      updates.qrFallback = meta['settings.qrFallback'] === 'true';
    }
    if ('settings.cloudEnabled' in meta) {
      updates.cloudEnabled = meta['settings.cloudEnabled'] === 'true';
    }
    if ('settings.diagnosticsEnabled' in meta) {
      updates.diagnosticsEnabled = meta['settings.diagnosticsEnabled'] === 'true';
    }
    set(updates as SettingsState);
  },
}));

export { useJournalStore, useSyncStore, useSettingsStore };
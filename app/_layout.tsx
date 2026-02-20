import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { View, ActivityIndicator, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { theme } from '@/lib/theme';
import { useSettingsStore } from '@/lib/store';
import { Onboarding } from '@/components/Onboarding';
import { db } from '@/lib/storage/db';

const ONBOARDING_KEY = 'journallink_onboarding_complete';

/**
 * Platform-agnostic storage helpers for onboarding state
 * Uses SecureStore on native, localStorage on web
 */
async function getOnboardingFlag(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      // Use localStorage directly on web (more reliable than SecureStore web shim)
      const value = localStorage.getItem(ONBOARDING_KEY);
      return value === 'true';
    } else {
      // Use SecureStore on native
      const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
      return value === 'true';
    }
  } catch (error) {
    console.warn('[Layout] Failed to get onboarding flag:', error);
    return false;
  }
}

async function setOnboardingFlag(value: boolean): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      // Use localStorage directly on web
      localStorage.setItem(ONBOARDING_KEY, value ? 'true' : 'false');
    } else {
      // Use SecureStore on native
      await SecureStore.setItemAsync(ONBOARDING_KEY, value ? 'true' : 'false');
    }
  } catch (error) {
    console.warn('[Layout] Failed to set onboarding flag:', error);
    // Don't throw - allow app to continue
  }
}

export default function RootLayout() {
  useFrameworkReady();

  const [isLoading, setIsLoading] = useState(true);
  const { hasSeenOnboarding, setHasSeenOnboarding, hydrateFromMeta, setIsHydrated } = useSettingsStore();

  // Load onboarding state from storage on mount
  useEffect(() => {
    async function loadOnboardingState() {
      try {
        const completed = await getOnboardingFlag();
        if (completed) {
          setHasSeenOnboarding(true);
        }
      } catch (error) {
        console.error('[Layout] Failed to load onboarding state:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadOnboardingState();
  }, [setHasSeenOnboarding]);

  // Hydrate settings from user_meta table (separate from onboarding)
  useEffect(() => {
    async function hydrateSettings() {
      try {
        await db.init();
        const rawDb = db.getRawDb();
        const rows = await rawDb.getAllAsync<{ key: string; value: string }>(
          "SELECT key, value FROM user_meta WHERE key LIKE 'settings.%'"
        );
        const meta: Record<string, string> = {};
        for (const row of rows) meta[row.key] = row.value;
        hydrateFromMeta(meta);
      } catch (error) {
        console.warn('[Layout] Settings hydration failed:', error);
        setIsHydrated(true); // don't block UI on error
      }
    }
    hydrateSettings();
  }, [hydrateFromMeta, setIsHydrated]);

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    // Update store immediately for instant UI response
    setHasSeenOnboarding(true);
    // Persist to storage (async, non-blocking)
    await setOnboardingFlag(true);
  };

  // Show loading spinner while checking onboarding state
  if (isLoading) {
    return (
      <PaperProvider theme={theme}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
        <StatusBar style="light" backgroundColor={theme.colors.surface} />
      </PaperProvider>
    );
  }

  // Show onboarding for first-time users
  if (!hasSeenOnboarding) {
    return (
      <PaperProvider theme={theme}>
        <Onboarding
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingComplete}
        />
        <StatusBar style="light" backgroundColor={theme.colors.surface} />
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="item/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="tags" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" backgroundColor={theme.colors.surface} />
    </PaperProvider>
  );
}
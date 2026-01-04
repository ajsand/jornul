import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { View, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { theme } from '@/lib/theme';
import { useSettingsStore } from '@/lib/store';
import { Onboarding } from '@/components/Onboarding';

const ONBOARDING_KEY = 'journallink_onboarding_complete';

export default function RootLayout() {
  useFrameworkReady();

  const [isLoading, setIsLoading] = useState(true);
  const { hasSeenOnboarding, setHasSeenOnboarding } = useSettingsStore();

  // Load onboarding state from secure storage on mount
  useEffect(() => {
    async function loadOnboardingState() {
      try {
        const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
        if (value === 'true') {
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

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    try {
      await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
      setHasSeenOnboarding(true);
    } catch (error) {
      console.error('[Layout] Failed to save onboarding state:', error);
      // Still update the store to let user proceed
      setHasSeenOnboarding(true);
    }
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
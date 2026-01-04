/**
 * Haptic Feedback Utilities
 * Provides consistent haptic feedback across the app
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Check if haptics are available on this platform
 */
const isHapticsAvailable = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Light haptic feedback - for subtle interactions
 * Use for: button press, toggle change, list item tap
 */
export async function lightHaptic(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    // Silently fail - haptics are not critical
  }
}

/**
 * Medium haptic feedback - for standard interactions
 * Use for: save success, sync complete, action completion
 */
export async function mediumHaptic(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    // Silently fail
  }
}

/**
 * Heavy haptic feedback - for significant actions
 * Use for: delete confirmation, major state change
 */
export async function heavyHaptic(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    // Silently fail
  }
}

/**
 * Selection haptic - for selection changes
 * Use for: picker changes, slider stops, segment control
 */
export async function selectionHaptic(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.selectionAsync();
  } catch (error) {
    // Silently fail
  }
}

/**
 * Success notification haptic
 * Use for: successful save, sync complete, job done
 */
export async function successHaptic(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    // Silently fail
  }
}

/**
 * Warning notification haptic
 * Use for: validation issues, attention needed
 */
export async function warningHaptic(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (error) {
    // Silently fail
  }
}

/**
 * Error notification haptic
 * Use for: errors, failed operations, validation failures
 */
export async function errorHaptic(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    // Silently fail
  }
}

/**
 * Swipe haptic - for swipe gestures
 * Use for: swipe deck like/dislike, pull to refresh complete
 */
export async function swipeHaptic(): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    // Silently fail
  }
}

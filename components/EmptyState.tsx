/**
 * Empty State Component
 * Consistent empty state display across the app
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { LucideIcon } from 'lucide-react-native';
import { theme } from '@/lib/theme';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  style?: ViewStyle;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  style,
  compact = false,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, compact && styles.containerCompact, style]}>
      <View style={[styles.iconContainer, compact && styles.iconContainerCompact]}>
        <Icon
          size={compact ? 36 : 56}
          color={theme.colors.onSurfaceVariant}
          strokeWidth={1.5}
        />
      </View>

      <Text
        variant={compact ? 'titleMedium' : 'titleLarge'}
        style={styles.title}
      >
        {title}
      </Text>

      <Text
        variant="bodyMedium"
        style={[styles.description, compact && styles.descriptionCompact]}
      >
        {description}
      </Text>

      {(actionLabel || secondaryActionLabel) && (
        <View style={styles.actions}>
          {actionLabel && onAction && (
            <Button
              mode="contained"
              onPress={onAction}
              style={styles.primaryButton}
            >
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              mode="outlined"
              onPress={onSecondaryAction}
              style={styles.secondaryButton}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 300,
  },
  containerCompact: {
    padding: 24,
    minHeight: 200,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainerCompact: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 16,
  },
  title: {
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  description: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  descriptionCompact: {
    maxWidth: 240,
  },
  actions: {
    marginTop: 24,
    alignItems: 'center',
    gap: 12,
  },
  primaryButton: {
    minWidth: 160,
  },
  secondaryButton: {
    minWidth: 160,
  },
});

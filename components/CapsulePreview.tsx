/**
 * CapsulePreview Component
 * Iteration 24: Display the built capsule for user inspection
 *
 * Features:
 * - Show items grouped by category/topic
 * - Display swipe preferences summary
 * - Show token and cost estimates
 * - Back and Confirm buttons
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  Button,
  Chip,
  Divider,
  Surface,
  IconButton,
} from 'react-native-paper';
import {
  ArrowLeft,
  Check,
  BookOpen,
  Music,
  Film,
  Gamepad2,
  Mic,
  TrendingUp,
  TrendingDown,
  Package,
} from 'lucide-react-native';

import { useSyncStore } from '@/lib/store';
import { CapsuleItem } from '@/lib/sync/types';
import { estimateCost } from '@/lib/services/capsuleBuilder';
import { theme } from '@/lib/theme';

// Category icons
const getCategoryIcon = (category: string) => {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('book') || lowerCategory.includes('reading')) {
    return <BookOpen size={18} color={theme.colors.primary} />;
  }
  if (lowerCategory.includes('music') || lowerCategory.includes('song')) {
    return <Music size={18} color={theme.colors.secondary} />;
  }
  if (lowerCategory.includes('movie') || lowerCategory.includes('film') || lowerCategory.includes('tv')) {
    return <Film size={18} color={theme.colors.tertiary} />;
  }
  if (lowerCategory.includes('game') || lowerCategory.includes('gaming')) {
    return <Gamepad2 size={18} color="#4CAF50" />;
  }
  if (lowerCategory.includes('podcast') || lowerCategory.includes('audio')) {
    return <Mic size={18} color="#9C27B0" />;
  }
  return <Package size={18} color={theme.colors.outline} />;
};

interface CapsulePreviewProps {
  onBack: () => void;
  onConfirm: () => void;
}

export function CapsulePreview({ onBack, onConfirm }: CapsulePreviewProps) {
  const { consentSession } = useSyncStore();
  const capsule = consentSession.capsule;
  const config = consentSession.config;

  // Group items by their primary category (first tag)
  const itemsByCategory = useMemo(() => {
    if (!capsule) return new Map<string, CapsuleItem[]>();

    const grouped = new Map<string, CapsuleItem[]>();
    for (const item of capsule.items) {
      const category = item.tags[0] || 'uncategorized';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(item);
    }
    return grouped;
  }, [capsule]);

  const tokenEstimate = capsule?.tokenEstimate || 0;
  const costEstimate = config ? estimateCost(tokenEstimate, config.cloudProvider) : 0;

  if (!capsule) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No capsule to preview</Text>
        <Button mode="outlined" onPress={onBack}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon={() => <ArrowLeft size={24} color={theme.colors.onSurface} />}
          onPress={onBack}
        />
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Your Compare Capsule
        </Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>
            {capsule.items.length} items
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Categories */}
        {Array.from(itemsByCategory.entries()).map(([category, items]) => (
          <Surface key={category} style={styles.categoryCard} elevation={1}>
            <View style={styles.categoryHeader}>
              {getCategoryIcon(category)}
              <Text variant="titleMedium" style={styles.categoryTitle}>
                {category}
              </Text>
              <Chip compact style={styles.categoryCount}>
                {items.length}
              </Chip>
            </View>

            <View style={styles.itemsList}>
              {items.map((item, index) => (
                <View key={item.itemId}>
                  {index > 0 && <Divider style={styles.itemDivider} />}
                  <View style={styles.itemRow}>
                    <View style={styles.itemContent}>
                      <Text variant="bodyMedium" style={styles.itemTitle} numberOfLines={1}>
                        &quot;{item.title}&quot;
                      </Text>
                      {item.excerpt && (
                        <Text style={styles.itemExcerpt} numberOfLines={2}>
                          {item.excerpt}
                        </Text>
                      )}
                    </View>
                    <Chip compact style={styles.shareLevelChip} textStyle={styles.shareLevelText}>
                      {item.shareLevel}
                    </Chip>
                  </View>
                </View>
              ))}
            </View>
          </Surface>
        ))}

        {/* Swipe Preferences */}
        <Surface style={styles.preferencesCard} elevation={1}>
          <Text variant="titleMedium" style={styles.preferencesTitle}>
            Swipe Preferences
          </Text>

          {/* Liked Themes */}
          <View style={styles.preferenceSection}>
            <View style={styles.preferenceHeader}>
              <TrendingUp size={18} color="#4CAF50" />
              <Text style={styles.preferenceLabel}>Likes</Text>
            </View>
            <View style={styles.themeChips}>
              {capsule.swipeSummary.likedThemes.length > 0 ? (
                capsule.swipeSummary.likedThemes.slice(0, 6).map((t) => (
                  <Chip
                    key={t.theme}
                    compact
                    style={styles.likeChip}
                    textStyle={styles.themeChipText}
                  >
                    {t.theme} ({t.count})
                  </Chip>
                ))
              ) : (
                <Text style={styles.noDataText}>No likes yet</Text>
              )}
            </View>
          </View>

          {/* Disliked Themes */}
          <View style={styles.preferenceSection}>
            <View style={styles.preferenceHeader}>
              <TrendingDown size={18} color={theme.colors.error} />
              <Text style={styles.preferenceLabel}>Dislikes</Text>
            </View>
            <View style={styles.themeChips}>
              {capsule.swipeSummary.dislikedThemes.length > 0 ? (
                capsule.swipeSummary.dislikedThemes.slice(0, 4).map((t) => (
                  <Chip
                    key={t.theme}
                    compact
                    style={styles.dislikeChip}
                    textStyle={styles.themeChipText}
                  >
                    {t.theme} ({t.count})
                  </Chip>
                ))
              ) : (
                <Text style={styles.noDataText}>No dislikes yet</Text>
              )}
            </View>
          </View>
        </Surface>

        {/* Summary Stats */}
        <Surface style={styles.summaryCard} elevation={1}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Mode</Text>
              <Text style={styles.summaryValue}>{capsule.mode}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Tokens</Text>
              <Text style={styles.summaryValue}>~{tokenEstimate.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Cost</Text>
              <Text style={styles.summaryValue}>
                {config?.useCloud ? `$${costEstimate.toFixed(4)}` : 'Free'}
              </Text>
            </View>
          </View>
        </Surface>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Text style={styles.privacyText}>
            {config?.includeSensitive
              ? 'Sensitive items are included in this capsule.'
              : 'Sensitive items are excluded from this capsule.'}
          </Text>
          <Text style={styles.privacyText}>
            {config?.useCloud
              ? `Processing via ${config.cloudProvider || 'cloud'}.`
              : 'All processing stays on device.'}
          </Text>
        </View>

        {/* Spacer for bottom buttons */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <Button
          mode="outlined"
          onPress={onBack}
          style={styles.actionButton}
          icon={() => <ArrowLeft size={18} color={theme.colors.primary} />}
        >
          Back
        </Button>
        <Button
          mode="contained"
          onPress={onConfirm}
          style={styles.actionButton}
          icon={() => <Check size={18} color="#fff" />}
        >
          Confirm & Compare
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: theme.colors.background,
  },
  emptyText: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  headerTitle: {
    flex: 1,
    color: theme.colors.onSurface,
    fontWeight: '600',
  },
  headerBadge: {
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  headerBadgeText: {
    color: theme.colors.onPrimaryContainer,
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  categoryCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  categoryTitle: {
    flex: 1,
    color: theme.colors.onSurface,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  categoryCount: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  itemsList: {
    marginLeft: 26,
  },
  itemDivider: {
    marginVertical: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  itemContent: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  itemExcerpt: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  shareLevelChip: {
    backgroundColor: theme.colors.surfaceVariant,
    height: 24,
  },
  shareLevelText: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
  preferencesCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },
  preferencesTitle: {
    color: theme.colors.onSurface,
    fontWeight: '600',
    marginBottom: 16,
  },
  preferenceSection: {
    marginBottom: 16,
  },
  preferenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  preferenceLabel: {
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  themeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginLeft: 26,
  },
  likeChip: {
    backgroundColor: '#E8F5E9',
  },
  dislikeChip: {
    backgroundColor: theme.colors.errorContainer,
  },
  themeChipText: {
    fontSize: 12,
  },
  noDataText: {
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    fontSize: 13,
  },
  summaryCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceVariant,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    color: theme.colors.onSurface,
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  privacyNotice: {
    padding: 16,
    marginBottom: 12,
  },
  privacyText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 4,
  },
  bottomSpacer: {
    height: 100,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  actionButton: {
    flex: 1,
  },
});

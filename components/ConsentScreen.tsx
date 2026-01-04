/**
 * ConsentScreen Component
 * Iteration 24: Consent configuration UI for Compare sessions
 *
 * Features:
 * - Mode selector (Friend / Heart / Custom)
 * - Topic chips (multi-select from available tags)
 * - Sensitive toggle (default OFF)
 * - Cloud toggle + provider selection stub
 * - Token/cost estimate display
 * - Preview and Start buttons
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import {
  Text,
  Button,
  Chip,
  Switch,
  SegmentedButtons,
  Divider,
  Surface,
  IconButton,
} from 'react-native-paper';
import {
  Users,
  Heart,
  Settings,
  Shield,
  Cloud,
  CloudOff,
  Eye,
  Zap,
  DollarSign,
  X,
} from 'lucide-react-native';

import { useSyncStore } from '@/lib/store';
import { db } from '@/lib/storage/db';
import { ConsentMode, PendingSession } from '@/lib/sync/types';
import { TagWithCount } from '@/lib/storage/types';
import {
  getAvailableTopics,
  buildCompareCapsule,
  estimateCost,
} from '@/lib/services/capsuleBuilder';
import { theme } from '@/lib/theme';

const CLOUD_PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'claude', label: 'Claude' },
];

interface ConsentScreenProps {
  pendingSession: PendingSession;
  onComplete: () => void;
  onCancel: () => void;
}

export function ConsentScreen({
  pendingSession,
  onComplete,
  onCancel,
}: ConsentScreenProps) {
  const {
    consentSession,
    updateConsentConfig,
    setCapsule,
    setShowCapsulePreview,
  } = useSyncStore();

  const config = consentSession.config;
  const capsule = consentSession.capsule;

  const [loading, setLoading] = useState(true);
  const [buildingCapsule, setBuildingCapsule] = useState(false);
  const [availableTopics, setAvailableTopics] = useState<TagWithCount[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadTopics = useCallback(async () => {
    try {
      setLoading(true);
      await db.init();
      const rawDb = db.getRawDb();
      const topics = await getAvailableTopics(rawDb);
      setAvailableTopics(topics);

      // Pre-select topics that match partner's interests
      const partnerTags = pendingSession.importedSignature.topTags;
      const matchingTopics = topics
        .filter((t) => partnerTags.includes(t.name))
        .map((t) => t.name);

      if (matchingTopics.length > 0) {
        updateConsentConfig({ selectedTopics: matchingTopics });
      }
    } catch (err) {
      console.error('Failed to load topics:', err);
      setError('Failed to load topics');
    } finally {
      setLoading(false);
    }
  }, [pendingSession.importedSignature.topTags, updateConsentConfig]);

  // Load available topics on mount
  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  const handleModeChange = (mode: string) => {
    updateConsentConfig({ mode: mode as ConsentMode });
  };

  const toggleTopic = (topicName: string) => {
    if (!config) return;

    const selected = config.selectedTopics.includes(topicName)
      ? config.selectedTopics.filter((t) => t !== topicName)
      : [...config.selectedTopics, topicName];

    updateConsentConfig({ selectedTopics: selected });
  };

  const handlePreviewCapsule = async () => {
    if (!config) return;

    try {
      setBuildingCapsule(true);
      setError(null);

      await db.init();
      const rawDb = db.getRawDb();

      const newCapsule = await buildCompareCapsule(rawDb, {
        sessionId: pendingSession.id,
        config,
        partnerSignature: pendingSession.importedSignature,
      });

      setCapsule(newCapsule);
      setShowCapsulePreview(true);
    } catch (err) {
      console.error('Failed to build capsule:', err);
      setError('Failed to build capsule');
    } finally {
      setBuildingCapsule(false);
    }
  };

  const handleStartCompare = async () => {
    // If no capsule yet, build it first
    if (!capsule) {
      await handlePreviewCapsule();
    }
    onComplete();
  };

  const tokenEstimate = capsule?.tokenEstimate || 0;
  const costEstimate = config ? estimateCost(tokenEstimate, config.cloudProvider) : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading topics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={[styles.stepLine, styles.stepLineActive]} />
          <View style={styles.stepDot} />
        </View>
        <View style={styles.stepLabels}>
          <Text style={[styles.stepLabel, styles.stepLabelActive]}>Configure</Text>
          <Text style={styles.stepLabel}>Preview</Text>
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Configure Compare Session
        </Text>
        <IconButton
          icon={() => <X size={24} color={theme.colors.onSurface} />}
          onPress={onCancel}
        />
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Partner Info */}
        <Surface style={styles.partnerCard} elevation={1}>
          <Text variant="labelMedium" style={styles.sectionLabel}>
            Comparing with
          </Text>
          <Text variant="bodyLarge" style={styles.partnerDevice}>
            Device: {pendingSession.deviceId.slice(0, 8)}...
          </Text>
          <View style={styles.partnerTags}>
            {pendingSession.importedSignature.topTags.slice(0, 5).map((tag) => (
              <Chip key={tag} compact style={styles.partnerTag} textStyle={styles.partnerTagText}>
                {tag}
              </Chip>
            ))}
          </View>
        </Surface>

        <Divider style={styles.divider} />

        {/* Mode Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={20} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Compare Mode
            </Text>
          </View>

          <SegmentedButtons
            value={config?.mode || 'friend'}
            onValueChange={handleModeChange}
            buttons={[
              {
                value: 'friend',
                label: 'Friend',
                icon: () => <Users size={16} color={theme.colors.onSurface} />,
              },
              {
                value: 'heart',
                label: 'Heart',
                icon: () => <Heart size={16} color={theme.colors.error} />,
              },
              {
                value: 'custom',
                label: 'Custom',
                icon: () => <Settings size={16} color={theme.colors.onSurface} />,
              },
            ]}
            style={styles.segmentedButtons}
          />

          <Text style={styles.modeDescription}>
            {config?.mode === 'friend' && 'Share general interests and conversation starters'}
            {config?.mode === 'heart' && 'Share deeper preferences for meaningful connections'}
            {config?.mode === 'custom' && 'Customize exactly what to share'}
          </Text>
        </View>

        <Divider style={styles.divider} />

        {/* Topic Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Zap size={20} color={theme.colors.secondary} />
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Topics to Share
            </Text>
          </View>

          <Text style={styles.sectionDescription}>
            Select topics to include in the comparison
          </Text>

          <View style={styles.topicChips}>
            {availableTopics.length === 0 ? (
              <Text style={styles.noTopicsText}>
                No topics available. Add some items to your vault first.
              </Text>
            ) : (
              availableTopics.map((topic) => (
                <Chip
                  key={topic.id}
                  selected={config?.selectedTopics.includes(topic.name)}
                  onPress={() => toggleTopic(topic.name)}
                  style={[
                    styles.topicChip,
                    config?.selectedTopics.includes(topic.name) && styles.topicChipSelected,
                  ]}
                  showSelectedOverlay
                >
                  {topic.name} ({topic.usage_count})
                </Chip>
              ))
            )}
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Privacy Toggles */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color={theme.colors.tertiary} />
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Privacy Settings
            </Text>
          </View>

          {/* Sensitive Toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text variant="bodyLarge" style={styles.toggleLabel}>
                Include sensitive items
              </Text>
              <Text style={styles.toggleDescription}>
                Items tagged as &quot;sensitive&quot; will be included
              </Text>
            </View>
            <Switch
              value={config?.includeSensitive || false}
              onValueChange={(value) => updateConsentConfig({ includeSensitive: value })}
              color={theme.colors.primary}
            />
          </View>

          {/* Cloud Toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <View style={styles.toggleLabelRow}>
                {config?.useCloud ? (
                  <Cloud size={18} color={theme.colors.primary} />
                ) : (
                  <CloudOff size={18} color={theme.colors.onSurfaceVariant} />
                )}
                <Text variant="bodyLarge" style={styles.toggleLabel}>
                  Use cloud AI
                </Text>
              </View>
              <Text style={styles.toggleDescription}>
                {config?.useCloud
                  ? 'Data will be processed via cloud provider'
                  : 'All processing stays on device (free)'}
              </Text>
            </View>
            <Switch
              value={config?.useCloud || false}
              onValueChange={(value) =>
                updateConsentConfig({
                  useCloud: value,
                  cloudProvider: value ? 'openai' : null,
                })
              }
              color={theme.colors.primary}
            />
          </View>

          {/* Provider Selection (when cloud enabled) */}
          {config?.useCloud && (
            <View style={styles.providerSection}>
              <Text variant="labelMedium" style={styles.providerLabel}>
                Select Provider
              </Text>
              <View style={styles.providerChips}>
                {CLOUD_PROVIDERS.map((provider) => (
                  <Chip
                    key={provider.value}
                    selected={config.cloudProvider === provider.value}
                    onPress={() => updateConsentConfig({ cloudProvider: provider.value })}
                    style={styles.providerChip}
                  >
                    {provider.label}
                  </Chip>
                ))}
              </View>
            </View>
          )}
        </View>

        <Divider style={styles.divider} />

        {/* Estimates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <DollarSign size={20} color={theme.colors.outline} />
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Estimates
            </Text>
          </View>

          <View style={styles.estimatesRow}>
            <View style={styles.estimate}>
              <Text style={styles.estimateLabel}>Tokens</Text>
              <Text style={styles.estimateValue}>
                ~{tokenEstimate.toLocaleString()}
              </Text>
            </View>
            <View style={styles.estimate}>
              <Text style={styles.estimateLabel}>Cost</Text>
              <Text style={styles.estimateValue}>
                {config?.useCloud
                  ? `$${costEstimate.toFixed(4)}`
                  : '$0.00 (local)'}
              </Text>
            </View>
            <View style={styles.estimate}>
              <Text style={styles.estimateLabel}>Items</Text>
              <Text style={styles.estimateValue}>
                {capsule?.items.length || '-'}
              </Text>
            </View>
          </View>
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {/* Spacer for bottom buttons */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <Button
          mode="outlined"
          onPress={handlePreviewCapsule}
          loading={buildingCapsule}
          disabled={buildingCapsule || !config?.selectedTopics.length}
          icon={() => <Eye size={18} color={theme.colors.primary} />}
          style={styles.actionButton}
        >
          Preview Capsule
        </Button>
        <Button
          mode="contained"
          onPress={handleStartCompare}
          loading={buildingCapsule}
          disabled={buildingCapsule || !config?.selectedTopics.length}
          style={styles.actionButton}
        >
          Start Compare
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.onSurfaceVariant,
  },
  stepIndicator: {
    paddingTop: 16,
    paddingHorizontal: 48,
    backgroundColor: theme.colors.surface,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.surfaceVariant,
    borderWidth: 2,
    borderColor: theme.colors.outline,
  },
  stepDotActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: theme.colors.outline,
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: theme.colors.primary,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stepLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  stepLabelActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  headerTitle: {
    color: theme.colors.onSurface,
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  partnerCard: {
    padding: 16,
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceVariant,
  },
  sectionLabel: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  partnerDevice: {
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  partnerTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  partnerTag: {
    backgroundColor: theme.colors.primaryContainer,
  },
  partnerTagText: {
    fontSize: 12,
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: theme.colors.onSurface,
    fontWeight: '600',
  },
  sectionDescription: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 12,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  modeDescription: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
  topicChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    marginBottom: 4,
  },
  topicChipSelected: {
    backgroundColor: theme.colors.primaryContainer,
  },
  noTopicsText: {
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    color: theme.colors.onSurface,
  },
  toggleDescription: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 13,
    marginTop: 2,
  },
  providerSection: {
    marginTop: 12,
    paddingLeft: 8,
  },
  providerLabel: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  providerChips: {
    flexDirection: 'row',
    gap: 8,
  },
  providerChip: {
    backgroundColor: theme.colors.surface,
  },
  estimatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 12,
  },
  estimate: {
    alignItems: 'center',
  },
  estimateLabel: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    marginBottom: 4,
  },
  estimateValue: {
    color: theme.colors.onSurface,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: 16,
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

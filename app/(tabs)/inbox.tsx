import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Appbar, Text, Card, Chip, IconButton, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  Clock,
  Play,
  CheckCircle,
  XCircle,
  Link as LinkIcon,
  FileText,
  RefreshCw,
} from 'lucide-react-native';
import { db } from '@/lib/storage/db';
import * as repos from '@/lib/storage/repositories';
import { Job, MediaItem } from '@/lib/storage/types';
import {
  startJobRunner,
  stopJobRunner,
  isJobRunnerActive,
  getJobStats,
  registerAllJobHandlers,
} from '@/lib/services';
import { theme } from '@/lib/theme';

interface JobWithItem extends Job {
  item?: MediaItem | null;
}

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: theme.colors.onSurfaceVariant,
    label: 'Queued',
  },
  running: {
    icon: Play,
    color: theme.colors.primary,
    label: 'Processing',
  },
  done: {
    icon: CheckCircle,
    color: theme.colors.tertiary,
    label: 'Done',
  },
  failed: {
    icon: XCircle,
    color: theme.colors.error,
    label: 'Failed',
  },
  cancelled: {
    icon: XCircle,
    color: theme.colors.onSurfaceVariant,
    label: 'Cancelled',
  },
};

export default function InboxScreen() {
  const [jobs, setJobs] = useState<JobWithItem[]>([]);
  const [stats, setStats] = useState({ pending: 0, running: 0, done: 0, failed: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [runnerActive, setRunnerActive] = useState(false);

  const loadJobs = useCallback(async () => {
    try {
      await db.init();
      const rawDb = db.getRawDb();

      // Get recent jobs (limit 50)
      const allJobs = await repos.listJobs(rawDb, { limit: 50 });

      // Enrich with item data
      const enrichedJobs: JobWithItem[] = await Promise.all(
        allJobs.map(async (job) => {
          let item: MediaItem | null = null;
          if (job.payload_json) {
            try {
              const payload = JSON.parse(job.payload_json);
              if (payload.itemId) {
                item = await repos.getMediaItem(rawDb, payload.itemId);
              }
            } catch {
              // Ignore parse errors
            }
          }
          return { ...job, item };
        })
      );

      setJobs(enrichedJobs);

      // Get stats
      const jobStats = await getJobStats();
      setStats(jobStats);

      // Check runner status
      setRunnerActive(isJobRunnerActive());
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  }, []);

  // Initialize job runner on mount
  useEffect(() => {
    const initRunner = async () => {
      registerAllJobHandlers();
      await startJobRunner();
      setRunnerActive(true);
    };
    initRunner();

    return () => {
      // Don't stop runner on unmount - let it continue
    };
  }, []);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      loadJobs();

      // Set up polling while screen is focused
      const interval = setInterval(loadJobs, 3000);
      return () => clearInterval(interval);
    }, [loadJobs])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const handleToggleRunner = async () => {
    if (runnerActive) {
      stopJobRunner();
      setRunnerActive(false);
    } else {
      registerAllJobHandlers();
      await startJobRunner();
      setRunnerActive(true);
    }
  };

  const handleJobPress = (job: JobWithItem) => {
    if (job.item) {
      router.push(`/item/${job.item.id}`);
    }
  };

  const renderJob = ({ item: job }: { item: JobWithItem }) => {
    const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
    const StatusIcon = statusConfig.icon;
    const isLink = job.item?.type === 'url';

    return (
      <Card style={styles.jobCard} onPress={() => handleJobPress(job)}>
        <Card.Content style={styles.jobContent}>
          <View style={styles.jobHeader}>
            <View style={styles.jobIconContainer}>
              {isLink ? (
                <LinkIcon size={20} color={theme.colors.primary} />
              ) : (
                <FileText size={20} color={theme.colors.secondary} />
              )}
            </View>
            <View style={styles.jobInfo}>
              <Text variant="titleSmall" numberOfLines={1} style={styles.jobTitle}>
                {job.item?.title || 'Processing...'}
              </Text>
              <Text variant="bodySmall" style={styles.jobKind}>
                {job.kind.replace(/_/g, ' ')}
              </Text>
            </View>
            <View style={styles.statusContainer}>
              <StatusIcon size={16} color={statusConfig.color} />
              <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {job.status === 'running' && (
            <ProgressBar
              progress={job.progress}
              color={theme.colors.primary}
              style={styles.progressBar}
            />
          )}

          {job.status === 'failed' && job.error && (
            <Text variant="bodySmall" style={styles.errorText} numberOfLines={2}>
              {job.error}
            </Text>
          )}

          <Text variant="labelSmall" style={styles.timestamp}>
            {new Date(job.created_at).toLocaleTimeString()}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  const renderHeader = () => (
    <View style={styles.statsContainer}>
      <Chip icon={() => <Clock size={14} color={theme.colors.onSurfaceVariant} />} compact>
        {stats.pending} queued
      </Chip>
      <Chip
        icon={() => <Play size={14} color={theme.colors.primary} />}
        compact
        style={styles.statChip}
      >
        {stats.running} running
      </Chip>
      <Chip
        icon={() => <CheckCircle size={14} color={theme.colors.tertiary} />}
        compact
        style={styles.statChip}
      >
        {stats.done} done
      </Chip>
      {stats.failed > 0 && (
        <Chip
          icon={() => <XCircle size={14} color={theme.colors.error} />}
          compact
          style={styles.statChip}
        >
          {stats.failed} failed
        </Chip>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Clock size={48} color={theme.colors.onSurfaceVariant} />
      <Text variant="titleMedium" style={styles.emptyTitle}>
        No Jobs Yet
      </Text>
      <Text style={styles.emptyText}>
        Capture something in Scratch to see jobs appear here.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Inbox" titleStyle={styles.headerTitle} />
        <IconButton
          icon={() => (
            <RefreshCw
              size={20}
              color={runnerActive ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
          )}
          onPress={handleToggleRunner}
        />
      </Appbar.Header>

      {renderHeader()}

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={renderJob}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={renderEmpty}
      />
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
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  statChip: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  jobCard: {
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
  },
  jobContent: {
    paddingVertical: 12,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    color: theme.colors.onSurface,
  },
  jobKind: {
    color: theme.colors.onSurfaceVariant,
    textTransform: 'capitalize',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressBar: {
    marginTop: 8,
    height: 4,
    borderRadius: 2,
  },
  errorText: {
    color: theme.colors.error,
    marginTop: 8,
  },
  timestamp: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 48,
  },
  emptyTitle: {
    color: theme.colors.onSurface,
    marginTop: 16,
  },
  emptyText: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

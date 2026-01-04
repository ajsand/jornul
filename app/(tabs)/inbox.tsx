import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Appbar, Text, Card, Chip, IconButton, ProgressBar, Button, Snackbar } from 'react-native-paper';
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
  FolderUp,
  Image,
  Music,
  Video,
  FileType,
  RotateCcw,
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
  getBatchProgress,
  retryJob,
  retryAllFailed,
  getMaxRetries,
} from '@/lib/services';
import { theme } from '@/lib/theme';

interface JobWithItem extends Job {
  item?: MediaItem | null;
  batchInfo?: {
    total: number;
    completed: number;
    failed: number;
  };
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
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      await db.init();
      const rawDb = db.getRawDb();

      // Get recent jobs (limit 50)
      const allJobs = await repos.listJobs(rawDb, { limit: 50 });

      // Filter out child jobs that are part of a batch (to avoid clutter)
      const batchIds = new Set<string>();
      allJobs.forEach(job => {
        if (job.kind === 'batch_import' && job.payload_json) {
          batchIds.add(job.id);
        }
      });

      // Enrich with item data and batch info
      const enrichedJobs: JobWithItem[] = await Promise.all(
        allJobs
          .filter(job => {
            // Keep batch jobs and non-batch jobs
            // Filter out child jobs of batches
            if (job.kind === 'normalize_and_tag' && job.payload_json) {
              try {
                const payload = JSON.parse(job.payload_json);
                if (payload.batchId && batchIds.has(payload.batchId)) {
                  return false; // Hide child jobs
                }
              } catch {
                // Keep if parse fails
              }
            }
            return true;
          })
          .map(async (job) => {
            let item: MediaItem | null = null;
            let batchInfo: { total: number; completed: number; failed: number } | undefined;

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

            // Get batch progress for batch jobs
            if (job.kind === 'batch_import') {
              const progress = await getBatchProgress(job.id);
              if (progress) {
                batchInfo = {
                  total: progress.total,
                  completed: progress.completed,
                  failed: progress.failed,
                };
              }
            }

            return { ...job, item, batchInfo };
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

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleRetryJob = async (jobId: string) => {
    setRetryingJobId(jobId);
    try {
      const success = await retryJob(jobId);
      if (success) {
        showSnackbar('Job queued for retry');
        await loadJobs();
      } else {
        showSnackbar('Failed to retry job');
      }
    } catch (error) {
      console.error('Retry job error:', error);
      showSnackbar('Error retrying job');
    } finally {
      setRetryingJobId(null);
    }
  };

  const handleRetryAllFailed = async () => {
    try {
      const count = await retryAllFailed();
      if (count > 0) {
        showSnackbar(`${count} job${count > 1 ? 's' : ''} queued for retry`);
        await loadJobs();
      } else {
        showSnackbar('No retryable jobs found');
      }
    } catch (error) {
      console.error('Retry all error:', error);
      showSnackbar('Error retrying jobs');
    }
  };

  const getItemIcon = (job: JobWithItem) => {
    if (job.kind === 'batch_import') {
      return <FolderUp size={20} color={theme.colors.tertiary} />;
    }

    const type = job.item?.type;
    switch (type) {
      case 'url':
        return <LinkIcon size={20} color={theme.colors.primary} />;
      case 'image':
        return <Image size={20} color={theme.colors.secondary} />;
      case 'audio':
        return <Music size={20} color={theme.colors.secondary} />;
      case 'video':
        return <Video size={20} color={theme.colors.secondary} />;
      case 'pdf':
        return <FileType size={20} color={theme.colors.secondary} />;
      default:
        return <FileText size={20} color={theme.colors.secondary} />;
    }
  };

  const getJobTitle = (job: JobWithItem): string => {
    if (job.kind === 'batch_import' && job.batchInfo) {
      return `Batch Import (${job.batchInfo.total} files)`;
    }
    return job.item?.title || 'Processing...';
  };

  const getJobSubtitle = (job: JobWithItem): string => {
    if (job.kind === 'batch_import' && job.batchInfo) {
      const { completed, failed, total } = job.batchInfo;
      if (completed + failed >= total) {
        return failed > 0 ? `Done with ${failed} error${failed > 1 ? 's' : ''}` : 'Completed';
      }
      return `${completed} of ${total} done`;
    }
    return job.kind.replace(/_/g, ' ');
  };

  const renderJob = ({ item: job }: { item: JobWithItem }) => {
    const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
    const StatusIcon = statusConfig.icon;
    const isBatch = job.kind === 'batch_import';

    // Calculate batch progress
    let displayProgress = job.progress;
    if (isBatch && job.batchInfo) {
      const { completed, failed, total } = job.batchInfo;
      displayProgress = total > 0 ? (completed + failed) / total : 0;
    }

    return (
      <Card style={styles.jobCard} onPress={() => !isBatch && handleJobPress(job)}>
        <Card.Content style={styles.jobContent}>
          <View style={styles.jobHeader}>
            <View style={[styles.jobIconContainer, isBatch && styles.batchIconContainer]}>
              {getItemIcon(job)}
            </View>
            <View style={styles.jobInfo}>
              <Text variant="titleSmall" numberOfLines={1} style={styles.jobTitle}>
                {getJobTitle(job)}
              </Text>
              <Text variant="bodySmall" style={styles.jobKind}>
                {getJobSubtitle(job)}
              </Text>
            </View>
            <View style={styles.statusContainer}>
              <StatusIcon size={16} color={statusConfig.color} />
              <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {(job.status === 'running' || (isBatch && job.status !== 'done' && job.status !== 'failed')) && (
            <ProgressBar
              progress={displayProgress}
              color={theme.colors.primary}
              style={styles.progressBar}
            />
          )}

          {job.status === 'failed' && (
            <View style={styles.failedSection}>
              {job.error && (
                <Text variant="bodySmall" style={styles.errorText} numberOfLines={2}>
                  {job.error}
                </Text>
              )}
              <View style={styles.retryRow}>
                <Text variant="labelSmall" style={styles.retryInfo}>
                  {job.retry_count > 0
                    ? `Retried ${job.retry_count}/${getMaxRetries()} times`
                    : 'Not retried yet'}
                </Text>
                <Button
                  mode="outlined"
                  compact
                  icon={() => <RotateCcw size={14} color={theme.colors.primary} />}
                  onPress={() => handleRetryJob(job.id)}
                  loading={retryingJobId === job.id}
                  disabled={retryingJobId !== null}
                  style={styles.retryButton}
                  labelStyle={styles.retryButtonLabel}
                >
                  Retry
                </Button>
              </View>
            </View>
          )}

          <Text variant="labelSmall" style={styles.timestamp}>
            {new Date(job.created_at).toLocaleTimeString()}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
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
      {stats.failed > 0 && (
        <View style={styles.retryAllContainer}>
          <Button
            mode="outlined"
            compact
            icon={() => <RotateCcw size={16} color={theme.colors.primary} />}
            onPress={handleRetryAllFailed}
            style={styles.retryAllButton}
          >
            Retry All Failed
          </Button>
        </View>
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

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
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
  headerSection: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  retryAllContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  retryAllButton: {
    borderColor: theme.colors.primary,
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
  batchIconContainer: {
    backgroundColor: theme.colors.tertiaryContainer,
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
  failedSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.errorContainer,
    backgroundColor: theme.colors.errorContainer,
    marginHorizontal: -16,
    marginBottom: -12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  errorText: {
    color: theme.colors.error,
  },
  retryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  retryInfo: {
    color: theme.colors.onErrorContainer,
    flex: 1,
  },
  retryButton: {
    borderColor: theme.colors.error,
  },
  retryButtonLabel: {
    fontSize: 12,
  },
  timestamp: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 8,
  },
  snackbar: {
    backgroundColor: theme.colors.inverseSurface,
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

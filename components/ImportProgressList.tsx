import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Card, ProgressBar } from 'react-native-paper';
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react-native';
import { formatFileSize } from '@/lib/utils/fileHelpers';
import { theme } from '@/lib/theme';

export type ImportStatus = 'pending' | 'importing' | 'success' | 'error';

export interface ImportItem {
  id: string;
  filename: string;
  status: ImportStatus;
  progress?: number; // 0-100
  error?: string;
  size?: number;
  uri?: string;        // Source URI for import
  mimeType?: string;   // MIME type from picker
}

interface ImportProgressListProps {
  items: ImportItem[];
}

export function ImportProgressList({ items }: ImportProgressListProps) {
  const renderItem = ({ item }: { item: ImportItem }) => {
    const getStatusIcon = () => {
      switch (item.status) {
        case 'pending':
          return <Clock size={20} color={theme.colors.onSurfaceVariant} />;
        case 'importing':
          return <Loader2 size={20} color={theme.colors.primary} />;
        case 'success':
          return <CheckCircle2 size={20} color="#4CAF50" />;
        case 'error':
          return <XCircle size={20} color={theme.colors.error} />;
      }
    };

    return (
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.iconContainer}>
            {getStatusIcon()}
          </View>
          
          <View style={styles.contentContainer}>
            <Text 
              variant="bodyMedium" 
              style={styles.filename}
              numberOfLines={1}
            >
              {item.filename}
            </Text>
            
            {item.size && (
              <Text variant="bodySmall" style={styles.fileSize}>
                {formatFileSize(item.size)}
              </Text>
            )}
            
            {item.status === 'importing' && item.progress !== undefined && (
              <ProgressBar 
                progress={item.progress / 100} 
                color={theme.colors.primary}
                style={styles.progressBar}
              />
            )}
            
            {item.error && (
              <Text variant="bodySmall" style={styles.errorText}>
                {item.error}
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  filename: {
    color: theme.colors.onSurface,
    fontWeight: '500',
    marginBottom: 4,
  },
  fileSize: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  errorText: {
    color: theme.colors.error,
    marginTop: 4,
  },
});


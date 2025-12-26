import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip, Divider } from 'react-native-paper';
import { SyncResult } from '@/lib/sync/types';
import { theme } from '@/lib/theme';

interface InsightCardProps {
  result: SyncResult;
  deviceName?: string;
}

export function InsightCard({ result, deviceName = 'Another User' }: InsightCardProps) {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="headlineSmall" style={styles.title}>
          Connection Insights
        </Text>
        
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Shared Interests
          </Text>
          {result.sharedTags.length > 0 ? (
            <View style={styles.tagsContainer}>
              {result.sharedTags.map((tag, index) => (
                <Chip key={index} style={styles.tag} textStyle={styles.tagText}>
                  {tag}
                </Chip>
              ))}
            </View>
          ) : (
            <Text style={styles.noSharedText}>
              No shared tags found, but that's okay - you might discover new interests!
            </Text>
          )}
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Similarity Score
          </Text>
          <View style={styles.similarityContainer}>
            <Text variant="displaySmall" style={styles.similarityScore}>
              {result.similarityScore}%
            </Text>
            <Text style={styles.similarityText}>
              {result.similarityScore > 70 
                ? "You think remarkably similarly!" 
                : result.similarityScore > 40 
                ? "You have some interesting overlaps."
                : "You bring unique perspectives to each other."}
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Conversation Starters
          </Text>
          {result.questions.map((question, index) => (
            <View key={index} style={styles.questionContainer}>
              <Text style={styles.questionNumber}>{index + 1}.</Text>
              <Text style={styles.questionText}>{question}</Text>
            </View>
          ))}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    backgroundColor: theme.colors.surface,
  },
  title: {
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: theme.colors.onSurface,
    marginBottom: 8,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: theme.colors.primaryContainer,
  },
  tagText: {
    color: theme.colors.onPrimaryContainer,
  },
  noSharedText: {
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  divider: {
    marginVertical: 16,
    backgroundColor: theme.colors.outline,
  },
  similarityContainer: {
    alignItems: 'center',
  },
  similarityScore: {
    color: theme.colors.secondary,
    fontWeight: 'bold',
  },
  similarityText: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 4,
  },
  questionContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingLeft: 8,
  },
  questionNumber: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 20,
  },
  questionText: {
    color: theme.colors.onSurface,
    flex: 1,
    lineHeight: 20,
  },
});
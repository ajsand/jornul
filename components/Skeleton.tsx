/**
 * Skeleton Loading Components
 * Reusable shimmer/placeholder components for loading states
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, ViewStyle, DimensionValue } from 'react-native';
import { theme } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Base skeleton with shimmer animation
 */
export function Skeleton({ width = '100%', height = 16, borderRadius = 4, style }: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
}

/**
 * Skeleton card for list items (e.g., media items in library)
 */
export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.cardContent}>
          <Skeleton width="70%" height={18} style={styles.mb8} />
          <Skeleton width="50%" height={14} />
        </View>
      </View>
    </View>
  );
}

/**
 * Skeleton for vault/library item with image preview
 */
export function SkeletonMediaItem() {
  return (
    <View style={styles.mediaItem}>
      <View style={styles.mediaRow}>
        <Skeleton width={48} height={48} borderRadius={8} />
        <View style={styles.mediaContent}>
          <Skeleton width="80%" height={16} style={styles.mb6} />
          <Skeleton width="60%" height={12} style={styles.mb6} />
          <View style={styles.tagRow}>
            <Skeleton width={60} height={20} borderRadius={10} style={styles.mr8} />
            <Skeleton width={50} height={20} borderRadius={10} style={styles.mr8} />
            <Skeleton width={40} height={20} borderRadius={10} />
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Skeleton for search results list
 */
export function SkeletonSearchList({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonMediaItem key={index} />
      ))}
    </View>
  );
}

/**
 * Skeleton for item detail page
 */
export function SkeletonItemDetail() {
  return (
    <View style={styles.detailContainer}>
      {/* Header */}
      <Skeleton width="90%" height={24} style={styles.mb12} />
      <Skeleton width="40%" height={14} style={styles.mb16} />

      {/* Image placeholder */}
      <Skeleton width="100%" height={200} borderRadius={12} style={styles.mb16} />

      {/* Tags */}
      <View style={styles.tagRow}>
        <Skeleton width={70} height={28} borderRadius={14} style={styles.mr8} />
        <Skeleton width={60} height={28} borderRadius={14} style={styles.mr8} />
        <Skeleton width={80} height={28} borderRadius={14} />
      </View>

      {/* Content */}
      <View style={styles.mt16}>
        <Skeleton width="100%" height={14} style={styles.mb8} />
        <Skeleton width="100%" height={14} style={styles.mb8} />
        <Skeleton width="80%" height={14} style={styles.mb8} />
        <Skeleton width="90%" height={14} />
      </View>
    </View>
  );
}

/**
 * Skeleton for consent topics list
 */
export function SkeletonTopicList({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.topicList}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.topicItem}>
          <Skeleton width={24} height={24} borderRadius={4} />
          <Skeleton width={100 + Math.random() * 60} height={16} style={styles.ml12} />
        </View>
      ))}
    </View>
  );
}

/**
 * Skeleton for swipe card
 */
export function SkeletonSwipeCard() {
  return (
    <View style={styles.swipeCard}>
      <Skeleton width="100%" height={300} borderRadius={16} style={styles.mb12} />
      <Skeleton width="80%" height={22} style={styles.mb8} />
      <Skeleton width="100%" height={14} style={styles.mb6} />
      <Skeleton width="60%" height={14} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: theme.colors.surfaceVariant,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.surface,
    opacity: 0.3,
    width: 100,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  mediaItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  mediaRow: {
    flexDirection: 'row',
  },
  mediaContent: {
    flex: 1,
    marginLeft: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  list: {
    padding: 12,
  },
  detailContainer: {
    padding: 16,
  },
  topicList: {
    padding: 12,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginBottom: 8,
  },
  swipeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    margin: 16,
  },
  // Spacing utilities
  mb6: { marginBottom: 6 },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  mb16: { marginBottom: 16 },
  mr8: { marginRight: 8 },
  ml12: { marginLeft: 12 },
  mt16: { marginTop: 16 },
});

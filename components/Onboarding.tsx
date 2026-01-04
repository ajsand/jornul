/**
 * Onboarding Component
 * 4-screen tutorial for first-time users
 *
 * Screens:
 * 1. Welcome + Privacy Promise
 * 2. Capture Demo (Scratch, Paste, Import)
 * 3. Swipe Gesture Tutorial
 * 4. Sync Explanation (QR Code)
 */

import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  ViewToken,
} from 'react-native';
import { Text, Button, IconButton, Surface } from 'react-native-paper';
import {
  Shield,
  ClipboardPaste,
  Heart,
  QrCode,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react-native';
import { theme } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface OnboardingScreen {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  detail?: string;
}

const SCREENS: OnboardingScreen[] = [
  {
    id: 'welcome',
    icon: <Shield size={80} color={theme.colors.primary} />,
    title: 'Welcome to JournalLink',
    description: 'Your private, local-first journal that never leaves your device.',
    detail: 'Everything stays on your phone. No cloud accounts, no tracking, no ads. Your thoughts are yours alone.',
  },
  {
    id: 'capture',
    icon: <ClipboardPaste size={80} color={theme.colors.secondary} />,
    title: 'Capture Anything',
    description: 'Save text, links, images, and more with a single tap.',
    detail: 'Use Scratch for quick notes, paste URLs to save articles, or import photos from your gallery. Tags are added automatically.',
  },
  {
    id: 'swipe',
    icon: <Heart size={80} color={theme.colors.tertiary} />,
    title: 'Swipe to Discover',
    description: 'Find new interests by swiping through curated content.',
    detail: 'Swipe right to like, left to pass. Your preferences help personalize your experience and find connections with others.',
  },
  {
    id: 'sync',
    icon: <QrCode size={80} color={theme.colors.primary} />,
    title: 'Connect In Person',
    description: 'Share interests with friends using QR codes.',
    detail: 'Meet someone interesting? Scan their QR code to compare your interests privately. No data is ever sent to the cloud.',
  },
];

export function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const isLastScreen = currentIndex === SCREENS.length - 1;
  const isFirstScreen = currentIndex === 0;

  const viewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const goToNext = () => {
    if (isLastScreen) {
      onComplete();
    } else {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const goToPrevious = () => {
    if (!isFirstScreen) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1 });
    }
  };

  const renderScreen = ({ item }: { item: OnboardingScreen }) => (
    <View style={styles.screenContainer}>
      <View style={styles.iconContainer}>{item.icon}</View>
      <Text variant="headlineMedium" style={styles.title}>
        {item.title}
      </Text>
      <Text variant="bodyLarge" style={styles.description}>
        {item.description}
      </Text>
      {item.detail && (
        <Surface style={styles.detailCard} elevation={1}>
          <Text variant="bodyMedium" style={styles.detailText}>
            {item.detail}
          </Text>
        </Surface>
      )}
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {SCREENS.map((_, index) => {
        const inputRange = [
          (index - 1) * SCREEN_WIDTH,
          index * SCREEN_WIDTH,
          (index + 1) * SCREEN_WIDTH,
        ];
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        });
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index}
            style={[styles.dot, { width: dotWidth, opacity }]}
          />
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      <View style={styles.header}>
        <IconButton
          icon={() => <X size={24} color={theme.colors.onSurfaceVariant} />}
          onPress={onSkip}
          accessibilityLabel="Skip onboarding"
        />
        <Text variant="bodySmall" style={styles.skipText}>
          {currentIndex + 1} / {SCREENS.length}
        </Text>
      </View>

      {/* Screen Content */}
      <FlatList
        ref={flatListRef}
        data={SCREENS}
        renderItem={renderScreen}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        scrollEventThrottle={32}
      />

      {/* Dots */}
      {renderDots()}

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          mode="text"
          onPress={goToPrevious}
          disabled={isFirstScreen}
          icon={() =>
            !isFirstScreen ? (
              <ChevronLeft size={20} color={theme.colors.primary} />
            ) : null
          }
          style={styles.navButton}
        >
          {isFirstScreen ? '' : 'Back'}
        </Button>

        <Button
          mode="contained"
          onPress={goToNext}
          icon={() =>
            isLastScreen ? null : (
              <ChevronRight size={20} color={theme.colors.onPrimary} />
            )
          }
          contentStyle={styles.nextButtonContent}
          style={styles.nextButton}
        >
          {isLastScreen ? 'Get Started' : 'Next'}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 48,
  },
  skipText: {
    color: theme.colors.onSurfaceVariant,
    marginRight: 16,
  },
  screenContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 120,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: theme.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    color: theme.colors.onBackground,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  description: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  detailCard: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    maxWidth: 320,
  },
  detailText: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginHorizontal: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  navButton: {
    minWidth: 80,
  },
  nextButton: {
    minWidth: 140,
  },
  nextButtonContent: {
    flexDirection: 'row-reverse',
  },
});

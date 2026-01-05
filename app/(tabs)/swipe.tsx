import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Appbar, Text, Chip, Button, IconButton, Dialog, Portal, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import {
  Heart,
  X,
  Star,
  SkipForward,
  RotateCcw,
  Filter,
  Bug,
  User,
  TrendingUp,
  TrendingDown,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react-native';
import { db } from '@/lib/storage/db';
import * as repos from '@/lib/storage/repositories';
import { SwipeMedia, SwipeDecision } from '@/lib/storage/types';
import { SWIPE_MEDIA_TYPES, SwipeMediaType } from '@/lib/data/swipeCatalog';
import { ensureCatalogSeeded } from '@/lib/services/swipeCatalogSeeder';
import {
  getRankedBatch,
  RankReason,
  DEFAULT_CONFIG,
  computePreferences,
  computeVaultPreferences,
  mergePreferences,
  PreferenceProfile,
  VaultItemSummary,
} from '@/lib/services/swipe/ranker';
import { processSwipeFeedback } from '@/lib/services/aets/feedback';
import { theme } from '@/lib/theme';
import { swipeHaptic, successHaptic, lightHaptic } from '@/lib/utils/haptics';
import { buttonA11y, swipeCardA11y, announceForAccessibility } from '@/lib/utils/accessibility';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.55;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default function SwipeScreen() {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<SwipeMedia[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [swipeHistory, setSwipeHistory] = useState<{ mediaId: string; decision: SwipeDecision }[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<SwipeMediaType[]>([]);
  const [swipeCounts, setSwipeCounts] = useState<Record<SwipeDecision, number>>({
    like: 0,
    dislike: 0,
    skip: 0,
    super_like: 0,
  });
  const [debugMode, setDebugMode] = useState(__DEV__);
  const [cardReasons, setCardReasons] = useState<RankReason[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [preferences, setPreferences] = useState<PreferenceProfile | null>(null);

  // Animation values
  const position = useRef(new Animated.ValueXY()).current;
  const rotation = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const dislikeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const nextCardScale = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [1, 0.9, 1],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const animateSwipe = (direction: 'left' | 'right' | 'up', callback: () => void) => {
    const x = direction === 'left' ? -SCREEN_WIDTH * 1.5 : direction === 'right' ? SCREEN_WIDTH * 1.5 : 0;
    const y = direction === 'up' ? -SCREEN_HEIGHT : 0;

    Animated.timing(position, {
      toValue: { x, y },
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      callback();
    });
  };

  const handleSwipe = useCallback(async (decision: SwipeDecision) => {
    if (currentIndex >= cards.length) return;

    const currentCard = cards[currentIndex];

    // Announce for accessibility
    const actionLabels: Record<SwipeDecision, string> = {
      like: 'Liked',
      dislike: 'Disliked',
      skip: 'Skipped',
      super_like: 'Super liked',
    };
    announceForAccessibility(`${actionLabels[decision]} ${currentCard.title}`);

    // Record swipe event
    if (sessionId) {
      try {
        const rawDb = db.getRawDb();
        await repos.createSwipeEvent(rawDb, {
          id: generateId(),
          session_id: sessionId,
          media_id: currentCard.id,
          decision,
          strength: decision === 'super_like' ? 1.0 : decision === 'skip' ? 0.5 : 1.0,
        });

        setSwipeCounts(prev => ({
          ...prev,
          [decision]: prev[decision] + 1,
        }));

        setSwipeHistory(prev => [...prev, { mediaId: currentCard.id, decision }]);

        // Feed swipe signal to AETS for tag confidence adjustment (non-blocking)
        processSwipeFeedback(rawDb, currentCard.id, decision, currentCard.tags_json)
          .catch(err => console.warn('[AETS] Feedback failed:', err));
      } catch (error) {
        console.error('Failed to record swipe event:', error);
      }
    }

    setCurrentIndex(prev => prev + 1);
  }, [currentIndex, cards, sessionId]);

  const swipeLeft = () => {
    swipeHaptic();
    animateSwipe('left', () => handleSwipe('dislike'));
  };

  const swipeRight = () => {
    swipeHaptic();
    animateSwipe('right', () => handleSwipe('like'));
  };

  const swipeUp = () => {
    successHaptic();
    animateSwipe('up', () => handleSwipe('super_like'));
  };

  const handleSkip = () => {
    lightHaptic();
    handleSwipe('skip');
  };

  const handleUndo = async () => {
    if (swipeHistory.length === 0 || currentIndex === 0) return;
    lightHaptic();

    const lastSwipe = swipeHistory[swipeHistory.length - 1];

    // Remove last event from DB (optional, for now just undo locally)
    setSwipeHistory(prev => prev.slice(0, -1));
    setCurrentIndex(prev => prev - 1);
    setSwipeCounts(prev => ({
      ...prev,
      [lastSwipe.decision]: Math.max(0, prev[lastSwipe.decision] - 1),
    }));
  };

  const loadCards = useCallback(async () => {
    try {
      const rawDb = db.getRawDb();

      // Ensure catalog is seeded
      await ensureCatalogSeeded(rawDb);

      // Get cards based on filters
      const filters: { type?: string } = {};
      if (selectedTypes.length === 1) {
        filters.type = selectedTypes[0];
      }

      let allCards = await repos.listSwipeMedia(rawDb, filters);

      // If multiple types selected, filter in memory
      if (selectedTypes.length > 1) {
        allCards = allCards.filter(c => selectedTypes.includes(c.type as SwipeMediaType));
      }

      // Get already swiped media IDs in current session
      if (sessionId) {
        const events = await repos.listSwipeEvents(rawDb, { session_id: sessionId });
        const swipedIds = new Set(events.map(e => e.media_id));
        allCards = allCards.filter(c => !swipedIds.has(c.id));
      }

      // Use intelligent ranking instead of random shuffle
      const swipeHistoryData = await repos.getSwipeEventsWithMedia(rawDb, { limit: 100 });
      const recentMedia = await repos.getRecentSwipedMedia(rawDb, DEFAULT_CONFIG.diversityWindow);
      const rankedItems = getRankedBatch(allCards, swipeHistoryData, recentMedia, DEFAULT_CONFIG);

      // Compute preferences from both swipes AND vault items
      const swipePreferences = computePreferences(swipeHistoryData, DEFAULT_CONFIG);

      // Load vault items for combined preference computation
      let combinedPreferences = swipePreferences;
      try {
        const vaultItems = await repos.listMediaItems(rawDb, { limit: 100, orderBy: 'created_at', orderDirection: 'DESC' });
        if (vaultItems.length > 0) {
          // Get tags for each vault item
          const vaultItemSummaries: VaultItemSummary[] = await Promise.all(
            vaultItems.map(async (item) => {
              const tags = await repos.getTagsForItem(rawDb, item.id);
              return {
                id: item.id,
                type: item.type,
                tags: tags.map(t => t.name),
                created_at: item.created_at,
              };
            })
          );
          
          // Compute vault preferences and merge with swipe preferences
          const vaultPrefs = computeVaultPreferences(vaultItemSummaries, DEFAULT_CONFIG);
          combinedPreferences = mergePreferences(swipePreferences, vaultPrefs);
          console.log(`[Swipe] Merged preferences: ${swipePreferences.totalSwipes} swipes + ${vaultItems.length} vault items`);
        }
      } catch (vaultError) {
        console.warn('[Swipe] Failed to load vault items for preferences:', vaultError);
      }
      
      setPreferences(combinedPreferences);

      // Extract cards and reasons
      setCards(rankedItems.map(r => r.item));
      setCardReasons(rankedItems.map(r => r.reason));
      setCurrentIndex(0);

      console.log(`[Swipe] Loaded ${rankedItems.length} ranked cards`);
    } catch (error) {
      console.error('Failed to load cards:', error);
    }
  }, [selectedTypes, sessionId]);

  const initializeSession = useCallback(async () => {
    try {
      await db.init();
      const rawDb = db.getRawDb();

      // Create a new session
      const newSessionId = generateId();
      await repos.createSwipeSession(rawDb, {
        id: newSessionId,
        filters_json: selectedTypes.length > 0 ? JSON.stringify(selectedTypes) : null,
      });
      setSessionId(newSessionId);

      // Load swipe counts from all sessions
      const counts = await repos.countSwipeEventsByDecision(rawDb);
      setSwipeCounts(counts);

      await loadCards();
    } catch (error) {
      console.error('Failed to initialize session:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTypes, loadCards]);

  useEffect(() => {
    initializeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!loading && sessionId) {
        loadCards();
      }
    }, [loading, sessionId, loadCards])
  );

  const toggleTypeFilter = (type: SwipeMediaType) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  useEffect(() => {
    if (sessionId) {
      loadCards();
    }
  }, [selectedTypes, sessionId, loadCards]);

  const currentCard = cards[currentIndex];
  const nextCard = cards[currentIndex + 1];

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      book: '#8B4513',
      movie: '#DC143C',
      tv: '#4169E1',
      podcast: '#9932CC',
      game: '#228B22',
      music: '#FF1493',
      youtube: '#FF0000',
      documentary: '#20B2AA',
      standup: '#FFD700',
      sports: '#FF8C00',
      essay: '#708090',
      public_figure: '#4B0082',
    };
    return colors[type] || theme.colors.primary;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.Content title="Discover" titleStyle={styles.headerTitle} />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading cards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Discover" titleStyle={styles.headerTitle} />
        {__DEV__ && (
          <IconButton
            icon={() => (
              <Bug
                size={22}
                color={debugMode ? theme.colors.primary : theme.colors.onSurface}
              />
            )}
            onPress={() => setDebugMode(!debugMode)}
          />
        )}
        <IconButton
          icon={() => (
            <User
              size={22}
              color={preferences && preferences.totalSwipes > 0 ? theme.colors.primary : theme.colors.onSurface}
            />
          )}
          onPress={() => setShowProfile(true)}
        />
        <IconButton
          icon={() => (
            <Filter
              size={22}
              color={selectedTypes.length > 0 ? theme.colors.primary : theme.colors.onSurface}
            />
          )}
          onPress={() => setShowFilters(!showFilters)}
        />
      </Appbar.Header>

      {/* Filter chips */}
      {showFilters && (
        <View style={styles.filterContainer}>
          <View style={styles.filterChips}>
            {SWIPE_MEDIA_TYPES.map(({ type, label }) => (
              <Chip
                key={type}
                selected={selectedTypes.includes(type)}
                onPress={() => toggleTypeFilter(type)}
                style={[
                  styles.filterChip,
                  selectedTypes.includes(type) && { backgroundColor: getTypeColor(type) + '40' },
                ]}
                compact
              >
                {label}
              </Chip>
            ))}
          </View>
        </View>
      )}

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Heart size={14} color={theme.colors.error} fill={theme.colors.error} />
          <Text style={styles.statText}>{swipeCounts.like}</Text>
        </View>
        <View style={styles.stat}>
          <X size={14} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.statText}>{swipeCounts.dislike}</Text>
        </View>
        <View style={styles.stat}>
          <Star size={14} color="#FFD700" fill="#FFD700" />
          <Text style={styles.statText}>{swipeCounts.super_like}</Text>
        </View>
        <Text style={styles.remainingText}>
          {cards.length - currentIndex} remaining
        </Text>
      </View>

      {/* Card deck */}
      <View style={styles.cardContainer}>
        {currentIndex >= cards.length ? (
          <View style={styles.emptyContainer}>
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              All caught up!
            </Text>
            <Text style={styles.emptyText}>
              {selectedTypes.length > 0
                ? 'No more items in selected categories.'
                : 'You\'ve seen all the cards.'}
            </Text>
            <Button
              mode="contained"
              onPress={() => {
                setSelectedTypes([]);
                loadCards();
              }}
              style={styles.resetButton}
            >
              Reset & Start Over
            </Button>
          </View>
        ) : (
          <>
            {/* Next card (behind) */}
            {nextCard && (
              <Animated.View
                style={[
                  styles.card,
                  styles.nextCard,
                  { transform: [{ scale: nextCardScale }] },
                ]}
              >
                <View style={[styles.cardTypeTag, { backgroundColor: getTypeColor(nextCard.type) }]}>
                  <Text style={styles.cardTypeText}>
                    {SWIPE_MEDIA_TYPES.find(t => t.type === nextCard.type)?.label || nextCard.type}
                  </Text>
                </View>
                <View style={styles.cardContent}>
                  <Text variant="headlineMedium" style={styles.cardTitle} numberOfLines={2}>
                    {nextCard.title}
                  </Text>
                  <Text style={styles.cardDesc} numberOfLines={3}>
                    {nextCard.short_desc}
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Current card (front) */}
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.card,
                {
                  transform: [
                    { translateX: position.x },
                    { translateY: position.y },
                    { rotate: rotation },
                  ],
                },
              ]}
              {...swipeCardA11y(currentCard.title, currentIndex, cards.length)}
              onAccessibilityAction={(event) => {
                switch (event.nativeEvent.actionName) {
                  case 'magicTap':
                    swipeUp();
                    break;
                  case 'escape':
                    swipeLeft();
                    break;
                  case 'activate':
                    swipeRight();
                    break;
                }
              }}
            >
              {/* Like overlay */}
              <Animated.View style={[styles.overlayLabel, styles.likeLabel, { opacity: likeOpacity }]}>
                <Text style={styles.overlayText}>LIKE</Text>
              </Animated.View>

              {/* Dislike overlay */}
              <Animated.View style={[styles.overlayLabel, styles.dislikeLabel, { opacity: dislikeOpacity }]}>
                <Text style={styles.overlayText}>NOPE</Text>
              </Animated.View>

              <View style={[styles.cardTypeTag, { backgroundColor: getTypeColor(currentCard.type) }]}>
                <Text style={styles.cardTypeText}>
                  {SWIPE_MEDIA_TYPES.find(t => t.type === currentCard.type)?.label || currentCard.type}
                </Text>
              </View>

              {/* Debug badge - shows ranking reason */}
              {debugMode && cardReasons[currentIndex] && (
                <View style={styles.debugBadge}>
                  <Text style={styles.debugBadgeText}>
                    {cardReasons[currentIndex].toUpperCase()}
                  </Text>
                </View>
              )}

              <View style={styles.cardContent}>
                <Text variant="headlineMedium" style={styles.cardTitle} numberOfLines={2}>
                  {currentCard.title}
                </Text>
                <Text style={styles.cardDesc} numberOfLines={4}>
                  {currentCard.short_desc}
                </Text>

                {currentCard.tags_json && (
                  <View style={styles.cardTags}>
                    {JSON.parse(currentCard.tags_json).slice(0, 3).map((tag: string) => (
                      <Chip key={tag} compact style={styles.cardTag} textStyle={styles.cardTagText}>
                        {tag}
                      </Chip>
                    ))}
                  </View>
                )}
              </View>
            </Animated.View>
          </>
        )}
      </View>

      {/* Action buttons */}
      {currentIndex < cards.length && (
        <View style={styles.actions} accessibilityRole="toolbar">
          <IconButton
            icon={() => <RotateCcw size={20} color={theme.colors.onSurfaceVariant} />}
            mode="contained"
            containerColor={theme.colors.surfaceVariant}
            size={24}
            onPress={handleUndo}
            disabled={swipeHistory.length === 0}
            {...buttonA11y('Undo last swipe', {
              hint: 'Go back to the previous card',
              disabled: swipeHistory.length === 0,
            })}
          />
          <IconButton
            icon={() => <X size={32} color={theme.colors.error} />}
            mode="contained"
            containerColor={theme.colors.errorContainer}
            size={40}
            onPress={swipeLeft}
            {...buttonA11y('Dislike', { hint: 'Swipe this card left to dislike' })}
          />
          <IconButton
            icon={() => <SkipForward size={20} color={theme.colors.onSurfaceVariant} />}
            mode="contained"
            containerColor={theme.colors.surfaceVariant}
            size={24}
            onPress={handleSkip}
            {...buttonA11y('Skip', { hint: 'Skip this card without rating' })}
          />
          <IconButton
            icon={() => <Heart size={32} color="#4CAF50" />}
            mode="contained"
            containerColor="#E8F5E9"
            size={40}
            onPress={swipeRight}
            {...buttonA11y('Like', { hint: 'Swipe this card right to like' })}
          />
          <IconButton
            icon={() => <Star size={20} color="#FFD700" />}
            mode="contained"
            containerColor="#FFF8E1"
            size={24}
            onPress={swipeUp}
            {...buttonA11y('Super Like', { hint: 'Swipe up to super like this card' })}
          />
        </View>
      )}

      {/* Profile Dialog */}
      <Portal>
        <Dialog visible={showProfile} onDismiss={() => setShowProfile(false)} style={styles.profileDialog}>
          <Dialog.Title style={styles.profileTitle}>Your Preferences</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={styles.profileScroll}>
              {preferences && preferences.totalSwipes > 0 ? (
                <>
                  <View style={styles.profileStats}>
                    <Text style={styles.profileSwipeCount}>
                      Based on {preferences.totalSwipes} interaction{preferences.totalSwipes !== 1 ? 's' : ''}
                    </Text>
                  </View>

                  {/* Top Liked Tags */}
                  <View style={styles.profileSection}>
                    <View style={styles.profileSectionHeader}>
                      <TrendingUp size={18} color="#4CAF50" />
                      <Text variant="titleSmall" style={styles.profileSectionTitle}>
                        You lean toward...
                      </Text>
                    </View>
                    <View style={styles.preferenceTags}>
                      {Array.from(preferences.tags.entries())
                        .filter(([, pref]) => pref.weight > 0.1)
                        .sort((a, b) => b[1].weight - a[1].weight)
                        .slice(0, 6)
                        .map(([tag, pref]) => (
                          <Chip
                            key={tag}
                            compact
                            style={[styles.preferenceChip, styles.likeChip]}
                            textStyle={styles.preferenceChipText}
                            icon={() => <ThumbsUp size={12} color="#4CAF50" />}
                          >
                            {tag} ({Math.round(pref.weight * 100)}%)
                          </Chip>
                        ))}
                      {Array.from(preferences.tags.entries()).filter(([, pref]) => pref.weight > 0.1).length === 0 && (
                        <Text style={styles.noDataText}>Keep swiping to discover your interests!</Text>
                      )}
                    </View>
                  </View>

                  <Divider style={styles.profileDivider} />

                  {/* Top Disliked Tags */}
                  <View style={styles.profileSection}>
                    <View style={styles.profileSectionHeader}>
                      <TrendingDown size={18} color={theme.colors.error} />
                      <Text variant="titleSmall" style={styles.profileSectionTitle}>
                        Not for you...
                      </Text>
                    </View>
                    <View style={styles.preferenceTags}>
                      {Array.from(preferences.tags.entries())
                        .filter(([, pref]) => pref.weight < -0.1)
                        .sort((a, b) => a[1].weight - b[1].weight)
                        .slice(0, 4)
                        .map(([tag, pref]) => (
                          <Chip
                            key={tag}
                            compact
                            style={[styles.preferenceChip, styles.dislikeChip]}
                            textStyle={styles.preferenceChipText}
                            icon={() => <ThumbsDown size={12} color={theme.colors.error} />}
                          >
                            {tag}
                          </Chip>
                        ))}
                      {Array.from(preferences.tags.entries()).filter(([, pref]) => pref.weight < -0.1).length === 0 && (
                        <Text style={styles.noDataText}>No strong dislikes yet</Text>
                      )}
                    </View>
                  </View>

                  <Divider style={styles.profileDivider} />

                  {/* Type Preferences */}
                  <View style={styles.profileSection}>
                    <View style={styles.profileSectionHeader}>
                      <Star size={18} color="#FFD700" />
                      <Text variant="titleSmall" style={styles.profileSectionTitle}>
                        Favorite categories
                      </Text>
                    </View>
                    <View style={styles.preferenceTags}>
                      {Array.from(preferences.types.entries())
                        .filter(([, pref]) => pref.weight > 0)
                        .sort((a, b) => b[1].weight - a[1].weight)
                        .slice(0, 5)
                        .map(([type, pref]) => {
                          const typeInfo = SWIPE_MEDIA_TYPES.find(t => t.type === type);
                          return (
                            <Chip
                              key={type}
                              compact
                              style={[styles.preferenceChip, { backgroundColor: getTypeColor(type) + '30' }]}
                              textStyle={styles.preferenceChipText}
                            >
                              {typeInfo?.label || type}
                            </Chip>
                          );
                        })}
                    </View>
                  </View>
                </>
              ) : (
                <View style={styles.noDataContainer}>
                  <User size={48} color={theme.colors.onSurfaceVariant} />
                  <Text style={styles.noDataTitle}>No preferences yet</Text>
                  <Text style={styles.noDataText}>
                    Start swiping to discover your interests!{'\n'}
                    Your preferences will appear here.
                  </Text>
                </View>
              )}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowProfile(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.onSurfaceVariant,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    marginBottom: 4,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 16,
    backgroundColor: theme.colors.surface,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    fontWeight: '600',
  },
  remainingText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 'auto',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  nextCard: {
    opacity: 0.8,
  },
  cardTypeTag: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cardTypeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
  },
  cardTitle: {
    color: theme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDesc: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 16,
    lineHeight: 24,
  },
  cardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 16,
  },
  cardTag: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  cardTagText: {
    fontSize: 11,
  },
  debugBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  debugBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  overlayLabel: {
    position: 'absolute',
    top: 60,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 3,
    zIndex: 10,
  },
  likeLabel: {
    right: 20,
    borderColor: '#4CAF50',
    transform: [{ rotate: '15deg' }],
  },
  dislikeLabel: {
    left: 20,
    borderColor: theme.colors.error,
    transform: [{ rotate: '-15deg' }],
  },
  overlayText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  emptyText: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 24,
  },
  resetButton: {
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.surface,
  },
  // Profile dialog styles
  profileDialog: {
    maxHeight: '80%',
  },
  profileTitle: {
    color: theme.colors.onSurface,
  },
  profileScroll: {
    maxHeight: 400,
  },
  profileStats: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileSwipeCount: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
  },
  profileSection: {
    marginVertical: 8,
  },
  profileSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  profileSectionTitle: {
    color: theme.colors.onSurface,
    fontWeight: '600',
  },
  profileDivider: {
    marginVertical: 12,
  },
  preferenceTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  preferenceChip: {
    marginBottom: 4,
  },
  likeChip: {
    backgroundColor: '#E8F5E9',
  },
  dislikeChip: {
    backgroundColor: theme.colors.errorContainer,
  },
  preferenceChipText: {
    fontSize: 12,
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 24,
  },
  noDataTitle: {
    color: theme.colors.onSurface,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataText: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
});

/**
 * Collapsible Filters Component
 * Responsive filter panel that collapses to save space on small screens
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  useWindowDimensions,
} from 'react-native';
import { Text, Chip, Divider, IconButton, TouchableRipple } from 'react-native-paper';
import { ChevronDown, ChevronUp, X, Tag } from 'lucide-react-native';
import { theme } from '@/lib/theme';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Breakpoint for compact mode
const SMALL_SCREEN_WIDTH = 380;

export interface FilterSection {
  key: string;
  label: string;
  icon?: React.ReactNode;
  options: { value: string; label: string }[];
  selectedValue: string | null;
  onSelect: (value: string | null) => void;
}

export interface ActiveFilter {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onRemove: () => void;
}

interface CollapsibleFiltersProps {
  sections: FilterSection[];
  activeFilters: ActiveFilter[];
  onClearAll: () => void;
  // Tag filters (optional separate section)
  tagFilters?: {
    available: { name: string; count: number }[];
    selected: string[];
    onToggle: (tagName: string) => void;
  };
}

export function CollapsibleFilters({
  sections,
  activeFilters,
  onClearAll,
  tagFilters,
}: CollapsibleFiltersProps) {
  const { width: screenWidth } = useWindowDimensions();
  const isCompact = screenWidth < SMALL_SCREEN_WIDTH;

  // Track which sections are expanded (default: all collapsed on small screens)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    isCompact ? new Set() : new Set(sections.map(s => s.key))
  );

  const toggleSection = useCallback((key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const hasActiveFilters = activeFilters.length > 0;

  return (
    <View style={styles.container}>
      {/* Active filters row */}
      {hasActiveFilters && (
        <View style={styles.activeFiltersRow}>
          <Text style={styles.sectionLabel}>Active:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.activeFiltersScroll}
            contentContainerStyle={styles.activeFiltersContent}
          >
            {activeFilters.map(filter => (
              <Chip
                key={filter.key}
                compact
                onClose={filter.onRemove}
                style={styles.activeChip}
                textStyle={styles.activeChipText}
                icon={filter.icon ? () => filter.icon : undefined}
              >
                {filter.label}
              </Chip>
            ))}
          </ScrollView>
          <IconButton
            icon={() => <X size={16} color={theme.colors.onSurfaceVariant} />}
            size={20}
            onPress={onClearAll}
            accessibilityLabel="Clear all filters"
          />
        </View>
      )}

      <Divider style={styles.divider} />

      {/* Filter sections */}
      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.key);
        const hasSelection = section.selectedValue !== null;

        return (
          <View key={section.key}>
            {/* Section header (tappable to expand/collapse on small screens) */}
            <TouchableRipple
              onPress={isCompact ? () => toggleSection(section.key) : undefined}
              style={styles.sectionHeader}
              accessibilityRole="button"
              accessibilityState={{ expanded: isExpanded }}
              accessibilityLabel={`${section.label} filters${hasSelection ? ', active' : ''}`}
            >
              <View style={styles.sectionHeaderContent}>
                {section.icon && <View style={styles.sectionIcon}>{section.icon}</View>}
                <Text style={[
                  styles.sectionLabel,
                  hasSelection && styles.sectionLabelActive,
                ]}>
                  {section.label}
                </Text>
                {hasSelection && !isExpanded && (
                  <Chip compact style={styles.collapsedChip} textStyle={styles.collapsedChipText}>
                    {section.options.find(o => o.value === section.selectedValue)?.label}
                  </Chip>
                )}
                {isCompact && (
                  <View style={styles.expandIcon}>
                    {isExpanded
                      ? <ChevronUp size={18} color={theme.colors.onSurfaceVariant} />
                      : <ChevronDown size={18} color={theme.colors.onSurfaceVariant} />
                    }
                  </View>
                )}
              </View>
            </TouchableRipple>

            {/* Section content */}
            {(isExpanded || !isCompact) && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.sectionContent}
                contentContainerStyle={styles.chipRow}
              >
                {section.options.map(option => (
                  <Chip
                    key={option.value}
                    selected={section.selectedValue === option.value}
                    onPress={() => section.onSelect(
                      section.selectedValue === option.value ? null : option.value
                    )}
                    style={styles.filterChip}
                    compact
                  >
                    {option.label}
                  </Chip>
                ))}
              </ScrollView>
            )}
          </View>
        );
      })}

      {/* Tag filters */}
      {tagFilters && tagFilters.available.length > 0 && (
        <>
          <Divider style={styles.divider} />
          <View style={styles.tagSection}>
            <View style={styles.tagHeader}>
              <Tag size={14} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.sectionLabel}>Tags</Text>
              {tagFilters.selected.length > 0 && (
                <Chip compact style={styles.tagCountChip}>
                  {tagFilters.selected.length}
                </Chip>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {tagFilters.available.map(tag => (
                <Chip
                  key={tag.name}
                  selected={tagFilters.selected.includes(tag.name)}
                  onPress={() => tagFilters.onToggle(tag.name)}
                  style={styles.tagChip}
                  compact
                >
                  {tag.name} ({tag.count})
                </Chip>
              ))}
            </ScrollView>
          </View>
        </>
      )}

      <Divider style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    paddingBottom: 4,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  activeFiltersScroll: {
    flex: 1,
    marginLeft: 8,
  },
  activeFiltersContent: {
    gap: 8,
  },
  activeChip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  activeChipText: {
    color: theme.colors.onPrimaryContainer,
    fontSize: 12,
  },
  divider: {
    backgroundColor: theme.colors.outline,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionLabelActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  expandIcon: {
    marginLeft: 'auto',
  },
  collapsedChip: {
    marginLeft: 8,
    backgroundColor: theme.colors.primaryContainer,
    height: 24,
  },
  collapsedChipText: {
    fontSize: 11,
    color: theme.colors.onPrimaryContainer,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  tagSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  tagCountChip: {
    backgroundColor: theme.colors.secondaryContainer,
    height: 20,
    marginLeft: 'auto',
  },
  tagChip: {
    backgroundColor: theme.colors.tertiaryContainer,
  },
});

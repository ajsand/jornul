/**
 * Accessibility Utilities
 * Provides consistent accessibility props and helpers across the app
 */

import { AccessibilityRole, AccessibilityState, Platform } from 'react-native';

/**
 * Create accessibility props for a button
 */
export function buttonA11y(
  label: string,
  options?: {
    hint?: string;
    disabled?: boolean;
    selected?: boolean;
  }
): {
  accessible: true;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
} {
  const props: any = {
    accessible: true,
    accessibilityRole: 'button' as AccessibilityRole,
    accessibilityLabel: label,
  };

  if (options?.hint) {
    props.accessibilityHint = options.hint;
  }

  if (options?.disabled !== undefined || options?.selected !== undefined) {
    props.accessibilityState = {};
    if (options?.disabled !== undefined) {
      props.accessibilityState.disabled = options.disabled;
    }
    if (options?.selected !== undefined) {
      props.accessibilityState.selected = options.selected;
    }
  }

  return props;
}

/**
 * Create accessibility props for a link
 */
export function linkA11y(
  label: string,
  hint?: string
): {
  accessible: true;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint?: string;
} {
  return {
    accessible: true,
    accessibilityRole: 'link' as AccessibilityRole,
    accessibilityLabel: label,
    ...(hint && { accessibilityHint: hint }),
  };
}

/**
 * Create accessibility props for an image
 */
export function imageA11y(
  description: string
): {
  accessible: true;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
} {
  return {
    accessible: true,
    accessibilityRole: 'image' as AccessibilityRole,
    accessibilityLabel: description,
  };
}

/**
 * Create accessibility props for a header/title
 */
export function headerA11y(
  text: string
): {
  accessible: true;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
} {
  return {
    accessible: true,
    accessibilityRole: 'header' as AccessibilityRole,
    accessibilityLabel: text,
  };
}

/**
 * Create accessibility props for a checkbox or toggle
 */
export function toggleA11y(
  label: string,
  checked: boolean,
  hint?: string
): {
  accessible: true;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityState: AccessibilityState;
  accessibilityHint?: string;
} {
  return {
    accessible: true,
    accessibilityRole: Platform.OS === 'ios' ? 'switch' : 'checkbox',
    accessibilityLabel: label,
    accessibilityState: { checked },
    ...(hint && { accessibilityHint: hint }),
  };
}

/**
 * Create accessibility props for a list item
 */
export function listItemA11y(
  label: string,
  options?: {
    hint?: string;
    position?: { index: number; total: number };
    selected?: boolean;
  }
): {
  accessible: true;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
} {
  let fullLabel = label;
  if (options?.position) {
    fullLabel = `${label}, item ${options.position.index + 1} of ${options.position.total}`;
  }

  return {
    accessible: true,
    accessibilityRole: 'button' as AccessibilityRole,
    accessibilityLabel: fullLabel,
    ...(options?.hint && { accessibilityHint: options.hint }),
    ...(options?.selected !== undefined && {
      accessibilityState: { selected: options.selected },
    }),
  };
}

/**
 * Create accessibility props for swipeable card
 */
export function swipeCardA11y(
  title: string,
  index: number,
  total: number
): {
  accessible: true;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint: string;
  accessibilityActions: Array<{ name: string; label: string }>;
} {
  return {
    accessible: true,
    accessibilityRole: 'button' as AccessibilityRole,
    accessibilityLabel: `${title}, card ${index + 1} of ${total}`,
    accessibilityHint: 'Swipe left to dislike, swipe right to like, swipe up to super like',
    accessibilityActions: [
      { name: 'magicTap', label: 'Super like' },
      { name: 'escape', label: 'Dislike' },
      { name: 'activate', label: 'Like' },
    ],
  };
}

/**
 * Create accessibility props for a tab
 */
export function tabA11y(
  label: string,
  selected: boolean,
  index: number,
  total: number
): {
  accessible: true;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityState: AccessibilityState;
} {
  return {
    accessible: true,
    accessibilityRole: 'tab' as AccessibilityRole,
    accessibilityLabel: `${label}, tab ${index + 1} of ${total}`,
    accessibilityState: { selected },
  };
}

/**
 * Create accessibility props for progress/loading
 */
export function progressA11y(
  label: string,
  value?: number
): {
  accessible: true;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityValue?: { min: number; max: number; now: number };
} {
  const props: any = {
    accessible: true,
    accessibilityRole: 'progressbar' as AccessibilityRole,
    accessibilityLabel: label,
  };

  if (value !== undefined) {
    props.accessibilityValue = {
      min: 0,
      max: 100,
      now: Math.round(value * 100),
    };
  }

  return props;
}

/**
 * Announce message to screen reader
 */
export function announceForAccessibility(message: string): void {
  // Import dynamically to avoid initialization issues
  const { AccessibilityInfo } = require('react-native');
  AccessibilityInfo.announceForAccessibility(message);
}

/**
 * Format time duration for screen readers
 */
export function formatDurationForA11y(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seconds`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }
  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} and ${remainingSeconds} seconds`;
}

/**
 * Format file size for screen readers
 */
export function formatFileSizeForA11y(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  }
  if (bytes < 1024 * 1024) {
    const kb = Math.round(bytes / 1024);
    return `${kb} kilobytes`;
  }
  const mb = (bytes / (1024 * 1024)).toFixed(1);
  return `${mb} megabytes`;
}

import { MD3DarkTheme } from 'react-native-paper';

export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#673AB7', // Deep Purple 800
    onPrimary: '#FFFFFF',
    primaryContainer: '#512DA8',
    onPrimaryContainer: '#E1BEE7',
    secondary: '#FFC107', // Amber 400
    onSecondary: '#000000',
    secondaryContainer: '#FF8F00',
    onSecondaryContainer: '#FFF8E1',
    tertiary: '#26A69A', // Teal
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#004D40',
    onTertiaryContainer: '#A7FFEB',
    background: '#121212',
    onBackground: '#FFFFFF',
    surface: '#1E1E1E',
    onSurface: '#FFFFFF',
    surfaceVariant: '#2D2D2D',
    onSurfaceVariant: '#CCCCCC',
    outline: '#404040',
    error: '#CF6679',
    onError: '#FFFFFF',
    // Accessibility focus colors
    focus: '#90CAF9', // Light Blue for high contrast focus rings
    focusOutline: '#42A5F5', // Slightly darker for borders
  },
};

/**
 * Accessibility styling helpers
 */
export const a11yStyles = {
  /** Focus ring style for custom touchable components */
  focusRing: {
    borderWidth: 2,
    borderColor: theme.colors.focus,
  },
  /** Minimum touch target size (44x44 per WCAG) */
  minTouchTarget: {
    minWidth: 44,
    minHeight: 44,
  },
};
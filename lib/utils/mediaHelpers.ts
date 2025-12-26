import { MediaItem } from '@/lib/storage/types';
import { format, formatDistanceToNow } from 'date-fns';

/**
 * Get a display title for a media item with fallback logic
 */
export function getMediaTitle(item: MediaItem): string {
  if (item.title?.trim()) {
    return item.title.trim();
  }
  
  if (item.extracted_text?.trim()) {
    return item.extracted_text.trim().slice(0, 50) + 
           (item.extracted_text.length > 50 ? '...' : '');
  }
  
  if (item.notes?.trim()) {
    return item.notes.trim().slice(0, 50) + 
           (item.notes.length > 50 ? '...' : '');
  }
  
  // Capitalize first letter of type
  const typeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1);
  return `${typeLabel} item`;
}

/**
 * Get a preview text for a media item (for subtitle/description)
 */
export function getMediaPreview(item: MediaItem): string {
  const content = item.notes || item.extracted_text || '';
  if (!content.trim()) return '';
  
  const cleaned = content.trim();
  return cleaned.slice(0, 100) + (cleaned.length > 100 ? '...' : '');
}

/**
 * Format a timestamp for display in the media list
 * Shows relative time for recent items, absolute date for older ones
 */
export function formatMediaDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  // Show relative time for items less than 7 days old
  if (diffInDays < 7) {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  
  // Show absolute date for older items
  if (diffInDays < 365) {
    return format(date, 'MMM d');
  }
  
  return format(date, 'MMM d, yyyy');
}


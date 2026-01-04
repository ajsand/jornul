/**
 * URL Metadata Service
 * Fetches titles, descriptions, and content from URLs
 * Supports YouTube and general web pages
 */

import { extractTitleKeyphrases } from './aets/keyphrase';

export interface UrlMetadata {
  url: string;
  title: string | null;
  description: string | null;
  siteName: string | null;
  type: 'youtube' | 'webpage' | 'unknown';
  thumbnailUrl: string | null;
  author: string | null;
  keywords: string[];
  fetchedAt: number;
  error?: string;
}

export interface MultiUrlAnalysis {
  urls: UrlMetadata[];
  combinedTitle: string;
  combinedKeywords: string[];
  commonThemes: string[];
}

/**
 * Extract all URLs from text
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  const matches = text.match(urlRegex) || [];
  // Deduplicate and normalize
  const unique = [...new Set(matches.map(url => url.replace(/[.,;:!?)]+$/, '')))];
  return unique;
}

/**
 * Check if URL is a YouTube video
 */
export function isYouTubeUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?(youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts\/)/i.test(url);
}

/**
 * Extract YouTube video ID from URL
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/i,
    /youtu\.be\/([^?]+)/i,
    /youtube\.com\/shorts\/([^?]+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Fetch YouTube video metadata using oEmbed (no API key required)
 */
async function fetchYouTubeMetadata(url: string): Promise<UrlMetadata> {
  const videoId = extractYouTubeVideoId(url);
  const result: UrlMetadata = {
    url,
    title: null,
    description: null,
    siteName: 'YouTube',
    type: 'youtube',
    thumbnailUrl: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null,
    author: null,
    keywords: [],
    fetchedAt: Date.now(),
  };

  try {
    // Use YouTube's oEmbed endpoint (doesn't require API key)
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl);

    if (response.ok) {
      const data = await response.json();
      result.title = data.title || null;
      result.author = data.author_name || null;
      result.thumbnailUrl = data.thumbnail_url || result.thumbnailUrl;

      // Extract keywords from title
      if (data.title) {
        result.keywords = extractKeywordsFromText(data.title);
      }
      if (data.author_name) {
        result.keywords.push(data.author_name.toLowerCase());
      }
    }
  } catch (error) {
    console.error('Failed to fetch YouTube metadata:', error);
    result.error = 'Failed to fetch YouTube metadata';
  }

  return result;
}

/**
 * Fetch general webpage metadata
 * Note: This may fail due to CORS restrictions on many sites
 */
async function fetchWebpageMetadata(url: string): Promise<UrlMetadata> {
  const result: UrlMetadata = {
    url,
    title: null,
    description: null,
    siteName: null,
    type: 'webpage',
    thumbnailUrl: null,
    author: null,
    keywords: [],
    fetchedAt: Date.now(),
  };

  try {
    // Extract domain for siteName
    const urlObj = new URL(url);
    result.siteName = urlObj.hostname.replace(/^www\./, '');

    // Try to fetch the page (may fail due to CORS)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'text/html',
      },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const html = await response.text();

      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        result.title = decodeHtmlEntities(titleMatch[1].trim());
      }

      // Extract meta description
      const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
      if (descMatch) {
        result.description = decodeHtmlEntities(descMatch[1].trim());
      }

      // Extract og:title if no title found
      if (!result.title) {
        const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
        if (ogTitleMatch) {
          result.title = decodeHtmlEntities(ogTitleMatch[1].trim());
        }
      }

      // Extract og:description
      if (!result.description) {
        const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
        if (ogDescMatch) {
          result.description = decodeHtmlEntities(ogDescMatch[1].trim());
        }
      }

      // Extract og:image
      const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
      if (ogImageMatch) {
        result.thumbnailUrl = ogImageMatch[1];
      }

      // Extract og:site_name
      const ogSiteMatch = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i);
      if (ogSiteMatch) {
        result.siteName = decodeHtmlEntities(ogSiteMatch[1].trim());
      }

      // Extract keywords from meta tag
      const keywordsMatch = html.match(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["']/i);
      if (keywordsMatch) {
        result.keywords = keywordsMatch[1].split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 2);
      }

      // Extract keywords from title and description
      if (result.title) {
        result.keywords = [...result.keywords, ...extractKeywordsFromText(result.title)];
      }
      if (result.description) {
        result.keywords = [...result.keywords, ...extractKeywordsFromText(result.description)];
      }

      // Deduplicate keywords
      result.keywords = [...new Set(result.keywords)];
    }
  } catch (error: any) {
    // CORS errors are expected for many sites
    if (error.name === 'AbortError') {
      result.error = 'Request timeout';
    } else {
      result.error = 'Could not fetch page (CORS or network error)';
    }

    // Fall back to extracting info from URL
    try {
      const urlObj = new URL(url);
      result.siteName = urlObj.hostname.replace(/^www\./, '');

      // Try to extract meaningful info from URL path
      const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0);
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        // Clean up URL slug to create a title
        const cleanTitle = lastPart
          .replace(/[-_]/g, ' ')
          .replace(/\.[^.]+$/, '') // Remove file extension
          .replace(/\d{4,}/g, '') // Remove long numbers
          .trim();
        if (cleanTitle.length > 3) {
          result.title = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
        }
      }

      result.keywords = extractKeywordsFromText(result.siteName);
    } catch {
      // Ignore URL parsing errors
    }
  }

  return result;
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}

/**
 * Extract keywords from text using enhanced keyphrase extraction
 * Uses the AETS keyphrase module for better quality tags
 */
function extractKeywordsFromText(text: string): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Use the enhanced title keyphrase extraction which handles:
  // - Proper noun detection (Bruno Mars, LeBron James)
  // - Category detection (music, basketball, etc.)
  // - Stopword filtering (verbs, adjectives, vague words)
  const keyphrases = extractTitleKeyphrases(text);

  // Return just the phrase strings
  return keyphrases.map((kp) => kp.phrase);
}

/**
 * Fetch metadata for a single URL
 */
export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
  if (isYouTubeUrl(url)) {
    return fetchYouTubeMetadata(url);
  }
  return fetchWebpageMetadata(url);
}

/**
 * Analyze multiple URLs and find common themes
 */
export async function analyzeMultipleUrls(urls: string[]): Promise<MultiUrlAnalysis> {
  // Fetch metadata for all URLs in parallel
  const metadataPromises = urls.map(url => fetchUrlMetadata(url));
  const metadataResults = await Promise.all(metadataPromises);

  // Collect all keywords
  const allKeywords: string[] = [];
  const keywordCounts = new Map<string, number>();

  for (const metadata of metadataResults) {
    for (const keyword of metadata.keywords) {
      allKeywords.push(keyword);
      keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
    }
  }

  // Find common themes (keywords that appear in multiple URLs)
  const commonThemes = Array.from(keywordCounts.entries())
    .filter(([_, count]) => count > 1 || urls.length === 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword]) => keyword);

  // Generate combined title
  let combinedTitle = '';

  // If all URLs are from the same site, include site name
  const siteNames = [...new Set(metadataResults.map(m => m.siteName).filter(Boolean))];

  if (commonThemes.length > 0) {
    // Use common themes to create title
    const titleThemes = commonThemes.slice(0, 3).map(t =>
      t.charAt(0).toUpperCase() + t.slice(1)
    );
    combinedTitle = titleThemes.join(' - ');
  } else if (metadataResults.length === 1 && metadataResults[0].title) {
    combinedTitle = metadataResults[0].title;
  } else if (siteNames.length === 1) {
    combinedTitle = `Collection from ${siteNames[0]}`;
  } else {
    combinedTitle = 'Link Collection';
  }

  // Deduplicate all keywords
  const combinedKeywords = [...new Set(allKeywords)];

  return {
    urls: metadataResults,
    combinedTitle,
    combinedKeywords,
    commonThemes,
  };
}

/**
 * Check if text contains URLs
 */
export function containsUrls(text: string): boolean {
  return extractUrls(text).length > 0;
}

/**
 * Count URLs in text
 */
export function countUrls(text: string): number {
  return extractUrls(text).length;
}

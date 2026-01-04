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
    keywords: ['youtube'], // Always include platform as a keyword
    fetchedAt: Date.now(),
  };

  try {
    // Add timeout for network requests (5 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // Use YouTube's oEmbed endpoint (doesn't require API key)
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      result.title = data.title || null;
      result.author = data.author_name || null;
      result.thumbnailUrl = data.thumbnail_url || result.thumbnailUrl;

      // Extract keywords from title
      if (data.title) {
        result.keywords = [...result.keywords, ...extractKeywordsFromText(data.title)];
      }
      if (data.author_name) {
        result.keywords.push(data.author_name.toLowerCase());
      }
      
      // Deduplicate keywords
      result.keywords = [...new Set(result.keywords)];
    } else {
      result.error = `HTTP ${response.status}`;
      // Provide a fallback title based on video ID
      if (videoId) {
        result.title = 'YouTube Video';
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('YouTube metadata fetch timeout for:', url);
      result.error = 'Request timeout';
    } else {
      console.error('Failed to fetch YouTube metadata:', error);
      result.error = 'Network error';
    }
    // Provide fallback values for offline
    if (videoId) {
      result.title = 'YouTube Video';
    }
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
    // CORS errors are expected for many sites - this is not a critical failure
    if (error.name === 'AbortError') {
      result.error = 'Request timeout';
    } else {
      result.error = 'Could not fetch page (CORS or network error)';
    }

    // Fall back to extracting info from URL - this always works even offline
    try {
      const urlObj = new URL(url);
      result.siteName = urlObj.hostname.replace(/^www\./, '');
      result.keywords = [result.siteName.split('.')[0]]; // Add domain name as keyword

      // Try to extract meaningful info from URL path
      const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0);
      
      // Find the most meaningful path segment (not "watch", "video", etc.)
      const ignoredSegments = new Set(['watch', 'video', 'post', 'article', 'blog', 'p', 'v', 'e', 'status']);
      for (let i = pathParts.length - 1; i >= 0; i--) {
        const part = pathParts[i];
        const lowerPart = part.toLowerCase();
        
        // Skip short segments, pure numbers, and ignored segments
        if (part.length <= 2 || /^\d+$/.test(part) || ignoredSegments.has(lowerPart)) {
          continue;
        }

        // Clean up URL slug to create a title
        const cleanTitle = part
          .replace(/[-_]/g, ' ')
          .replace(/\.[^.]+$/, '') // Remove file extension
          .replace(/\d{4,}/g, ' ') // Replace long numbers with space
          .replace(/\s+/g, ' ')
          .trim();

        if (cleanTitle.length > 3) {
          result.title = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
          // Also extract keywords from the title
          const titleKeywords = extractKeywordsFromText(cleanTitle);
          result.keywords = [...result.keywords, ...titleKeywords];
          break;
        }
      }

      // If we still don't have a title, use the domain
      if (!result.title) {
        const domainName = result.siteName.split('.')[0];
        result.title = domainName.charAt(0).toUpperCase() + domainName.slice(1);
      }

      // Deduplicate keywords
      result.keywords = [...new Set(result.keywords)];
    } catch {
      // Ignore URL parsing errors - result will have null values which is safe
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

  // Collect all keywords and track frequency
  const allKeywords: string[] = [];
  const keywordCounts = new Map<string, number>();
  const authors = new Set<string>();
  const types = new Set<string>();

  for (const metadata of metadataResults) {
    // Track authors
    if (metadata.author) {
      authors.add(metadata.author);
    }
    
    // Track types
    if (metadata.type) {
      types.add(metadata.type);
    }

    // Count keywords
    for (const keyword of metadata.keywords) {
      allKeywords.push(keyword);
      keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
    }
  }

  // Find common themes (keywords that appear in multiple URLs or high-value single keywords)
  const commonThemes = Array.from(keywordCounts.entries())
    .filter(([keyword, count]) => {
      // Include if appears in multiple URLs
      if (count > 1) return true;
      // For single URLs, include all keywords
      if (urls.length === 1) return true;
      // For multi-URL, include multi-word keywords (more specific)
      if (keyword.includes(' ')) return true;
      return false;
    })
    .sort((a, b) => {
      // Sort by count first, then by word length (prefer multi-word)
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].includes(' ') ? -1 : 1;
    })
    .slice(0, 10)
    .map(([keyword]) => keyword);

  // Generate combined title based on content analysis
  let combinedTitle = '';
  const siteNames = [...new Set(metadataResults.map(m => m.siteName).filter(Boolean))];
  const successfulTitles = metadataResults.filter(m => m.title).map(m => m.title!);

  // Single URL - just use its title
  if (urls.length === 1) {
    combinedTitle = successfulTitles[0] || siteNames[0] || 'Link';
  }
  // Multiple URLs from same author (e.g., multiple videos from same channel)
  else if (authors.size === 1 && authors.values().next().value) {
    const author = authors.values().next().value;
    if (urls.length === 2) {
      combinedTitle = `${author} - 2 Videos`;
    } else {
      combinedTitle = `${author} Collection`;
    }
  }
  // Multiple YouTube videos with common themes
  else if (types.size === 1 && types.has('youtube') && commonThemes.length > 0) {
    const topTheme = commonThemes[0].charAt(0).toUpperCase() + commonThemes[0].slice(1);
    combinedTitle = `${topTheme} Videos`;
  }
  // Multiple URLs with common themes
  else if (commonThemes.length >= 2) {
    // Take top 2-3 themes and create a descriptive title
    const titleThemes = commonThemes.slice(0, 2).map(t =>
      t.charAt(0).toUpperCase() + t.slice(1)
    );
    combinedTitle = titleThemes.join(' + ');
  }
  // URLs from the same site
  else if (siteNames.length === 1 && siteNames[0]) {
    combinedTitle = `${urls.length} Links from ${siteNames[0]}`;
  }
  // Mixed sources
  else if (siteNames.length > 1) {
    // Create title from unique site names
    const uniqueSites = siteNames.slice(0, 3).map(s => 
      s!.split('.')[0].charAt(0).toUpperCase() + s!.split('.')[0].slice(1)
    );
    combinedTitle = uniqueSites.join(' + ');
  }
  // Fallback
  else {
    combinedTitle = `${urls.length} Links`;
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

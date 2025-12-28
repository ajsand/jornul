/**
 * Keyphrase Extraction Service
 * Lightweight keyphrase extraction without LLM
 * - Tokenize, remove stopwords, n-grams, score by frequency
 */

// Common English stopwords
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'not', 'no', 'nor', 'so', 'than', 'too', 'very', 'just', 'only',
  'also', 'even', 'if', 'then', 'else', 'when', 'where', 'why', 'how', 'what',
  'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'it', 'its',
  'my', 'your', 'his', 'her', 'our', 'their', 'i', 'you', 'he', 'she', 'we',
  'they', 'me', 'him', 'us', 'them', 'myself', 'yourself', 'himself', 'herself',
  'itself', 'ourselves', 'themselves', 'all', 'each', 'every', 'both', 'few',
  'more', 'most', 'other', 'some', 'such', 'any', 'much', 'many', 'own',
  'same', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further',
  'once', 'here', 'there', 'about', 'above', 'below', 'between', 'into',
  'through', 'during', 'before', 'after', 'while', 'because', 'although',
  'since', 'until', 'unless', 'however', 'therefore', 'thus', 'hence',
  'get', 'got', 'getting', 'go', 'goes', 'going', 'went', 'gone',
  'make', 'made', 'making', 'take', 'took', 'taking', 'taken',
  'come', 'came', 'coming', 'see', 'saw', 'seen', 'seeing',
  'know', 'knew', 'known', 'knowing', 'think', 'thought', 'thinking',
  'want', 'wanted', 'wanting', 'like', 'liked', 'liking',
  'say', 'said', 'saying', 'tell', 'told', 'telling',
  'give', 'gave', 'given', 'giving', 'find', 'found', 'finding',
  'really', 'actually', 'basically', 'simply', 'probably', 'possibly',
  'maybe', 'perhaps', 'certainly', 'definitely', 'absolutely',
  'today', 'yesterday', 'tomorrow', 'now', 'later', 'soon',
  'still', 'already', 'yet', 'always', 'never', 'sometimes', 'often',
  'usually', 'generally', 'typically', 'etc', 'ie', 'eg', 've', 'll', 're',
  'don', 'doesn', 'didn', 'won', 'wouldn', 'couldn', 'shouldn', 'isn', 'aren',
  'wasn', 'weren', 'hasn', 'haven', 'hadn', 'let', 'lets',
]);

// Minimum length for a valid token
const MIN_TOKEN_LENGTH = 3;
const MAX_TOKEN_LENGTH = 25;

// Maximum number of keyphrases to return
const DEFAULT_MAX_KEYPHRASES = 5;

export interface Keyphrase {
  phrase: string;
  score: number;
  source: 'frequency' | 'ngram' | 'title';
}

/**
 * Tokenize text into words
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')  // Keep apostrophes and hyphens
    .split(/\s+/)
    .map(t => t.replace(/^['"-]+|['"-]+$/g, ''))  // Trim leading/trailing punctuation
    .filter(t => t.length >= MIN_TOKEN_LENGTH && t.length <= MAX_TOKEN_LENGTH)
    .filter(t => !STOPWORDS.has(t))
    .filter(t => !/^\d+$/.test(t));  // Filter pure numbers
}

/**
 * Count frequency of tokens
 */
function countFrequency(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) || 0) + 1);
  }
  return freq;
}

/**
 * Generate n-grams (bigrams for now)
 */
function generateBigrams(tokens: string[]): string[] {
  const bigrams: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    const bigram = `${tokens[i]} ${tokens[i + 1]}`;
    // Only include bigrams where both words are meaningful
    if (tokens[i].length >= MIN_TOKEN_LENGTH && tokens[i + 1].length >= MIN_TOKEN_LENGTH) {
      bigrams.push(bigram);
    }
  }
  return bigrams;
}

/**
 * Normalize and clean a keyphrase for use as a tag
 */
export function normalizeTagName(phrase: string): string {
  return phrase
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 30);  // Max tag length
}

/**
 * Extract keyphrases from text content
 */
export function extractKeyphrases(
  text: string,
  maxKeyphrases: number = DEFAULT_MAX_KEYPHRASES
): Keyphrase[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const tokens = tokenize(text);
  if (tokens.length === 0) {
    return [];
  }

  const results: Keyphrase[] = [];

  // 1. Get single word frequencies
  const wordFreq = countFrequency(tokens);
  const totalWords = tokens.length;

  // Score single words by TF (term frequency)
  for (const [word, count] of wordFreq) {
    if (count >= 2) {  // Only words that appear at least twice
      const tf = count / totalWords;
      results.push({
        phrase: word,
        score: tf * 0.8,  // Slightly lower weight for single words
        source: 'frequency',
      });
    }
  }

  // 2. Get bigram frequencies
  const bigrams = generateBigrams(tokens);
  const bigramFreq = countFrequency(bigrams);

  for (const [bigram, count] of bigramFreq) {
    if (count >= 2) {
      const tf = count / Math.max(1, bigrams.length);
      results.push({
        phrase: bigram,
        score: tf * 1.2,  // Higher weight for meaningful bigrams
        source: 'ngram',
      });
    }
  }

  // Sort by score and take top N
  results.sort((a, b) => b.score - a.score);

  // Deduplicate (remove single words that are part of higher-ranked bigrams)
  const seen = new Set<string>();
  const deduplicated: Keyphrase[] = [];

  for (const kp of results) {
    const normalized = normalizeTagName(kp.phrase);
    if (!normalized || normalized.length < MIN_TOKEN_LENGTH) continue;

    // Check if this is a single word that's part of an already-added bigram
    const words = normalized.split(' ');
    if (words.length === 1) {
      let isPartOfBigram = false;
      for (const existing of deduplicated) {
        if (existing.phrase.includes(normalized)) {
          isPartOfBigram = true;
          break;
        }
      }
      if (isPartOfBigram) continue;
    }

    if (!seen.has(normalized)) {
      seen.add(normalized);
      deduplicated.push({ ...kp, phrase: normalized });
    }

    if (deduplicated.length >= maxKeyphrases) break;
  }

  return deduplicated;
}

/**
 * Extract keyphrases from a title
 */
export function extractTitleKeyphrases(title: string): Keyphrase[] {
  if (!title || title.trim().length === 0) {
    return [];
  }

  const tokens = tokenize(title);
  return tokens
    .filter(t => t.length >= MIN_TOKEN_LENGTH)
    .slice(0, 3)  // Max 3 from title
    .map(word => ({
      phrase: normalizeTagName(word),
      score: 0.7,  // Medium confidence for title words
      source: 'title' as const,
    }))
    .filter(kp => kp.phrase.length >= MIN_TOKEN_LENGTH);
}

/**
 * Extract domain tokens from a URL
 * e.g., "youtube.com" -> ["youtube"]
 *       "docs.google.com" -> ["google", "docs"]
 *       "en.wikipedia.org" -> ["wikipedia"]
 */
export function extractDomainTokens(url: string): Keyphrase[] {
  if (!url) return [];

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Remove common prefixes and TLDs
    const parts = hostname
      .replace(/^(www\.|m\.|mobile\.|en\.|es\.|de\.|fr\.|ja\.|zh\.)/, '')
      .split('.')
      .filter(part => !['com', 'org', 'net', 'io', 'co', 'edu', 'gov', 'uk', 'de', 'fr', 'jp', 'cn', 'app', 'dev'].includes(part))
      .filter(part => part.length >= 3);

    return parts.map(domain => ({
      phrase: normalizeTagName(domain),
      score: 0.9,  // High confidence for domain names
      source: 'frequency' as const,  // Treat as frequency-based
    })).filter(kp => kp.phrase.length >= 3);
  } catch {
    return [];
  }
}

/**
 * Extract tokens from a filename
 * e.g., "my-vacation-photo-2024.jpg" -> ["vacation", "photo"]
 */
export function extractFilenameTokens(filename: string): Keyphrase[] {
  if (!filename) return [];

  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');

  // Split on common separators
  const tokens = nameWithoutExt
    .toLowerCase()
    .split(/[-_.\s]+/)
    .filter(t => t.length >= MIN_TOKEN_LENGTH && t.length <= MAX_TOKEN_LENGTH)
    .filter(t => !STOPWORDS.has(t))
    .filter(t => !/^\d+$/.test(t))  // Filter pure numbers
    .filter(t => !/^(img|dsc|vid|aud|file|doc|copy|new|untitled|screenshot)$/i.test(t))  // Filter common file prefixes
    .slice(0, 3);

  return tokens.map(token => ({
    phrase: normalizeTagName(token),
    score: 0.6,  // Medium-low confidence for filename tokens
    source: 'title' as const,
  })).filter(kp => kp.phrase.length >= MIN_TOKEN_LENGTH);
}

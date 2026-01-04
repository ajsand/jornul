/**
 * Keyphrase Extraction
 * Extracts meaningful tags from text content
 * Focuses on nouns, proper names, and multi-word phrases
 */

export interface Keyphrase {
  phrase: string;
  score: number;
}

// Comprehensive list of stop words to filter out meaningless terms
const STOP_WORDS = new Set([
  // Articles
  'a', 'an', 'the',
  // Pronouns
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your',
  'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she',
  'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their',
  'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that',
  'these', 'those',
  // Prepositions
  'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
  'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to',
  'from', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further',
  'then', 'once', 'of',
  // Conjunctions
  'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither',
  'not', 'only', 'own', 'same', 'than', 'too', 'very',
  // Verbs (common/linking)
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'having', 'do', 'does', 'did', 'doing', 'would', 'should', 'could', 'ought',
  'will', 'shall', 'can', 'may', 'might', 'must', 'need',
  // Common verbs that don't make good tags
  'get', 'gets', 'got', 'getting', 'make', 'makes', 'made', 'making',
  'go', 'goes', 'went', 'going', 'gone', 'come', 'comes', 'came', 'coming',
  'take', 'takes', 'took', 'taking', 'taken', 'give', 'gives', 'gave', 'giving',
  'see', 'sees', 'saw', 'seeing', 'seen', 'know', 'knows', 'knew', 'knowing',
  'think', 'thinks', 'thought', 'thinking', 'want', 'wants', 'wanted', 'wanting',
  'use', 'uses', 'used', 'using', 'find', 'finds', 'found', 'finding',
  'tell', 'tells', 'told', 'telling', 'ask', 'asks', 'asked', 'asking',
  'work', 'works', 'worked', 'working', 'seem', 'seems', 'seemed', 'seeming',
  'feel', 'feels', 'felt', 'feeling', 'try', 'tries', 'tried', 'trying',
  'leave', 'leaves', 'left', 'leaving', 'call', 'calls', 'called', 'calling',
  'put', 'puts', 'putting', 'keep', 'keeps', 'kept', 'keeping',
  'let', 'lets', 'letting', 'begin', 'begins', 'began', 'beginning',
  'show', 'shows', 'showed', 'showing', 'hear', 'hears', 'heard', 'hearing',
  'play', 'plays', 'played', 'playing', 'run', 'runs', 'ran', 'running',
  'move', 'moves', 'moved', 'moving', 'live', 'lives', 'lived', 'living',
  'believe', 'believes', 'believed', 'believing', 'bring', 'brings', 'brought',
  'happen', 'happens', 'happened', 'happening', 'write', 'writes', 'wrote',
  'provide', 'provides', 'provided', 'providing', 'sit', 'sits', 'sat',
  'stand', 'stands', 'stood', 'standing', 'lose', 'loses', 'lost', 'losing',
  'pay', 'pays', 'paid', 'paying', 'meet', 'meets', 'met', 'meeting',
  'include', 'includes', 'included', 'including', 'continue', 'continues',
  'set', 'sets', 'setting', 'learn', 'learns', 'learned', 'learning',
  'change', 'changes', 'changed', 'changing', 'lead', 'leads', 'led', 'leading',
  'understand', 'understands', 'understood', 'understanding',
  'watch', 'watches', 'watched', 'watching', 'follow', 'follows', 'followed',
  'stop', 'stops', 'stopped', 'stopping', 'create', 'creates', 'created',
  'speak', 'speaks', 'spoke', 'speaking', 'read', 'reads', 'reading',
  'spend', 'spends', 'spent', 'spending', 'grow', 'grows', 'grew', 'growing',
  'open', 'opens', 'opened', 'opening', 'walk', 'walks', 'walked', 'walking',
  'win', 'wins', 'won', 'winning', 'offer', 'offers', 'offered', 'offering',
  'remember', 'remembers', 'remembered', 'considering', 'appear', 'appears',
  'buy', 'buys', 'bought', 'buying', 'wait', 'waits', 'waited', 'waiting',
  'serve', 'serves', 'served', 'serving', 'die', 'dies', 'died', 'dying',
  'send', 'sends', 'sent', 'sending', 'expect', 'expects', 'expected',
  'build', 'builds', 'built', 'building', 'stay', 'stays', 'stayed', 'staying',
  'fall', 'falls', 'fell', 'falling', 'cut', 'cuts', 'cutting',
  'reach', 'reaches', 'reached', 'reaching', 'kill', 'kills', 'killed',
  'remain', 'remains', 'remained', 'remaining', 'suggest', 'suggests',
  'raise', 'raises', 'raised', 'raising', 'pass', 'passes', 'passed', 'passing',
  'sell', 'sells', 'sold', 'selling', 'require', 'requires', 'required',
  'report', 'reports', 'reported', 'reporting', 'decide', 'decides', 'decided',
  'pull', 'pulls', 'pulled', 'pulling',
  // Adverbs
  'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
  'some', 'any', 'most', 'other', 'such', 'no', 'just', 'now', 'also',
  'well', 'even', 'back', 'still', 'way', 'already', 'ever', 'never',
  'always', 'often', 'usually', 'sometimes', 'really', 'very', 'quite',
  'almost', 'enough', 'rather', 'maybe', 'perhaps', 'probably', 'actually',
  'certainly', 'definitely', 'however', 'though', 'although', 'unless',
  'since', 'while', 'because', 'therefore', 'thus', 'hence', 'otherwise',
  // Adjectives that don't make good standalone tags
  'good', 'great', 'best', 'better', 'bad', 'worse', 'worst', 'new', 'old',
  'first', 'last', 'long', 'short', 'little', 'big', 'small', 'large',
  'high', 'low', 'right', 'wrong', 'next', 'early', 'late', 'young',
  'important', 'different', 'few', 'many', 'much', 'own', 'real', 'true',
  'false', 'full', 'empty', 'easy', 'hard', 'simple', 'possible', 'likely',
  'able', 'sure', 'certain', 'clear', 'free', 'whole', 'main', 'major',
  'minor', 'special', 'general', 'specific', 'common', 'similar', 'available',
  'local', 'national', 'international', 'public', 'private', 'social',
  'political', 'economic', 'financial', 'recent', 'current', 'previous',
  // Vague/abstract words that don't make good tags
  'thing', 'things', 'stuff', 'something', 'anything', 'nothing', 'everything',
  'someone', 'anyone', 'everyone', 'nobody', 'everybody', 'people', 'person',
  'way', 'ways', 'part', 'parts', 'place', 'places', 'time', 'times',
  'day', 'days', 'year', 'years', 'week', 'weeks', 'month', 'months',
  'today', 'yesterday', 'tomorrow', 'tonight', 'morning', 'evening', 'night',
  'case', 'cases', 'fact', 'facts', 'point', 'points', 'number', 'numbers',
  'kind', 'kinds', 'sort', 'sorts', 'type', 'types', 'example', 'examples',
  'lot', 'lots', 'bit', 'bits', 'piece', 'pieces',
  'end', 'ends', 'side', 'sides', 'area', 'areas', 'line', 'lines',
  'world', 'life', 'home', 'house', 'room', 'level', 'result', 'reason',
  'idea', 'question', 'problem', 'issue', 'matter', 'state', 'group',
  // Web/URL related words
  'http', 'https', 'www', 'com', 'org', 'net', 'html', 'htm', 'php', 'asp',
  'video', 'channel', 'subscribe', 'like', 'share',
  'click', 'link', 'page', 'site', 'website', 'web', 'online', 'internet',
  // Numbers and ordinals
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'second', 'third', 'fourth', 'fifth',
  // Misc common words
  'said', 'say', 'says', 'saying', 'like', 'likes', 'liked', 'liking',
  'look', 'looks', 'looked', 'looking', 'need', 'needs', 'needed', 'needing',
  'start', 'starts', 'started', 'starting', 'turn', 'turns', 'turned', 'turning',
  'help', 'helps', 'helped', 'helping', 'talk', 'talks', 'talked', 'talking',
  'hold', 'holds', 'held', 'holding', 'carry', 'carries', 'carried', 'carrying',
  'thanks', 'thank', 'please', 'sorry', 'hello', 'hi', 'hey', 'bye', 'goodbye',
  'yeah', 'yes', 'ok', 'okay', 'oh', 'ah', 'um', 'uh', 'hm', 'hmm',
  'gonna', 'wanna', 'gotta', 'kinda', 'sorta', 'lotta',
  // Superlatives and comparatives (often too generic)
  'greatest', 'biggest', 'smallest', 'fastest', 'slowest', 'highest', 'lowest',
  'newest', 'oldest', 'latest', 'earliest', 'longest', 'shortest',
  'more', 'less', 'least', 'fewer', 'fewest',
  // Words that are meaningless on their own
  'evil', 'dark', 'light', 'hot', 'cold', 'wet', 'dry',
  'official', 'original', 'classic', 'ultimate', 'super', 'mega', 'ultra',
]);

// Words that are weak on their own but can be part of good phrases
const WEAK_WORDS = new Set([
  'man', 'woman', 'men', 'women', 'guy', 'girl', 'boy', 'child', 'children',
  'king', 'queen', 'prince', 'princess', 'lord', 'lady',
  'dr', 'mr', 'mrs', 'ms', 'miss', 'sir', 'madam',
]);

// Content category patterns for automatic category tagging
const CATEGORY_PATTERNS: Array<{ pattern: RegExp; category: string }> = [
  // Music
  { pattern: /\b(song|album|artist|singer|band|concert|tour|lyrics|melody|rhythm|beat|track)\b/i, category: 'music' },
  { pattern: /\b(spotify|soundcloud|itunes|apple music|pandora|deezer)\b/i, category: 'music' },

  // Sports
  { pattern: /\b(basketball|nba|wnba|ncaa basketball)\b/i, category: 'basketball' },
  { pattern: /\b(football|nfl|super bowl|touchdown|quarterback)\b/i, category: 'football' },
  { pattern: /\b(soccer|fifa|premier league|champions league|world cup)\b/i, category: 'soccer' },
  { pattern: /\b(baseball|mlb|home run|pitcher|batting)\b/i, category: 'baseball' },
  { pattern: /\b(hockey|nhl|puck|goalie)\b/i, category: 'hockey' },
  { pattern: /\b(tennis|wimbledon|us open|roland garros|australian open)\b/i, category: 'tennis' },
  { pattern: /\b(golf|pga|masters|british open)\b/i, category: 'golf' },
  { pattern: /\b(boxing|ufc|mma|wrestling|wwe)\b/i, category: 'combat sports' },

  // Food & Cooking
  { pattern: /\b(recipe|cooking|chef|kitchen|ingredient|dish|meal|cuisine|restaurant)\b/i, category: 'cooking' },
  { pattern: /\b(bake|baking|roast|grill|fry|saut[eé]|simmer|boil)\b/i, category: 'cooking' },

  // Technology
  { pattern: /\b(programming|coding|developer|software|app|application|algorithm|api)\b/i, category: 'programming' },
  { pattern: /\b(javascript|python|typescript|react|node|java|c\+\+|rust|golang)\b/i, category: 'programming' },
  { pattern: /\b(iphone|android|ios|smartphone|mobile|tablet)\b/i, category: 'mobile' },
  { pattern: /\b(ai|artificial intelligence|machine learning|deep learning|neural network|gpt|llm)\b/i, category: 'ai' },
  { pattern: /\b(crypto|bitcoin|ethereum|blockchain|nft|defi|web3)\b/i, category: 'crypto' },

  // Entertainment
  { pattern: /\b(movie|film|cinema|director|actor|actress|hollywood|bollywood)\b/i, category: 'movies' },
  { pattern: /\b(tv show|series|episode|season|netflix|hulu|hbo|streaming)\b/i, category: 'tv shows' },
  { pattern: /\b(game|gaming|gamer|playstation|xbox|nintendo|steam|esports)\b/i, category: 'gaming' },
  { pattern: /\b(anime|manga|otaku|cosplay|japanese animation)\b/i, category: 'anime' },
  { pattern: /\b(podcast|podcaster|episode|listen)\b/i, category: 'podcast' },

  // Education & Learning
  { pattern: /\b(tutorial|course|lesson|education|school|university|college|degree)\b/i, category: 'education' },
  { pattern: /\b(science|physics|chemistry|biology|mathematics|engineering)\b/i, category: 'science' },
  { pattern: /\b(history|historical|ancient|medieval|modern history)\b/i, category: 'history' },

  // Health & Fitness
  { pattern: /\b(workout|exercise|fitness|gym|training|wellness|diet|nutrition)\b/i, category: 'fitness' },
  { pattern: /\b(yoga|meditation|mindfulness|mental health|therapy)\b/i, category: 'wellness' },
  { pattern: /\b(medicine|medical|doctor|hospital|treatment|symptom|diagnosis)\b/i, category: 'health' },

  // Business & Finance
  { pattern: /\b(business|startup|entrepreneur|company|corporation|ceo|investor)\b/i, category: 'business' },
  { pattern: /\b(stock|investing|finance|money|trading|market|economy|wealth)\b/i, category: 'finance' },
  { pattern: /\b(marketing|advertising|brand|social media marketing|seo)\b/i, category: 'marketing' },

  // Lifestyle
  { pattern: /\b(fashion|style|clothing|outfit|designer|trend)\b/i, category: 'fashion' },
  { pattern: /\b(travel|vacation|trip|destination|tourism|hotel|flight)\b/i, category: 'travel' },
  { pattern: /\b(photography|photo|camera|photographer|portrait|landscape)\b/i, category: 'photography' },
  { pattern: /\b(art|artist|painting|drawing|sculpture|gallery|museum)\b/i, category: 'art' },
  { pattern: /\b(diy|crafts|handmade|homemade|project)\b/i, category: 'diy' },

  // News & Current Events
  { pattern: /\b(news|breaking|headline|report|journalist|press)\b/i, category: 'news' },
  { pattern: /\b(politics|political|election|government|congress|senate|president)\b/i, category: 'politics' },
];

/**
 * Normalize a tag name - lowercase, trim, basic cleanup
 */
export function normalizeTagName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars except hyphen
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
}

/**
 * Check if a word is a stop word
 */
function isStopWord(word: string): boolean {
  return STOP_WORDS.has(word.toLowerCase());
}

/**
 * Check if a word is weak (only good in phrases)
 */
function isWeakWord(word: string): boolean {
  return WEAK_WORDS.has(word.toLowerCase());
}

/**
 * Extract proper nouns (multi-word names) from text
 * Looks for sequences of capitalized words like "Bruno Mars" or "LeBron James"
 */
function extractProperNouns(text: string): Keyphrase[] {
  const results: Keyphrase[] = [];

  // Match sequences of 2-4 capitalized words (likely names/titles)
  const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g;
  let match;

  while ((match = namePattern.exec(text)) !== null) {
    const name = match[1];
    const words = name.split(/\s+/);

    // Filter out common title prefixes
    const firstWord = words[0].toLowerCase();
    if (['the', 'a', 'an', 'this', 'that', 'my', 'your', 'his', 'her', 'its', 'our', 'their'].includes(firstWord)) {
      continue;
    }

    // Check if all words are too short (likely not a real name)
    const allWordsShort = words.every(w => w.length <= 2);
    if (allWordsShort) continue;

    // Boost score for multi-word proper nouns
    results.push({
      phrase: name.toLowerCase(),
      score: 0.9,
    });
  }

  return results;
}

/**
 * Detect content categories from text
 */
function detectCategories(text: string): Keyphrase[] {
  const categories: Keyphrase[] = [];
  const detected = new Set<string>();

  for (const { pattern, category } of CATEGORY_PATTERNS) {
    if (pattern.test(text) && !detected.has(category)) {
      detected.add(category);
      categories.push({
        phrase: category,
        score: 0.8,
      });
    }
  }

  return categories;
}

/**
 * Extract meaningful noun phrases from text
 */
function extractNounPhrases(text: string, maxPhrases: number): Keyphrase[] {
  const results: Keyphrase[] = [];

  // Split into sentences/chunks
  const sentences = text.split(/[.!?\n]+/).filter(s => s.trim().length > 0);

  for (const sentence of sentences) {
    // Clean and split into words
    const cleanSentence = sentence.replace(/[^\w\s'-]/g, ' ').trim();
    const words = cleanSentence.split(/\s+/).filter(w => w.length > 0);

    // Look for meaningful 2-3 word phrases
    for (let i = 0; i < words.length - 1; i++) {
      const word1 = words[i];
      const word2 = words[i + 1];

      // 2-word phrases: both words must not be stop words
      if (!isStopWord(word1) && !isStopWord(word2)) {
        const phrase = `${word1} ${word2}`.toLowerCase();
        const normalized = normalizeTagName(phrase);

        if (normalized.length >= 5) {
          results.push({
            phrase: normalized,
            score: 0.7,
          });
        }
      }

      // 3-word phrases (noun + preposition + noun pattern)
      if (i < words.length - 2) {
        const word3 = words[i + 2];
        const midWord = word2.toLowerCase();

        // Only include if first and last are meaningful, middle can be connector
        if (!isStopWord(word1) && !isStopWord(word3) &&
            ['of', 'and', 'the', 'in', 'for', 'on', 'with'].includes(midWord)) {
          const phrase = `${word1} ${word2} ${word3}`.toLowerCase();
          const normalized = normalizeTagName(phrase);

          if (normalized.length >= 7) {
            results.push({
              phrase: normalized,
              score: 0.65,
            });
          }
        }
      }
    }

    // Extract single meaningful nouns
    for (const word of words) {
      const clean = word.toLowerCase().replace(/[^a-z]/g, '');

      // Must be at least 4 chars, not a stop word, not a weak word
      if (clean.length >= 4 && !isStopWord(clean) && !isWeakWord(clean)) {
        // Prefer words ending in common noun suffixes
        const nounSuffixes = ['tion', 'ness', 'ment', 'ity', 'ism', 'ist', 'ology', 'graphy'];
        const hasNounSuffix = nounSuffixes.some(suffix => clean.endsWith(suffix));

        results.push({
          phrase: clean,
          score: hasNounSuffix ? 0.55 : 0.4,
        });
      }
    }
  }

  // Deduplicate and sort by score
  const seen = new Set<string>();
  const unique = results.filter(r => {
    const key = r.phrase.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.sort((a, b) => b.score - a.score).slice(0, maxPhrases);
}

/**
 * Extract keyphrases from text content
 */
export function extractKeyphrases(text: string, maxPhrases: number = 5): Keyphrase[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const results: Keyphrase[] = [];

  // 1. Extract proper nouns (names, titles) - highest priority
  const properNouns = extractProperNouns(text);
  results.push(...properNouns);

  // 2. Detect content categories
  const categories = detectCategories(text);
  results.push(...categories);

  // 3. Extract noun phrases
  const nounPhrases = extractNounPhrases(text, maxPhrases * 2);
  results.push(...nounPhrases);

  // Deduplicate by normalized phrase
  const seen = new Set<string>();
  const unique = results.filter(r => {
    const key = r.phrase.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by score and return top phrases
  return unique.sort((a, b) => b.score - a.score).slice(0, maxPhrases);
}

/**
 * Extract keyphrases from a title (higher weight, different strategy)
 */
export function extractTitleKeyphrases(title: string): Keyphrase[] {
  if (!title || title.trim().length === 0) {
    return [];
  }

  const results: Keyphrase[] = [];

  // For titles, extract proper nouns with high confidence
  const properNouns = extractProperNouns(title);
  for (const pn of properNouns) {
    results.push({ phrase: pn.phrase, score: pn.score + 0.05 });
  }

  // Detect categories from title
  const categories = detectCategories(title);
  results.push(...categories);

  // For titles, extract the meaningful words as a phrase
  const normalized = normalizeTagName(title);
  if (normalized.length >= 4 && normalized.length <= 50) {
    const words = normalized.split(/\s+/);
    const meaningfulWords = words.filter(w => !isStopWord(w) && w.length > 2);

    if (meaningfulWords.length >= 1 && meaningfulWords.length <= 5) {
      const tagPhrase = meaningfulWords.join(' ');
      if (tagPhrase.length >= 4 && !isStopWord(tagPhrase)) {
        results.push({
          phrase: tagPhrase,
          score: 0.75,
        });
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return results.filter(r => {
    const key = r.phrase.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 5);
}

/**
 * Extract tags from URL domain
 */
export function extractDomainTokens(url: string): Keyphrase[] {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, '');

    // Get the main domain name
    const parts = hostname.split('.');
    const mainDomain = parts[0];

    // Known platform mappings
    const platformTags: Record<string, string> = {
      'youtube': 'youtube',
      'github': 'github',
      'stackoverflow': 'stack overflow',
      'medium': 'medium',
      'dev': 'dev.to',
      'twitter': 'twitter',
      'x': 'twitter',
      'linkedin': 'linkedin',
      'reddit': 'reddit',
      'instagram': 'instagram',
      'tiktok': 'tiktok',
      'pinterest': 'pinterest',
      'spotify': 'spotify',
      'soundcloud': 'soundcloud',
      'twitch': 'twitch',
      'vimeo': 'vimeo',
      'dribbble': 'dribbble',
      'behance': 'behance',
      'figma': 'figma',
      'notion': 'notion',
      'amazon': 'amazon',
      'netflix': 'netflix',
      'hulu': 'hulu',
      'wikipedia': 'wikipedia',
      'imdb': 'imdb',
      'espn': 'espn',
    };

    const results: Keyphrase[] = [];

    // Check for known platform
    if (platformTags[mainDomain]) {
      results.push({
        phrase: platformTags[mainDomain],
        score: 0.7,
      });
    } else if (mainDomain.length >= 4 && !isStopWord(mainDomain)) {
      results.push({
        phrase: mainDomain,
        score: 0.5,
      });
    }

    // Extract meaningful parts from path
    const pathParts = urlObj.pathname
      .split('/')
      .filter(p => p.length > 3 && !isStopWord(p) && !/^[0-9]+$/.test(p) && !/^v\d+$/.test(p));

    for (const part of pathParts.slice(0, 2)) {
      const cleaned = part.replace(/[-_]/g, ' ').toLowerCase();
      if (cleaned.length >= 4 && !isStopWord(cleaned)) {
        results.push({
          phrase: cleaned,
          score: 0.4,
        });
      }
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Extract tags from filename
 */
export function extractFilenameTokens(filename: string): Keyphrase[] {
  if (!filename) return [];

  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');

  // Split on common separators
  const parts = nameWithoutExt
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase split
    .split(/\s+/)
    .filter(p => p.length > 2);

  const results: Keyphrase[] = [];

  // Check for proper nouns in filename
  const properNouns = extractProperNouns(nameWithoutExt.replace(/[-_]/g, ' '));
  results.push(...properNouns);

  // Add meaningful individual words
  for (const part of parts) {
    const cleaned = part.toLowerCase();
    if (cleaned.length >= 4 && !isStopWord(cleaned) && !isWeakWord(cleaned)) {
      results.push({
        phrase: cleaned,
        score: 0.5,
      });
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return results.filter(r => {
    const key = r.phrase.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 3);
}

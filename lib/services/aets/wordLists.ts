/**
 * Word Lists for AETS Tagging System
 * Centralized stopwords, verb/adjective filters, and helper functions
 * for better tag quality filtering
 */

/**
 * Core grammar stopwords (articles, prepositions, pronouns, etc.)
 */
export const STOPWORDS = new Set([
  // Articles & determiners
  'a', 'an', 'the', 'this', 'that', 'these', 'those',
  // Prepositions
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'down',
  'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'under', 'over', 'out', 'off', 'against', 'along', 'around',
  // Conjunctions
  'and', 'or', 'but', 'nor', 'so', 'yet', 'both', 'either', 'neither',
  // Pronouns
  'i', 'me', 'my', 'myself', 'you', 'your', 'yourself', 'he', 'him', 'his',
  'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself',
  'we', 'us', 'our', 'ours', 'ourselves', 'they', 'them', 'their', 'theirs',
  'themselves', 'who', 'whom', 'whose', 'which', 'what', 'whoever', 'whatever',
  // Common verbs (basic forms)
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
  'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can',
  // Adverbs & modifiers
  'very', 'just', 'only', 'also', 'even', 'still', 'already', 'always',
  'never', 'ever', 'often', 'sometimes', 'usually', 'probably', 'maybe',
  'perhaps', 'certainly', 'definitely', 'actually', 'really', 'basically',
  'simply', 'quite', 'rather', 'almost', 'nearly', 'hardly', 'barely',
  // Question words
  'how', 'why', 'when', 'where', 'whether',
  // Misc common words
  'here', 'there', 'now', 'then', 'today', 'tomorrow', 'yesterday',
  'again', 'further', 'once', 'each', 'every', 'all', 'any', 'some',
  'few', 'more', 'most', 'other', 'another', 'such', 'no', 'not',
  'than', 'too', 'same', 'own', 'able', 'else',
  // Tech/URL terms
  'www', 'http', 'https', 'com', 'org', 'net', 'html', 'htm', 'php',
]);

/**
 * Verbs that should not become tags (action words without descriptive value)
 */
export const VERB_STOPWORDS = new Set([
  // Meeting/encounter verbs
  'meet', 'meets', 'met', 'meeting',
  // Show/display verbs
  'show', 'shows', 'showed', 'shown', 'showing',
  // Performance verbs
  'play', 'plays', 'played', 'playing',
  'perform', 'performs', 'performed', 'performing',
  'sing', 'sings', 'sang', 'sung', 'singing',
  'dance', 'dances', 'danced', 'dancing',
  // Action verbs
  'try', 'tries', 'tried', 'trying',
  'start', 'starts', 'started', 'starting',
  'end', 'ends', 'ended', 'ending',
  'win', 'wins', 'won', 'winning',
  'lose', 'loses', 'lost', 'losing',
  'beat', 'beats', 'beating',
  'create', 'creates', 'created', 'creating',
  'make', 'makes', 'made', 'making',
  // State change verbs
  'become', 'becomes', 'became', 'becoming',
  'reveal', 'reveals', 'revealed', 'revealing',
  'react', 'reacts', 'reacted', 'reacting',
  'respond', 'responds', 'responded', 'responding',
  'return', 'returns', 'returned', 'returning',
  'join', 'joins', 'joined', 'joining',
  'leave', 'leaves', 'left', 'leaving',
  'bring', 'brings', 'brought', 'bringing',
  'break', 'breaks', 'broke', 'broken', 'breaking',
  'fix', 'fixes', 'fixed', 'fixing',
  'open', 'opens', 'opened', 'opening',
  'close', 'closes', 'closed', 'closing',
  // Movement verbs
  'run', 'runs', 'ran', 'running',
  'walk', 'walks', 'walked', 'walking',
  'go', 'goes', 'went', 'gone', 'going',
  'come', 'comes', 'came', 'coming',
  // Communication verbs
  'talk', 'talks', 'talked', 'talking',
  'speak', 'speaks', 'spoke', 'spoken', 'speaking',
  'say', 'says', 'said', 'saying',
  'tell', 'tells', 'told', 'telling',
  'explain', 'explains', 'explained', 'explaining',
  'discuss', 'discusses', 'discussed', 'discussing',
  // Perception verbs
  'see', 'sees', 'saw', 'seen', 'seeing',
  'look', 'looks', 'looked', 'looking',
  'watch', 'watches', 'watched', 'watching',
  'hear', 'hears', 'heard', 'hearing',
  'listen', 'listens', 'listened', 'listening',
  // Mental verbs
  'think', 'thinks', 'thought', 'thinking',
  'know', 'knows', 'knew', 'known', 'knowing',
  'believe', 'believes', 'believed', 'believing',
  'want', 'wants', 'wanted', 'wanting',
  'need', 'needs', 'needed', 'needing',
  'like', 'likes', 'liked', 'liking',
  'love', 'loves', 'loved', 'loving',
  'hate', 'hates', 'hated', 'hating',
  // Misc verbs
  'get', 'gets', 'got', 'gotten', 'getting',
  'give', 'gives', 'gave', 'given', 'giving',
  'take', 'takes', 'took', 'taken', 'taking',
  'put', 'puts', 'putting',
  'find', 'finds', 'found', 'finding',
  'keep', 'keeps', 'kept', 'keeping',
  'let', 'lets', 'letting',
  'help', 'helps', 'helped', 'helping',
  'turn', 'turns', 'turned', 'turning',
  'move', 'moves', 'moved', 'moving',
  'stop', 'stops', 'stopped', 'stopping',
  'change', 'changes', 'changed', 'changing',
  'follow', 'follows', 'followed', 'following',
  'ask', 'asks', 'asked', 'asking',
  'use', 'uses', 'used', 'using',
  'call', 'calls', 'called', 'calling',
  'feel', 'feels', 'felt', 'feeling',
  'try', 'tries', 'tried', 'trying',
  'seem', 'seems', 'seemed', 'seeming',
  'mean', 'means', 'meant', 'meaning',
  'set', 'sets', 'setting',
  'read', 'reads', 'reading',
  'learn', 'learns', 'learned', 'learning',
  'build', 'builds', 'built', 'building',
  'send', 'sends', 'sent', 'sending',
  'hold', 'holds', 'held', 'holding',
  'stand', 'stands', 'stood', 'standing',
  'sit', 'sits', 'sat', 'sitting',
  'wait', 'waits', 'waited', 'waiting',
  'work', 'works', 'worked', 'working',
  'happen', 'happens', 'happened', 'happening',
  'include', 'includes', 'included', 'including',
  'continue', 'continues', 'continued', 'continuing',
  'drop', 'drops', 'dropped', 'dropping',
  'kill', 'kills', 'killed', 'killing',
  'destroy', 'destroys', 'destroyed', 'destroying',
]);

/**
 * Adjectives that don't add descriptive value as tags
 */
export const ADJECTIVE_STOPWORDS = new Set([
  // Quality/value adjectives (vague)
  'good', 'bad', 'best', 'worst', 'better', 'worse',
  'great', 'greatest', 'amazing', 'awesome', 'incredible', 'unbelievable',
  'perfect', 'excellent', 'wonderful', 'fantastic', 'terrible', 'horrible',
  'beautiful', 'ugly', 'pretty', 'nice', 'cool', 'hot',
  // Intensity adjectives
  'big', 'small', 'huge', 'tiny', 'little', 'giant', 'massive', 'enormous',
  'large', 'bigger', 'biggest', 'smaller', 'smallest',
  // Superlatives
  'ultimate', 'final', 'first', 'last', 'top', 'bottom',
  'extreme', 'insane', 'crazy', 'wild', 'epic', 'legendary',
  // Emotional adjectives
  'happy', 'sad', 'angry', 'mad', 'scared', 'scary', 'funny', 'hilarious',
  'weird', 'strange', 'odd', 'creepy', 'shocking', 'surprising',
  // State adjectives
  'new', 'old', 'young', 'ancient', 'modern', 'fresh',
  'real', 'fake', 'true', 'false', 'right', 'wrong',
  'live', 'dead', 'alive',
  'full', 'empty', 'complete', 'total', 'whole', 'entire',
  'fast', 'slow', 'quick', 'rapid',
  'hard', 'soft', 'easy', 'difficult', 'simple', 'complex',
  'high', 'low', 'deep', 'shallow', 'long', 'short', 'tall',
  'dark', 'light', 'bright', 'dim',
  // Uniqueness adjectives
  'special', 'unique', 'rare', 'common', 'normal', 'regular',
  'secret', 'hidden', 'exclusive', 'private', 'public',
  'different', 'similar', 'same', 'other', 'main', 'major', 'minor',
  // Moral adjectives
  'evil', 'wicked', 'mean', 'cruel', 'kind', 'gentle', 'sweet',
  // Misc
  'important', 'famous', 'popular', 'rich', 'poor', 'free', 'cheap', 'expensive',
  'early', 'late', 'ready', 'possible', 'impossible',
]);

/**
 * Video/media-specific stopwords
 */
export const VIDEO_STOPWORDS = new Set([
  // Video types
  'video', 'videos', 'clip', 'clips', 'scene', 'scenes',
  'music', 'audio', 'sound', 'sounds',
  'movie', 'movies', 'film', 'films', 'show', 'shows',
  // Quality indicators
  'hd', 'hq', 'sd', '4k', '1080p', '720p', '480p', '360p',
  // Version indicators
  'official', 'original', 'extended', 'version', 'versions',
  'remix', 'remixed', 'remaster', 'remastered',
  'cover', 'covers', 'acoustic', 'instrumental',
  // Video content types
  'visualizer', 'lyric', 'lyrics', 'karaoke',
  'trailer', 'trailers', 'teaser', 'teasers', 'promo',
  'reaction', 'reactions', 'review', 'reviews', 'unboxing',
  'tutorial', 'tutorials', 'guide', 'guides', 'howto', 'how-to',
  'compilation', 'compilations', 'montage', 'montages',
  'highlight', 'highlights', 'best', 'moments', 'moment',
  'vlog', 'vlogs', 'blog', 'podcast', 'podcasts',
  'stream', 'streams', 'streaming', 'livestream',
  // Series indicators
  'episode', 'episodes', 'season', 'seasons', 'part', 'parts',
  'chapter', 'chapters', 'series',
  // Credits
  'feat', 'featuring', 'ft', 'prod', 'produced', 'directed', 'by',
  // Platforms
  'youtube', 'tiktok', 'instagram', 'twitter', 'facebook',
  'spotify', 'soundcloud', 'vevo',
  // Common YouTube phrases
  'subscribe', 'like', 'comment', 'share', 'click', 'watch',
  'notification', 'bell', 'channel',
]);

/**
 * URL path segments that should never become tags
 * These are common path components that have no semantic meaning
 */
export const URL_PATH_STOPWORDS = new Set([
  // Video/content paths
  'watch', 'shorts', 'embed', 'e', 'v', 'p', 'c',
  // Social media paths
  'post', 'posts', 'status', 'statuses', 'tweet', 'tweets',
  'reel', 'reels', 'stories', 'story', 'feed',
  'photo', 'photos', 'pic', 'pics', 'image', 'images',
  // Content organization paths
  'article', 'articles', 'blog', 'blogs', 'news', 'item', 'items',
  'page', 'pages', 'view', 'detail', 'details', 'content',
  // Navigation paths
  'home', 'index', 'main', 'default', 'about', 'contact',
  'search', 'results', 'query', 'browse', 'explore', 'discover',
  // User paths
  'user', 'users', 'profile', 'profiles', 'account', 'accounts',
  'channel', 'channels', 'creator', 'author',
  // Common file/document paths
  'docs', 'doc', 'document', 'documents', 'file', 'files',
  'download', 'downloads', 'upload', 'uploads',
  // API/technical paths
  'api', 'data', 'json', 'xml', 'rss', 'feed', 'embed',
  // Misc generic paths
  'link', 'links', 'url', 'share', 'redirect', 'goto', 'go',
]);

/**
 * Suffix patterns for words that are likely nouns
 */
export const NOUN_SUFFIX_PATTERNS: RegExp[] = [
  /er$/i,    // player, singer, writer
  /or$/i,    // actor, director, editor
  /ist$/i,   // artist, pianist, scientist
  /ism$/i,   // journalism, capitalism
  /ity$/i,   // city, community, identity
  /ness$/i,  // happiness, darkness, fitness
  /ment$/i,  // entertainment, movement, moment
  /tion$/i,  // nation, action, collection
  /sion$/i,  // television, mission, vision
  /ance$/i,  // dance, performance, romance
  /ence$/i,  // science, experience, conference
  /dom$/i,   // kingdom, freedom, wisdom
  /ship$/i,  // championship, relationship
  /hood$/i,  // neighborhood, childhood
  /ure$/i,   // culture, nature, adventure
  /ery$/i,   // gallery, mystery, discovery
  /ics$/i,   // physics, politics, economics
  /ogy$/i,   // technology, biology
  /phy$/i,   // philosophy, photography
];

/**
 * Suffix patterns for words that are NOT nouns (verbs, adjectives, adverbs)
 */
export const NON_NOUN_SUFFIX_PATTERNS: RegExp[] = [
  /ing$/i,   // playing, running (gerunds can be nouns, but often not good tags)
  /ly$/i,    // quickly, really (adverbs)
  /ed$/i,    // played, created (past tense)
  /est$/i,   // greatest, fastest (superlatives)
  /ful$/i,   // beautiful, wonderful (adjectives)
  /less$/i,  // careless, hopeless (adjectives)
  /able$/i,  // available, remarkable (adjectives)
  /ible$/i,  // incredible, visible (adjectives)
  /ive$/i,   // creative, active (often adjectives)
  /ous$/i,   // famous, dangerous (adjectives)
  /ious$/i,  // serious, curious (adjectives)
  /al$/i,    // official, final (often adjectives) - note: can be nouns too
];

/**
 * Check if a word is in any stopword list
 */
export function isStopword(word: string): boolean {
  const lower = word.toLowerCase();
  return STOPWORDS.has(lower) ||
         VERB_STOPWORDS.has(lower) ||
         ADJECTIVE_STOPWORDS.has(lower);
}

/**
 * Check if a word is a video-specific stopword
 */
export function isVideoStopword(word: string): boolean {
  return VIDEO_STOPWORDS.has(word.toLowerCase());
}

/**
 * Check if a word is a URL path stopword
 */
export function isUrlPathStopword(word: string): boolean {
  return URL_PATH_STOPWORDS.has(word.toLowerCase());
}

/**
 * Check if a word is in any stopword list (including video and URL)
 */
export function isAnyStopword(word: string): boolean {
  return isStopword(word) || isVideoStopword(word) || isUrlPathStopword(word);
}

/**
 * Heuristically determine if a word is likely a noun
 * Uses suffix patterns and original casing as hints
 */
export function isLikelyNoun(word: string, originalWord?: string): boolean {
  const lower = word.toLowerCase();

  // If in any stopword list, not a good tag
  if (isAnyStopword(lower)) {
    return false;
  }

  // Very short words are rarely good standalone tags
  if (lower.length < 3) {
    return false;
  }

  // Check for non-noun suffixes first (more restrictive)
  for (const pattern of NON_NOUN_SUFFIX_PATTERNS) {
    if (pattern.test(lower)) {
      // Exception: some -ing words are valid nouns (boxing, cooking as topics)
      // Exception: some -al words are nouns (animal, capital)
      // Allow if it's a proper noun (capitalized)
      if (originalWord && /^[A-Z]/.test(originalWord)) {
        return true;
      }
      // Allow common noun exceptions
      const nounExceptions = new Set([
        'boxing', 'cooking', 'fishing', 'gaming', 'hiking', 'skiing', 'surfing',
        'swimming', 'wrestling', 'dancing', 'singing', 'acting', 'racing',
        'programming', 'engineering', 'marketing', 'building', 'training',
        'animal', 'capital', 'hospital', 'festival', 'material', 'metal',
        'original', 'digital', 'criminal', 'general', 'personal', 'professional',
      ]);
      if (nounExceptions.has(lower)) {
        return true;
      }
      return false;
    }
  }

  // Check for noun suffixes (strong signal it's a noun)
  for (const pattern of NOUN_SUFFIX_PATTERNS) {
    if (pattern.test(lower)) {
      return true;
    }
  }

  // If capitalized in original text, likely a proper noun (name, place, brand)
  if (originalWord && /^[A-Z]/.test(originalWord)) {
    return true;
  }

  // Default: allow it, let other filters catch bad ones
  return true;
}

/**
 * Clean and validate a potential tag
 * Returns null if the word shouldn't be a tag
 */
export function validateTag(word: string, originalWord?: string): string | null {
  const lower = word.toLowerCase().trim();

  // Must be at least 3 characters
  if (lower.length < 3) {
    return null;
  }

  // Must not exceed 30 characters
  if (lower.length > 30) {
    return null;
  }

  // Must not be pure numbers
  if (/^\d+$/.test(lower)) {
    return null;
  }

  // Must pass noun check
  if (!isLikelyNoun(lower, originalWord)) {
    return null;
  }

  return lower;
}

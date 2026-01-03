/**
 * Seed Catalog Data for Swipe Deck
 * A diverse collection of media items for user preference discovery
 */

export type SwipeMediaType =
  | 'book'
  | 'movie'
  | 'tv'
  | 'podcast'
  | 'game'
  | 'music'
  | 'youtube'
  | 'documentary'
  | 'standup'
  | 'sports'
  | 'essay'
  | 'public_figure';

export interface SwipeCatalogItem {
  id: string;
  title: string;
  type: SwipeMediaType;
  short_desc: string;
  long_desc?: string;
  tags: string[];
  popularity_score: number;
}

export const SWIPE_MEDIA_TYPES: { type: SwipeMediaType; label: string }[] = [
  { type: 'book', label: 'Books' },
  { type: 'movie', label: 'Movies' },
  { type: 'tv', label: 'TV Shows' },
  { type: 'podcast', label: 'Podcasts' },
  { type: 'game', label: 'Games' },
  { type: 'music', label: 'Music' },
  { type: 'youtube', label: 'YouTube' },
  { type: 'documentary', label: 'Docs' },
  { type: 'standup', label: 'Stand-up' },
  { type: 'sports', label: 'Sports' },
  { type: 'essay', label: 'Essays' },
  { type: 'public_figure', label: 'People' },
];

export const SEED_CATALOG: SwipeCatalogItem[] = [
  // Books
  { id: 'book-1', title: 'Meditations', type: 'book', short_desc: 'Marcus Aurelius - Stoic philosophy', tags: ['philosophy', 'stoicism', 'classic'], popularity_score: 0.95 },
  { id: 'book-2', title: 'Atomic Habits', type: 'book', short_desc: 'James Clear - Building better habits', tags: ['self-improvement', 'productivity', 'psychology'], popularity_score: 0.92 },
  { id: 'book-3', title: 'Sapiens', type: 'book', short_desc: 'Yuval Noah Harari - History of humankind', tags: ['history', 'anthropology', 'science'], popularity_score: 0.91 },
  { id: 'book-4', title: 'The Alchemist', type: 'book', short_desc: 'Paulo Coelho - A journey of self-discovery', tags: ['fiction', 'spiritual', 'adventure'], popularity_score: 0.88 },
  { id: 'book-5', title: 'Deep Work', type: 'book', short_desc: 'Cal Newport - Focused success in a distracted world', tags: ['productivity', 'career', 'focus'], popularity_score: 0.87 },
  { id: 'book-6', title: '1984', type: 'book', short_desc: 'George Orwell - Dystopian classic', tags: ['fiction', 'dystopia', 'classic'], popularity_score: 0.93 },
  { id: 'book-7', title: 'Thinking, Fast and Slow', type: 'book', short_desc: 'Daniel Kahneman - Psychology of decision making', tags: ['psychology', 'economics', 'cognition'], popularity_score: 0.89 },
  { id: 'book-8', title: 'The Power of Now', type: 'book', short_desc: 'Eckhart Tolle - Spiritual enlightenment', tags: ['spirituality', 'mindfulness', 'self-help'], popularity_score: 0.85 },

  // Movies
  { id: 'movie-1', title: 'Inception', type: 'movie', short_desc: 'Christopher Nolan - Mind-bending thriller', tags: ['sci-fi', 'thriller', 'action'], popularity_score: 0.94 },
  { id: 'movie-2', title: 'The Shawshank Redemption', type: 'movie', short_desc: 'Hope and friendship in prison', tags: ['drama', 'classic', 'inspiring'], popularity_score: 0.97 },
  { id: 'movie-3', title: 'Interstellar', type: 'movie', short_desc: 'Space exploration and love', tags: ['sci-fi', 'space', 'emotional'], popularity_score: 0.93 },
  { id: 'movie-4', title: 'The Matrix', type: 'movie', short_desc: 'Reality is not what it seems', tags: ['sci-fi', 'action', 'philosophy'], popularity_score: 0.92 },
  { id: 'movie-5', title: 'Parasite', type: 'movie', short_desc: 'Bong Joon-ho - Class divide thriller', tags: ['thriller', 'drama', 'korean'], popularity_score: 0.91 },
  { id: 'movie-6', title: 'The Dark Knight', type: 'movie', short_desc: 'Batman vs The Joker', tags: ['action', 'superhero', 'thriller'], popularity_score: 0.95 },
  { id: 'movie-7', title: 'Pulp Fiction', type: 'movie', short_desc: 'Tarantino crime anthology', tags: ['crime', 'drama', 'cult-classic'], popularity_score: 0.90 },
  { id: 'movie-8', title: 'Whiplash', type: 'movie', short_desc: 'Pursuit of greatness in jazz', tags: ['drama', 'music', 'intense'], popularity_score: 0.88 },

  // TV Shows
  { id: 'tv-1', title: 'Breaking Bad', type: 'tv', short_desc: 'Chemistry teacher turns drug lord', tags: ['drama', 'crime', 'thriller'], popularity_score: 0.96 },
  { id: 'tv-2', title: 'The Office', type: 'tv', short_desc: 'Mockumentary workplace comedy', tags: ['comedy', 'sitcom', 'workplace'], popularity_score: 0.91 },
  { id: 'tv-3', title: 'Game of Thrones', type: 'tv', short_desc: 'Epic fantasy drama', tags: ['fantasy', 'drama', 'epic'], popularity_score: 0.89 },
  { id: 'tv-4', title: 'Succession', type: 'tv', short_desc: 'Media dynasty power struggles', tags: ['drama', 'satire', 'family'], popularity_score: 0.90 },
  { id: 'tv-5', title: 'The Wire', type: 'tv', short_desc: 'Baltimore crime and institutions', tags: ['drama', 'crime', 'social-commentary'], popularity_score: 0.94 },
  { id: 'tv-6', title: 'Black Mirror', type: 'tv', short_desc: 'Dark tech anthology', tags: ['sci-fi', 'anthology', 'dystopia'], popularity_score: 0.87 },
  { id: 'tv-7', title: 'Ted Lasso', type: 'tv', short_desc: 'Optimistic American coach in England', tags: ['comedy', 'sports', 'heartwarming'], popularity_score: 0.88 },
  { id: 'tv-8', title: 'Severance', type: 'tv', short_desc: 'Work-life separation thriller', tags: ['thriller', 'sci-fi', 'mystery'], popularity_score: 0.86 },

  // Podcasts
  { id: 'podcast-1', title: 'Huberman Lab', type: 'podcast', short_desc: 'Neuroscience and health protocols', tags: ['science', 'health', 'education'], popularity_score: 0.92 },
  { id: 'podcast-2', title: 'Lex Fridman Podcast', type: 'podcast', short_desc: 'Deep conversations with thinkers', tags: ['technology', 'philosophy', 'interviews'], popularity_score: 0.90 },
  { id: 'podcast-3', title: 'Tim Ferriss Show', type: 'podcast', short_desc: 'Deconstruct world-class performers', tags: ['business', 'self-improvement', 'interviews'], popularity_score: 0.88 },
  { id: 'podcast-4', title: 'Hardcore History', type: 'podcast', short_desc: 'Dan Carlin epic historical narratives', tags: ['history', 'storytelling', 'education'], popularity_score: 0.93 },
  { id: 'podcast-5', title: 'The Daily', type: 'podcast', short_desc: 'NY Times daily news deep dive', tags: ['news', 'current-events', 'journalism'], popularity_score: 0.85 },
  { id: 'podcast-6', title: 'Acquired', type: 'podcast', short_desc: 'Business and tech company histories', tags: ['business', 'tech', 'history'], popularity_score: 0.87 },
  { id: 'podcast-7', title: 'Philosophize This!', type: 'podcast', short_desc: 'Philosophy made accessible', tags: ['philosophy', 'education', 'ideas'], popularity_score: 0.84 },
  { id: 'podcast-8', title: 'The Knowledge Project', type: 'podcast', short_desc: 'Shane Parrish - Mental models', tags: ['thinking', 'decision-making', 'wisdom'], popularity_score: 0.86 },

  // Games
  { id: 'game-1', title: 'The Legend of Zelda: BOTW', type: 'game', short_desc: 'Open world adventure masterpiece', tags: ['adventure', 'open-world', 'nintendo'], popularity_score: 0.96 },
  { id: 'game-2', title: 'Elden Ring', type: 'game', short_desc: 'FromSoftware open world souls-like', tags: ['rpg', 'action', 'fantasy'], popularity_score: 0.94 },
  { id: 'game-3', title: 'The Last of Us', type: 'game', short_desc: 'Post-apocalyptic narrative adventure', tags: ['story', 'action', 'emotional'], popularity_score: 0.93 },
  { id: 'game-4', title: 'Red Dead Redemption 2', type: 'game', short_desc: 'Western open world epic', tags: ['open-world', 'western', 'story'], popularity_score: 0.95 },
  { id: 'game-5', title: 'Hades', type: 'game', short_desc: 'Roguelike with Greek mythology', tags: ['roguelike', 'action', 'indie'], popularity_score: 0.91 },
  { id: 'game-6', title: 'Minecraft', type: 'game', short_desc: 'Creative sandbox phenomenon', tags: ['sandbox', 'creative', 'multiplayer'], popularity_score: 0.92 },
  { id: 'game-7', title: 'Hollow Knight', type: 'game', short_desc: 'Atmospheric metroidvania', tags: ['metroidvania', 'indie', 'challenging'], popularity_score: 0.89 },
  { id: 'game-8', title: 'Portal 2', type: 'game', short_desc: 'Puzzle game with wit and charm', tags: ['puzzle', 'comedy', 'sci-fi'], popularity_score: 0.90 },

  // Music Artists
  { id: 'music-1', title: 'Kendrick Lamar', type: 'music', short_desc: 'Conscious hip-hop storyteller', tags: ['hip-hop', 'rap', 'lyrical'], popularity_score: 0.94 },
  { id: 'music-2', title: 'Taylor Swift', type: 'music', short_desc: 'Pop and country crossover icon', tags: ['pop', 'country', 'songwriting'], popularity_score: 0.95 },
  { id: 'music-3', title: 'Radiohead', type: 'music', short_desc: 'Experimental rock pioneers', tags: ['rock', 'alternative', 'experimental'], popularity_score: 0.88 },
  { id: 'music-4', title: 'Frank Ocean', type: 'music', short_desc: 'Introspective R&B artist', tags: ['r&b', 'soul', 'introspective'], popularity_score: 0.90 },
  { id: 'music-5', title: 'Billie Eilish', type: 'music', short_desc: 'Dark pop sensation', tags: ['pop', 'alternative', 'electronica'], popularity_score: 0.91 },
  { id: 'music-6', title: 'Hans Zimmer', type: 'music', short_desc: 'Legendary film composer', tags: ['soundtrack', 'orchestral', 'cinematic'], popularity_score: 0.89 },
  { id: 'music-7', title: 'Khruangbin', type: 'music', short_desc: 'Psychedelic world music fusion', tags: ['psychedelic', 'funk', 'world-music'], popularity_score: 0.85 },
  { id: 'music-8', title: 'Tyler, the Creator', type: 'music', short_desc: 'Creative hip-hop visionary', tags: ['hip-hop', 'experimental', 'creative'], popularity_score: 0.87 },

  // YouTube Creators
  { id: 'youtube-1', title: 'Veritasium', type: 'youtube', short_desc: 'Science and engineering explained', tags: ['science', 'education', 'physics'], popularity_score: 0.91 },
  { id: 'youtube-2', title: 'Kurzgesagt', type: 'youtube', short_desc: 'Animated science and philosophy', tags: ['science', 'animation', 'philosophy'], popularity_score: 0.93 },
  { id: 'youtube-3', title: 'MKBHD', type: 'youtube', short_desc: 'Quality tech reviews', tags: ['tech', 'reviews', 'gadgets'], popularity_score: 0.90 },
  { id: 'youtube-4', title: '3Blue1Brown', type: 'youtube', short_desc: 'Math visualized beautifully', tags: ['math', 'education', 'visual'], popularity_score: 0.89 },
  { id: 'youtube-5', title: 'Mark Rober', type: 'youtube', short_desc: 'Engineering and science projects', tags: ['engineering', 'science', 'entertainment'], popularity_score: 0.92 },
  { id: 'youtube-6', title: 'Vsauce', type: 'youtube', short_desc: 'Mind-bending curiosity explorations', tags: ['science', 'philosophy', 'curiosity'], popularity_score: 0.88 },
  { id: 'youtube-7', title: 'Casey Neistat', type: 'youtube', short_desc: 'Cinematic daily vlogs', tags: ['vlog', 'filmmaking', 'storytelling'], popularity_score: 0.86 },
  { id: 'youtube-8', title: 'Fireship', type: 'youtube', short_desc: 'Fast-paced tech/coding content', tags: ['programming', 'tech', 'humor'], popularity_score: 0.87 },

  // Documentaries
  { id: 'doc-1', title: 'Planet Earth', type: 'documentary', short_desc: 'BBC nature documentary', tags: ['nature', 'wildlife', 'bbc'], popularity_score: 0.95 },
  { id: 'doc-2', title: 'The Social Dilemma', type: 'documentary', short_desc: 'Tech addiction expose', tags: ['tech', 'social-media', 'psychology'], popularity_score: 0.87 },
  { id: 'doc-3', title: 'Free Solo', type: 'documentary', short_desc: 'Alex Honnold climbs El Capitan', tags: ['sports', 'climbing', 'adventure'], popularity_score: 0.91 },
  { id: 'doc-4', title: 'Making a Murderer', type: 'documentary', short_desc: 'True crime investigation', tags: ['true-crime', 'justice', 'investigation'], popularity_score: 0.88 },
  { id: 'doc-5', title: 'Jiro Dreams of Sushi', type: 'documentary', short_desc: 'Sushi master dedication', tags: ['food', 'craftsmanship', 'japan'], popularity_score: 0.86 },
  { id: 'doc-6', title: 'The Last Dance', type: 'documentary', short_desc: 'Michael Jordan and 90s Bulls', tags: ['sports', 'basketball', 'biography'], popularity_score: 0.92 },
  { id: 'doc-7', title: 'Our Planet', type: 'documentary', short_desc: 'Nature and climate change', tags: ['nature', 'environment', 'conservation'], popularity_score: 0.90 },
  { id: 'doc-8', title: 'Won\'t You Be My Neighbor?', type: 'documentary', short_desc: 'Fred Rogers biography', tags: ['biography', 'inspiring', 'education'], popularity_score: 0.85 },

  // Stand-up Comedy
  { id: 'standup-1', title: 'Dave Chappelle', type: 'standup', short_desc: 'Sharp social commentary', tags: ['comedy', 'social-commentary', 'controversial'], popularity_score: 0.91 },
  { id: 'standup-2', title: 'Bo Burnham', type: 'standup', short_desc: 'Musical comedy and existentialism', tags: ['comedy', 'musical', 'millennial'], popularity_score: 0.89 },
  { id: 'standup-3', title: 'Hannah Gadsby', type: 'standup', short_desc: 'Nanette changed comedy', tags: ['comedy', 'storytelling', 'emotional'], popularity_score: 0.84 },
  { id: 'standup-4', title: 'John Mulaney', type: 'standup', short_desc: 'Clean observational comedy', tags: ['comedy', 'observational', 'storytelling'], popularity_score: 0.90 },
  { id: 'standup-5', title: 'Hasan Minhaj', type: 'standup', short_desc: 'Political and personal comedy', tags: ['comedy', 'political', 'immigrant'], popularity_score: 0.86 },
  { id: 'standup-6', title: 'Bill Burr', type: 'standup', short_desc: 'Angry everyman observations', tags: ['comedy', 'rants', 'sports'], popularity_score: 0.88 },
  { id: 'standup-7', title: 'Ali Wong', type: 'standup', short_desc: 'Raunchy relationship comedy', tags: ['comedy', 'relationships', 'parenting'], popularity_score: 0.85 },
  { id: 'standup-8', title: 'Trevor Noah', type: 'standup', short_desc: 'Global perspective comedy', tags: ['comedy', 'political', 'international'], popularity_score: 0.83 },

  // Sports Events/Teams
  { id: 'sports-1', title: 'FIFA World Cup', type: 'sports', short_desc: 'Global football tournament', tags: ['football', 'soccer', 'international'], popularity_score: 0.96 },
  { id: 'sports-2', title: 'NBA Finals', type: 'sports', short_desc: 'Basketball championship', tags: ['basketball', 'nba', 'championship'], popularity_score: 0.91 },
  { id: 'sports-3', title: 'Olympics', type: 'sports', short_desc: 'Global multi-sport event', tags: ['international', 'multi-sport', 'athletics'], popularity_score: 0.94 },
  { id: 'sports-4', title: 'Tour de France', type: 'sports', short_desc: 'Legendary cycling race', tags: ['cycling', 'endurance', 'europe'], popularity_score: 0.82 },
  { id: 'sports-5', title: 'Super Bowl', type: 'sports', short_desc: 'American football championship', tags: ['football', 'american', 'championship'], popularity_score: 0.93 },
  { id: 'sports-6', title: 'Wimbledon', type: 'sports', short_desc: 'Prestigious tennis tournament', tags: ['tennis', 'tradition', 'uk'], popularity_score: 0.87 },
  { id: 'sports-7', title: 'UFC', type: 'sports', short_desc: 'Mixed martial arts fighting', tags: ['mma', 'fighting', 'combat'], popularity_score: 0.85 },
  { id: 'sports-8', title: 'Formula 1', type: 'sports', short_desc: 'Pinnacle of motorsport', tags: ['racing', 'motorsport', 'technology'], popularity_score: 0.88 },

  // Essays/Long-form
  { id: 'essay-1', title: 'This Is Water', type: 'essay', short_desc: 'David Foster Wallace speech', tags: ['philosophy', 'life', 'awareness'], popularity_score: 0.90 },
  { id: 'essay-2', title: 'Politics and the English Language', type: 'essay', short_desc: 'George Orwell on clear writing', tags: ['writing', 'politics', 'language'], popularity_score: 0.85 },
  { id: 'essay-3', title: 'How to Do What You Love', type: 'essay', short_desc: 'Paul Graham on work and passion', tags: ['career', 'passion', 'life'], popularity_score: 0.87 },
  { id: 'essay-4', title: 'The Egg', type: 'essay', short_desc: 'Andy Weir - Short story on existence', tags: ['fiction', 'philosophy', 'short-story'], popularity_score: 0.88 },
  { id: 'essay-5', title: 'Leisure: The Basis of Culture', type: 'essay', short_desc: 'Josef Pieper on rest', tags: ['philosophy', 'work', 'culture'], popularity_score: 0.81 },
  { id: 'essay-6', title: 'The Cathedral and the Bazaar', type: 'essay', short_desc: 'Eric Raymond on open source', tags: ['technology', 'open-source', 'software'], popularity_score: 0.82 },
  { id: 'essay-7', title: 'A Letter to My Daughter', type: 'essay', short_desc: 'Maya Angelou on life lessons', tags: ['life', 'wisdom', 'parenting'], popularity_score: 0.84 },
  { id: 'essay-8', title: 'Self-Reliance', type: 'essay', short_desc: 'Ralph Waldo Emerson classic', tags: ['philosophy', 'individualism', 'classic'], popularity_score: 0.86 },

  // Public Figures
  { id: 'figure-1', title: 'Elon Musk', type: 'public_figure', short_desc: 'Tech entrepreneur, SpaceX/Tesla', tags: ['tech', 'entrepreneur', 'space'], popularity_score: 0.93 },
  { id: 'figure-2', title: 'Naval Ravikant', type: 'public_figure', short_desc: 'Angel investor, philosopher', tags: ['investing', 'philosophy', 'startups'], popularity_score: 0.87 },
  { id: 'figure-3', title: 'Brene Brown', type: 'public_figure', short_desc: 'Vulnerability researcher', tags: ['psychology', 'leadership', 'vulnerability'], popularity_score: 0.85 },
  { id: 'figure-4', title: 'Jordan Peterson', type: 'public_figure', short_desc: 'Psychology professor, author', tags: ['psychology', 'philosophy', 'controversial'], popularity_score: 0.84 },
  { id: 'figure-5', title: 'David Attenborough', type: 'public_figure', short_desc: 'Nature broadcaster legend', tags: ['nature', 'documentary', 'conservation'], popularity_score: 0.92 },
  { id: 'figure-6', title: 'Michelle Obama', type: 'public_figure', short_desc: 'Former First Lady, author', tags: ['politics', 'inspiration', 'memoir'], popularity_score: 0.88 },
  { id: 'figure-7', title: 'Sam Altman', type: 'public_figure', short_desc: 'OpenAI CEO, tech leader', tags: ['ai', 'tech', 'startups'], popularity_score: 0.86 },
  { id: 'figure-8', title: 'Oprah Winfrey', type: 'public_figure', short_desc: 'Media mogul, philanthropist', tags: ['media', 'inspiration', 'philanthropy'], popularity_score: 0.91 },
];

const ICEBREAKER_QUESTIONS = [
  "What's the most interesting place you've written about recently?",
  "If you could have dinner with anyone you've mentioned in your journal, who would it be?",
  "What's a hobby or interest you've been exploring that might surprise people?",
  "What's the best advice you've received that you've written about?",
  "What's a small daily ritual you enjoy that you've journaled about?",
  "If you could master any skill you've mentioned, what would it be?",
  "What's a book, movie, or show that's influenced your recent thoughts?",
  "What's something you're grateful for that you don't talk about often?",
  "What's a challenge you've overcome that you're proud of?",
  "If you could time travel to any period you've written about, when would it be?",
  "What's a dream or goal you've been thinking about lately?",
  "What's the most beautiful thing you've observed recently?",
  "What's a tradition or memory that's particularly meaningful to you?",
  "If you could have a superpower based on your interests, what would it be?",
  "What's something new you've learned about yourself recently?",
  "What's a place that always makes you feel peaceful?",
  "What's the most interesting conversation you've had recently?",
  "If you could instantly become an expert in something you've mentioned, what would it be?",
  "What's a small act of kindness that made a big impact on you?",
  "What's something you're looking forward to that you've written about?",
];

export function getRandomQuestions(count: number = 3): string[] {
  const shuffled = [...ICEBREAKER_QUESTIONS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function getAllQuestions(): string[] {
  return [...ICEBREAKER_QUESTIONS];
}
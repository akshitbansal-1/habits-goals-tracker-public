export interface Quote {
  text: string
  author: string
}

export const quotes: Quote[] = [
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "Every action you take is a vote for the type of person you wish to become.", author: "James Clear" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Robin Sharma" },
  { text: "It's not about being perfect. It's about effort. And when you implement that effort every single day, that's where transformation happens.", author: "Jillian Michaels" },
  { text: "The difference between who you are and who you want to be is what you do.", author: "Unknown" },
  { text: "One day or day one. You decide.", author: "Unknown" },
  { text: "Motivation gets you going, but discipline keeps you growing.", author: "John C. Maxwell" },
  { text: "The pain of discipline is far less than the pain of regret.", author: "Unknown" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
  { text: "Progress, not perfection.", author: "Unknown" },
  { text: "A year from now you'll wish you had started today.", author: "Karen Lamb" },
  { text: "Your only competition is who you were yesterday.", author: "Unknown" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Mahatma Gandhi" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
  { text: "Success isn't always about greatness. It's about consistency.", author: "Dwayne Johnson" },
  { text: "Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.", author: "Christian D. Larson" },
  { text: "The groundwork for all happiness is good health.", author: "Leigh Hunt" },
  { text: "What seems hard now will one day be your warm-up.", author: "Unknown" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
  { text: "Be patient with yourself. Self-growth is tender; it's holy ground.", author: "Stephen Covey" },
  { text: "You are one decision away from a completely different life.", author: "Unknown" },
]

export function getRandomQuote(): Quote {
  return quotes[Math.floor(Math.random() * quotes.length)]!
}

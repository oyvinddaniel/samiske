/**
 * Mock Data for Layout Demos
 * Realistic samisk data for demonstrasjon purposes
 */

export interface MockUser {
  id: string;
  name: string;
  avatar: string;
  location?: string;
  bio?: string;
}

export interface MockPost {
  id: string;
  author: MockUser;
  content: string;
  images?: string[];
  timestamp: Date;
  likes: number;
  comments: number;
  shares: number;
  location?: string;
  community?: string;
  group?: string;
  type?: 'text' | 'image' | 'event' | 'poll';
}

export interface MockComment {
  id: string;
  author: MockUser;
  content: string;
  timestamp: Date;
  likes: number;
}

export interface MockEvent {
  id: string;
  title: string;
  date: Date;
  location: string;
  attendees: number;
  image?: string;
}

export interface MockCommunity {
  id: string;
  name: string;
  description: string;
  members: number;
  logo: string;
  category: string;
}

// Samisk names and locations
const samiskNames = [
  { name: 'Áile Somby', location: 'Guovdageaidnu' },
  { name: 'Elle-Máijá Vars', location: 'Kárášjohka' },
  { name: 'Jon Anders Kalstad', location: 'Romsa' },
  { name: 'Maja Kristine Jåma', location: 'Deatnu' },
  { name: 'Nils-Aslak Valkeapää', location: 'Ohcejohka' },
  { name: 'Sara Marielle Gaup', location: 'Unjárga' },
  { name: 'Mikkel Nils Sara', location: 'Máze' },
  { name: 'Liisa-Rávdná Finbog', location: 'Álaheadju' },
  { name: 'Johan Márte Turi', location: 'Avvil' },
  { name: 'Inger Anne Buljo', location: 'Čorgašluokta' },
];

const samiskLocations = [
  'Guovdageaidnu', 'Kárášjohka', 'Romsa', 'Deatnu', 'Ohcejohka',
  'Unjárga', 'Máze', 'Álaheadju', 'Avvil', 'Čorgašluokta', 'Divtasvuodna',
  'Gáivuotna', 'Bálák', 'Billávuotna', 'Čohkkiras'
];

const postContents = [
  'Akkurat kommet hjem fra reinflytt! 🦌 Fantastisk dag på vidda med flott vær. Bildene kommer snart!',
  'Er det noen som skal på duodjimárkadat i helga? Trenger transport fra Romsa.',
  'Siste sjanse til å melde seg på joik-workshopen! Fremdeles noen plasser igjen. Velkommen!',
  'Takk for en fantastisk samisk uke! Gleder meg allerede til neste år. 💙❤️💛',
  'Husker noen navnet på den tradisjonelle retten vi fikk på lavvoen i går? Må ha oppskriften!',
  'Kven kjenner ein god duojár som kan hjelpe meg med å reparere gákti? Takk!',
  'Flott å se så mange unge som lærer seg samisk! Mánáid gullu lea ipmárdus árbevieruid.',
  'Har dere sett nordlyset i natt? Helt magisk fra Golmmačohkka! 🌌',
  'Søker: Noen som kan lære meg tradisjonell reindrift? Gjerne mentor eller kurs.',
  'Giitu! 🙏 For all støtte og hjelp med arrangementet. Dere er gull verdt!',
  'Lurer på om det finnes noen samisk språkkurs online? Vil gjerne bli flinkere.',
  'Beste kafeen i Guovdageaidnu? Trenger anbefaling til besøkende.',
  'Del gjerne deres favorittsang på samisk! Trenger ny musikk til kjøreturen. 🎵',
  'Noen som vet når Riddu Riđđu festivalen er i år? Må planlegge ferie!',
  'Helt utrolig opplevelse på Sámi Grand Prix! Gratulerer til alle artistene!',
];

const communityNames = [
  { name: 'Duodji i praksis', description: 'Del dine duodjiprosjekter og lær av hverandre', category: 'Håndverk' },
  { name: 'Samisk matkultur', description: 'Tradisjonelle og moderne samiske oppskrifter', category: 'Mat' },
  { name: 'Nordsamisk språk', description: 'Lær og øv på nordsamisk sammen', category: 'Språk' },
  { name: 'Reindriftsnett', description: 'For alle med interesse for reindrift', category: 'Næring' },
  { name: 'Samisk musikk', description: 'Joik, samisk pop, og alt imellom', category: 'Kultur' },
];

// Generate mock users
export const mockUsers: MockUser[] = samiskNames.map((person, index) => ({
  id: `user-${index + 1}`,
  name: person.name,
  avatar: `https://i.pravatar.cc/150?img=${index + 1}`,
  location: person.location,
  bio: index % 3 === 0 ? 'Interessert i samisk kultur og tradisjon' : undefined,
}));

// Generate mock posts
export const mockPosts: MockPost[] = Array.from({ length: 20 }, (_, index) => {
  const author = mockUsers[index % mockUsers.length];
  const hasImages = index % 3 === 0;
  const hasLocation = index % 2 === 0;
  const hasCommunity = index % 4 === 0;

  const daysAgo = Math.floor(index / 2);
  const timestamp = new Date();
  timestamp.setDate(timestamp.getDate() - daysAgo);
  timestamp.setHours(timestamp.getHours() - (index % 24));

  return {
    id: `post-${index + 1}`,
    author,
    content: postContents[index % postContents.length],
    images: hasImages ? [
      `https://picsum.photos/seed/${index + 1}/800/600`,
      ...(index % 5 === 0 ? [`https://picsum.photos/seed/${index + 100}/800/600`] : [])
    ] : undefined,
    timestamp,
    likes: Math.floor(Math.random() * 50) + 5,
    comments: Math.floor(Math.random() * 20) + 2,
    shares: Math.floor(Math.random() * 10),
    location: hasLocation ? samiskLocations[index % samiskLocations.length] : undefined,
    community: hasCommunity ? communityNames[index % communityNames.length].name : undefined,
    type: hasImages ? 'image' : 'text',
  };
});

// Generate mock comments
export const mockComments: MockComment[] = Array.from({ length: 30 }, (_, index) => ({
  id: `comment-${index + 1}`,
  author: mockUsers[(index + 3) % mockUsers.length],
  content: [
    'Flott innlegg! 👍',
    'Takk for at du deler dette!',
    'Helt enig! Dette er viktig.',
    'Hvor kan jeg finne mer info om dette?',
    'Fantastiske bilder!',
    'Giitu! Veldig nyttig informasjon.',
    'Jeg er så enig i dette. Bra sagt!',
    'Noen som vil bli med på dette?',
  ][index % 8],
  timestamp: new Date(Date.now() - index * 3600000), // Hours ago
  likes: Math.floor(Math.random() * 15) + 1,
}));

// Generate mock events
export const mockEvents: MockEvent[] = [
  {
    id: 'event-1',
    title: 'Samisk språkkurs',
    date: new Date(Date.now() + 7 * 24 * 3600000), // 7 days from now
    location: 'Guovdageaidnu',
    attendees: 24,
    image: 'https://picsum.photos/seed/event1/400/300',
  },
  {
    id: 'event-2',
    title: 'Duodjimárkadat',
    date: new Date(Date.now() + 14 * 24 * 3600000), // 14 days
    location: 'Kárášjohka',
    attendees: 156,
    image: 'https://picsum.photos/seed/event2/400/300',
  },
  {
    id: 'event-3',
    title: 'Joik-workshop',
    date: new Date(Date.now() + 21 * 24 * 3600000), // 21 days
    location: 'Romsa',
    attendees: 45,
  },
  {
    id: 'event-4',
    title: 'Riddu Riđđu Festival',
    date: new Date(Date.now() + 90 * 24 * 3600000), // ~3 months
    location: 'Gáivuotna',
    attendees: 2400,
    image: 'https://picsum.photos/seed/event4/400/300',
  },
  {
    id: 'event-5',
    title: 'Reinflytt',
    date: new Date(Date.now() + 5 * 24 * 3600000), // 5 days
    location: 'Máze',
    attendees: 18,
  },
];

// Generate mock communities
export const mockCommunities: MockCommunity[] = communityNames.map((community, index) => ({
  id: `community-${index + 1}`,
  name: community.name,
  description: community.description,
  members: Math.floor(Math.random() * 500) + 50,
  logo: `https://i.pravatar.cc/150?img=${index + 20}`,
  category: community.category,
}));

// Trending topics
export const mockTrendingTopics = [
  { tag: '#duodji', count: 234 },
  { tag: '#joik', count: 189 },
  { tag: '#sápmi', count: 456 },
  { tag: '#samiskspråk', count: 178 },
  { tag: '#reindrift', count: 145 },
];

// Stats
export const mockStats = {
  totalMembers: 1247,
  postsToday: 34,
  commentsToday: 156,
  onlineNow: 89,
};

// Helper function to get random items
export function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Helper function to format timestamp
export function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffInMinutes < 1) return 'Akkurat nå';
  if (diffInMinutes < 60) return `${diffInMinutes} min siden`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} timer siden`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} dager siden`;

  return date.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' });
}

// Helper function to format number
export function formatNumber(num: number): string {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}

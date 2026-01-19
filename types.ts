
export interface Character {
  id: string;
  name: string;
  avatar: string;
  background: string;
  preferences: string;
  storyline: string;
  isFavorite?: boolean;
  // Perception settings
  perceiveWorldNews?: boolean;
  perceiveSocialMedia?: boolean;
  perceiveUserPersona?: boolean;
}

export interface UserProfile {
  name: string;
  wechatId: string;
  avatar: string;
  persona: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  type: 'text' | 'image' | 'transfer' | 'sticker' | 'location';
  timestamp: number;
  amount?: number;
  locationName?: string;
  status?: 'pending' | 'received';
}

export interface ChatSession {
  characterId: string;
  messages: Message[];
  lastMessageAt: number;
}

export interface SocialPost {
  id: string;
  authorId: string;
  content: string;
  images: string[];
  timestamp: number;
  likes: number;
  comments: number;
}

export interface ApiSettings {
  model: string;
  apiKey: string;
}

export interface ApiConfig {
  chat: ApiSettings;
  world: ApiSettings;
}

export interface Ticket {
  id: string;
  title: string;
  date: string;
  price: number;
  category: 'concert' | 'movie' | 'theater';
  image: string;
  isPurchased?: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  category: string;
  timestamp: number;
}

export interface WorldState {
  worldDescription: string;
  currentDate: string;
  news: NewsItem[];
  tickets: Ticket[];
}

export type AppId = 'home' | 'wechat' | 'weibo' | 'damai' | 'news' | 'settings';

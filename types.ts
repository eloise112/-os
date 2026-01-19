
export interface Character {
  id: string;
  name: string;
  avatar: string;
  background: string;
  preferences: string;
  storyline: string;
  firstMessage?: string;
  isFavorite?: boolean;
  // Perception settings
  perceiveWorldNews?: boolean;
  perceiveSocialMedia?: boolean;
  perceiveUserPersona?: boolean;
  // Behavioral settings
  momentsFrequency?: 'none' | 'low' | 'medium' | 'high';
  weiboFrequency?: 'none' | 'low' | 'medium' | 'high';
  proactiveMessageFrequency?: 'none' | 'low' | 'medium' | 'high';
  proactiveDateFrequency?: 'none' | 'low' | 'medium' | 'high';
  allowVirtualTransfer?: boolean;
}

export interface UserProfile {
  name: string;
  wechatId: string;
  avatar: string;
  persona: string;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: number;
  replyToName?: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  type: 'text' | 'image' | 'transfer' | 'sticker' | 'location' | 'action';
  timestamp: number;
  amount?: number;
  locationName?: string;
  status?: 'pending' | 'received';
}

export interface ChatSession {
  characterId: string;
  messages: Message[];
  lastMessageAt: number;
  unreadCount?: number;
  isTyping?: boolean;
}

export interface SocialPost {
  id: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  content: string;
  images: string[];
  timestamp: number;
  likes: number;
  likedByMe?: boolean;
  comments: number;
  commentsList?: Comment[];
  platform: 'moments' | 'weibo';
  isVirtual?: boolean;
}

export interface HotSearchItem {
  id: string;
  title: string;
  hotness: string; // e.g. "120w"
  tag?: '热' | '新' | '爆' | '荐';
}

export interface ApiSettings {
  model: string;
  apiKey: string;
}

export interface ApiConfig {
  chat: ApiSettings;
  world: ApiSettings;
  providerKeys: {
    zhipu?: string;
    deepseek?: string;
  };
}

export interface Ticket {
  id: string;
  title: string;
  date: string;
  price: number;
  category: 'concert' | 'movie' | 'theater' | 'sports' | 'exhibition';
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
  hotSearches: HotSearchItem[];
  // Interaction settings
  enableMomentsInteraction: boolean;
  maxMomentReplies: number;
}

export type AppId = 'home' | 'wechat' | 'weibo' | 'damai' | 'news' | 'settings';


import React, { useState, useEffect } from 'react';
import { 
  AppId, 
  Character, 
  ChatSession, 
  Message, 
  WorldState, 
  SocialPost,
  UserProfile,
  ApiConfig
} from './types';
import { INITIAL_CHARACTERS, INITIAL_WORLD } from './constants';
import { generateCharacterResponse, generateDailyNewsAndSocial } from './services/gemini';

// Components
import HomeScreen from './components/HomeScreen';
import WeChatApp from './components/WeChatApp';
import WeiboApp from './components/WeiboApp';
import DamaiApp from './components/DamaiApp';
import NewsApp from './components/NewsApp';
import SettingsApp from './components/SettingsApp';

const INITIAL_POSTS: SocialPost[] = [
  {
    id: 'post1',
    authorId: 'char1',
    content: '晚宴后的露台，晚风有些冷。商业博弈固然有趣，但有时也让人疲惫。想起某人的茶，或许那才是解药。',
    images: ['https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=400'],
    timestamp: Date.now() - 3600000 * 2,
    likes: 12,
    comments: 3
  },
  {
    id: 'post2',
    authorId: 'char2',
    content: '新的防火墙很有趣，但在我面前撑不过三分钟。😏 顺便提一句，那个包裹的地址指向了一个很有趣的地方...准备好出发了吗？',
    images: ['https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=400', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=400'],
    timestamp: Date.now() - 3600000 * 5,
    likes: 24,
    comments: 8
  },
  {
    id: 'post3',
    authorId: 'user',
    content: '今天的天气不错，适合在模拟器里发发呆。☕️',
    images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400'],
    timestamp: Date.now() - 3600000 * 24,
    likes: 5,
    comments: 1
  }
];

const App: React.FC = () => {
  const [activeApp, setActiveApp] = useState<AppId>('home');
  const [characters, setCharacters] = useState<Character[]>(() => {
    const saved = localStorage.getItem('gs_chars');
    return saved ? JSON.parse(saved) : INITIAL_CHARACTERS;
  });
  const [world, setWorld] = useState<WorldState>(() => {
    const saved = localStorage.getItem('gs_world');
    return saved ? JSON.parse(saved) : INITIAL_WORLD;
  });
  const [chats, setChats] = useState<Record<string, ChatSession>>(() => {
    const saved = localStorage.getItem('gs_chats');
    return saved ? JSON.parse(saved) : {};
  });
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>(() => {
    const saved = localStorage.getItem('gs_social');
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('gs_user');
    return saved ? JSON.parse(saved) : {
      name: '测试用户',
      wechatId: 'Gemini_User_01',
      avatar: 'https://picsum.photos/seed/user/100/100',
      persona: '你是一名热爱生活的现代都市青年，性格温和，对世界充满好奇。'
    };
  });
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => {
    const saved = localStorage.getItem('gs_api_config');
    return saved ? JSON.parse(saved) : {
      chat: { model: 'gemini-3-pro-preview', apiKey: '' },
      world: { model: 'gemini-3-flash-preview', apiKey: '' }
    };
  });
  const [balance, setBalance] = useState(10000);

  useEffect(() => {
    localStorage.setItem('gs_chars', JSON.stringify(characters));
    localStorage.setItem('gs_world', JSON.stringify(world));
    localStorage.setItem('gs_chats', JSON.stringify(chats));
    localStorage.setItem('gs_social', JSON.stringify(socialPosts));
    localStorage.setItem('gs_user', JSON.stringify(userProfile));
    localStorage.setItem('gs_api_config', JSON.stringify(apiConfig));
  }, [characters, world, chats, socialPosts, userProfile, apiConfig]);

  const handleSendMessage = async (charId: string, text: string, type: Message['type'] = 'text', amount?: number, locationName?: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'user',
      text,
      type,
      amount,
      locationName,
      timestamp: Date.now(),
    };

    setChats(prev => ({
      ...prev,
      [charId]: {
        characterId: charId,
        messages: [...(prev[charId]?.messages || []), newMessage],
        lastMessageAt: Date.now(),
      }
    }));

    if (type === 'transfer' && amount) {
      setBalance(b => b - amount);
    }

    if (type === 'text' || type === 'location' || type === 'sticker' || type === 'transfer') {
      const character = characters.find(c => c.id === charId)!;
      const history = chats[charId]?.messages || [];
      
      let promptText = text;
      if (type === 'location') promptText = `我向你发送了一个位置：${locationName}`;
      if (type === 'transfer') promptText = `我向你发起了转账：¥${amount}`;
      if (type === 'sticker') promptText = `我向你发送了一个表情包：${text}`;

      const responseText = await generateCharacterResponse(
        character, 
        history, 
        world.worldDescription, 
        promptText, 
        userProfile,
        apiConfig.chat
      );
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        senderId: charId,
        text: responseText,
        type: 'text',
        timestamp: Date.now() + 1,
      };

      setChats(prev => ({
        ...prev,
        [charId]: {
          ...prev[charId],
          messages: [...(prev[charId]?.messages || []), aiMessage],
          lastMessageAt: Date.now() + 1,
        }
      }));
    }
  };

  const updateWorld = async () => {
    const updates = await generateDailyNewsAndSocial(world.worldDescription, characters, apiConfig.world);
    if (updates) {
      const newNews = updates.news.map((n: any, i: number) => ({
        ...n,
        id: `news-${Date.now()}-${i}`,
        timestamp: Date.now()
      }));
      const newPosts = updates.socialPosts.map((p: any, i: number) => {
        const char = characters.find(c => c.name === p.authorName);
        return {
          id: `post-${Date.now()}-${i}`,
          authorId: char?.id || 'unknown',
          content: p.content,
          images: [],
          timestamp: Date.now(),
          likes: Math.floor(Math.random() * 100),
          comments: Math.floor(Math.random() * 20),
        };
      });

      setWorld(prev => ({ ...prev, news: [...newNews, ...prev.news] }));
      setSocialPosts(prev => [...newPosts, ...prev]);
    }
  };

  const renderApp = () => {
    switch (activeApp) {
      case 'wechat': return (
        <WeChatApp 
          chats={chats} 
          characters={characters} 
          user={userProfile}
          onUpdateUser={setUserProfile}
          onSendMessage={handleSendMessage} 
          onAddCharacter={prev => setCharacters(p => [...p, prev])}
          onAddPost={content => setSocialPosts(p => [{ id: `p-${Date.now()}`, authorId: 'user', content, images: [], timestamp: Date.now(), likes: 0, comments: 0 }, ...p])}
          onBack={() => setActiveApp('home')} 
          balance={balance} 
          posts={socialPosts} 
        />
      );
      case 'weibo': return <WeiboApp posts={socialPosts} characters={characters} onBack={() => setActiveApp('home')} />;
      case 'damai': return <DamaiApp tickets={world.tickets} balance={balance} onBuy={id => {
        const ticket = world.tickets.find(t => t.id === id);
        if (ticket && balance >= ticket.price) {
          setBalance(b => b - ticket.price);
          setWorld(prev => ({ ...prev, tickets: prev.tickets.map(t => t.id === id ? { ...t, isPurchased: true } : t) }));
        }
      }} onBack={() => setActiveApp('home')} />;
      case 'news': return <NewsApp news={world.news} onUpdate={updateWorld} onBack={() => setActiveApp('home')} />;
      case 'settings': return <SettingsApp 
        characters={characters} 
        setCharacters={setCharacters} 
        world={world} 
        setWorld={setWorld} 
        apiConfig={apiConfig}
        setApiConfig={setApiConfig}
        onBack={() => setActiveApp('home')} 
      />;
      default: return <HomeScreen onOpenApp={setActiveApp} worldDate={world.currentDate} />;
    }
  };

  return (
    <div className="iphone-frame">
      <div className="notch"><div className="speaker"></div></div>
      <div className="iphone-screen">
        <div className={`absolute top-0 w-full h-11 px-8 flex justify-between items-center z-[100] text-[13px] font-semibold ${activeApp === 'home' ? 'text-white' : 'text-black'} transition-colors duration-300`}>
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <div className="flex gap-1.5 items-center">
            <i className="fas fa-signal"></i>
            <span className="text-[10px]">5G</span>
            <i className="fas fa-wifi"></i>
            <i className="fas fa-battery-three-quarters text-[16px] ml-1"></i>
          </div>
        </div>
        
        <div className="h-full overflow-hidden">
          {renderApp()}
        </div>

        <div className="absolute bottom-1.5 w-full flex justify-center pb-1 z-[100] pointer-events-none">
          <div className={`w-32 h-1.5 ${activeApp === 'home' ? 'bg-white/40' : 'bg-gray-400/40'} rounded-full backdrop-blur-md`}></div>
        </div>
      </div>
    </div>
  );
};

export default App;

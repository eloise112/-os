
import React, { useState, useEffect } from 'react';
import { 
  AppId, 
  Character, 
  ChatSession, 
  Message, 
  WorldState, 
  SocialPost,
  UserProfile,
  ApiConfig,
  Comment
} from './types';
import { INITIAL_CHARACTERS, INITIAL_WORLD } from './constants';
import { generateCharacterResponse, generateDailyNewsAndSocial, generateInteractionForPost } from './services/gemini';

// Components
import HomeScreen from './components/HomeScreen';
import WeChatApp from './components/WeChatApp';
import WeiboApp from './components/WeiboApp';
import DamaiApp from './components/DamaiApp';
import NewsApp from './components/NewsApp';
import SettingsApp from './components/SettingsApp';

const INITIAL_MOMENTS: SocialPost[] = [
  {
    id: 'post1',
    authorId: 'char1',
    content: '晚宴后的露台，晚风有些冷。想起某人的茶，或许那才是解药。',
    images: ['https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=400'],
    timestamp: Date.now() - 3600000 * 2,
    likes: 12,
    comments: 3,
    commentsList: [
       { id: 'c1', authorId: 'char2', authorName: '林浅 (Lin Qian)', content: '大总裁也会emo吗？记得多加两块糖哦。', timestamp: Date.now() - 3000000 }
    ],
    platform: 'moments'
  }
];

const INITIAL_WEIBO: SocialPost[] = [
  {
    id: 'weibo1',
    authorId: 'char1',
    content: '今日沈氏集团年度晚宴圆满落幕，感谢各位业界同仁的莅临。未来，我们将继续深耕极光能源领域。',
    images: ['https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=400'],
    timestamp: Date.now() - 3600000 * 3,
    likes: 520,
    comments: 42,
    commentsList: [],
    platform: 'weibo'
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
  const [momentsPosts, setMomentsPosts] = useState<SocialPost[]>(() => {
    const saved = localStorage.getItem('gs_moments');
    return saved ? JSON.parse(saved) : INITIAL_MOMENTS;
  });
  const [weiboPosts, setWeiboPosts] = useState<SocialPost[]>(() => {
    const saved = localStorage.getItem('gs_weibo');
    return saved ? JSON.parse(saved) : INITIAL_WEIBO;
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
    localStorage.setItem('gs_moments', JSON.stringify(momentsPosts));
    localStorage.setItem('gs_weibo', JSON.stringify(weiboPosts));
    localStorage.setItem('gs_user', JSON.stringify(userProfile));
    localStorage.setItem('gs_api_config', JSON.stringify(apiConfig));
  }, [characters, world, chats, momentsPosts, weiboPosts, userProfile, apiConfig]);

  const triggerAIInteraction = async (targetPost: SocialPost) => {
    if (!world.enableMomentsInteraction) return;

    setTimeout(async () => {
      const interaction = await generateInteractionForPost(
        targetPost, 
        characters, 
        world.worldDescription, 
        userProfile, 
        world.maxMomentReplies,
        apiConfig.world
      );
      
      if (interaction && interaction.interactions) {
        const aiComments: Comment[] = interaction.interactions.map((it: any, idx: number) => {
          const char = characters.find(c => c.name === it.authorName);
          return {
            id: `c-ai-${Date.now()}-${idx}`,
            authorId: char?.id || 'unknown',
            authorName: it.authorName,
            content: it.content,
            timestamp: Date.now() + (idx * 500),
            replyToName: it.replyToName
          };
        });
        
        const setter = targetPost.platform === 'weibo' ? setWeiboPosts : setMomentsPosts;
        setter(prev => prev.map(p => {
          if (p.id === targetPost.id) {
            const combined = [...(p.commentsList || []), ...aiComments];
            return { ...p, comments: combined.length, commentsList: combined };
          }
          return p;
        }));
      }
    }, 1500);
  };

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

    if (['text', 'location', 'sticker', 'transfer'].includes(type)) {
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

  const handleAddPost = async (content: string, platform: 'moments' | 'weibo') => {
    const newPost: SocialPost = { 
      id: `p-${Date.now()}`, 
      authorId: 'user', 
      content, 
      images: [], 
      timestamp: Date.now(), 
      likes: 0, 
      comments: 0,
      commentsList: [],
      platform
    };
    
    if (platform === 'moments') setMomentsPosts(p => [newPost, ...p]);
    else setWeiboPosts(p => [newPost, ...p]);
    
    triggerAIInteraction(newPost);
  };

  const handleAddComment = async (postId: string, content: string, platform: 'moments' | 'weibo', replyToName?: string) => {
    const userComment: Comment = {
      id: `c-u-${Date.now()}`,
      authorId: 'user',
      authorName: userProfile.name,
      content,
      timestamp: Date.now(),
      replyToName
    };

    const setter = platform === 'weibo' ? setWeiboPosts : setMomentsPosts;
    const getter = platform === 'weibo' ? weiboPosts : momentsPosts;

    setter(prev => {
      const updated = prev.map(p => {
        if (p.id === postId) {
          const newList = [...(p.commentsList || []), userComment];
          return { ...p, comments: newList.length, commentsList: newList };
        }
        return p;
      });
      
      const targetPost = updated.find(p => p.id === postId);
      if (targetPost) triggerAIInteraction(targetPost);
      
      return updated;
    });
  };

  const updateWorld = async () => {
    const updates = await generateDailyNewsAndSocial(world.worldDescription, characters, apiConfig.world);
    if (updates) {
      const newNews = updates.news.map((n: any, i: number) => ({
        ...n,
        id: `news-${Date.now()}-${i}`,
        timestamp: Date.now()
      }));

      const newMoments = updates.momentsPosts.map((p: any, i: number) => {
        const char = characters.find(c => c.name === p.authorName);
        return {
          id: `moments-${Date.now()}-${i}`,
          authorId: char?.id || 'unknown',
          content: p.content,
          images: [],
          timestamp: Date.now(),
          likes: Math.floor(Math.random() * 20),
          comments: 0,
          commentsList: [],
          platform: 'moments'
        };
      });

      const newWeibo = updates.weiboPosts.map((p: any, i: number) => {
        const char = characters.find(c => c.name === p.authorName);
        return {
          id: `weibo-${Date.now()}-${i}`,
          authorId: char?.id || 'unknown',
          content: p.content,
          images: [],
          timestamp: Date.now(),
          likes: Math.floor(Math.random() * 1000),
          comments: 0,
          commentsList: [],
          platform: 'weibo'
        };
      });

      setWorld(prev => ({ ...prev, news: [...newNews, ...prev.news] }));
      setMomentsPosts(prev => [...newMoments, ...prev]);
      setWeiboPosts(prev => [...newWeibo, ...prev]);
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
          {activeApp === 'wechat' ? (
            <WeChatApp 
              chats={chats} 
              characters={characters} 
              user={userProfile}
              onUpdateUser={setUserProfile}
              onSendMessage={handleSendMessage} 
              onAddCharacter={prev => setCharacters(p => [...p, prev])}
              onAddPost={content => handleAddPost(content, 'moments')}
              onAddComment={(id, content, reply) => handleAddComment(id, content, 'moments', reply)}
              onBack={() => setActiveApp('home')} 
              balance={balance} 
              posts={momentsPosts} 
            />
          ) : activeApp === 'weibo' ? (
            <WeiboApp 
              posts={weiboPosts} 
              characters={characters} 
              onAddPost={content => handleAddPost(content, 'weibo')}
              onAddComment={(id, content, reply) => handleAddComment(id, content, 'weibo', reply)}
              onBack={() => setActiveApp('home')} 
            />
          ) : activeApp === 'damai' ? (
            <DamaiApp tickets={world.tickets} balance={balance} onBuy={id => {
              const ticket = world.tickets.find(t => t.id === id);
              if (ticket && balance >= ticket.price) {
                setBalance(b => b - ticket.price);
                setWorld(prev => ({ ...prev, tickets: prev.tickets.map(t => t.id === id ? { ...t, isPurchased: true } : t) }));
              }
            }} onBack={() => setActiveApp('home')} />
          ) : activeApp === 'news' ? (
            <NewsApp news={world.news} onUpdate={updateWorld} onBack={() => setActiveApp('home')} />
          ) : activeApp === 'settings' ? (
            <SettingsApp 
              characters={characters} 
              setCharacters={setCharacters} 
              world={world} 
              setWorld={setWorld} 
              apiConfig={apiConfig}
              setApiConfig={setApiConfig}
              onBack={() => setActiveApp('home')} 
            />
          ) : (
            <HomeScreen onOpenApp={setActiveApp} worldDate={world.currentDate} />
          )}
        </div>

        <div className="absolute bottom-1.5 w-full flex justify-center pb-1 z-[100] pointer-events-none">
          <div className={`w-32 h-1.5 ${activeApp === 'home' ? 'bg-white/40' : 'bg-gray-400/40'} rounded-full backdrop-blur-md`}></div>
        </div>
      </div>
    </div>
  );
};

export default App;

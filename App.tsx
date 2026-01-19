
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
import { 
  generateCharacterResponse, 
  generateWorldNewsItems, 
  generateWorldHotSearches, 
  generateWorldSocialPosts, 
  generateInteractionForPost 
} from './services/gemini';

// Components
import HomeScreen from './components/HomeScreen';
import WeChatApp from './components/WeChatApp';
import WeiboApp from './components/WeiboApp';
import DamaiApp from './components/DamaiApp';
import NewsApp from './components/NewsApp';
import SettingsApp from './components/SettingsApp';

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
    return saved ? JSON.parse(saved) : [];
  });
  const [weiboPosts, setWeiboPosts] = useState<SocialPost[]>(() => {
    const saved = localStorage.getItem('gs_weibo');
    return saved ? JSON.parse(saved) : [];
  });
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('gs_user');
    return saved ? JSON.parse(saved) : {
      name: '极客观察员',
      wechatId: 'Gemini_OS_User',
      avatar: 'https://picsum.photos/seed/user/100/100',
      persona: '你是一名热爱生活的现代都市青年，性格温和，对世界充满好奇。'
    };
  });
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => {
    const saved = localStorage.getItem('gs_api_config');
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed || {
      chat: { model: 'gemini-3-pro-preview', apiKey: '' },
      world: { model: 'gemini-3-flash-preview', apiKey: '' },
      providerKeys: { zhipu: '', deepseek: '' }
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
        apiConfig.world,
        apiConfig.providerKeys
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
    const newMessage: Message = { id: Date.now().toString(), senderId: 'user', text, type, amount, locationName, timestamp: Date.now() };

    setChats(prev => ({
      ...prev,
      [charId]: {
        characterId: charId,
        messages: [...(prev[charId]?.messages || []), newMessage],
        lastMessageAt: Date.now(),
        unreadCount: 0 // Reset when user sends message
      }
    }));

    if (type === 'transfer' && amount) setBalance(b => b - amount);

    const character = characters.find(c => c.id === charId)!;
    const history = chats[charId]?.messages || [];
    
    const responseText = await generateCharacterResponse(
      character, 
      history, 
      world.worldDescription, 
      text, 
      userProfile, 
      apiConfig.chat,
      apiConfig.providerKeys
    );
    
    const aiMessage: Message = { id: (Date.now() + 1).toString(), senderId: charId, text: responseText, type: 'text', timestamp: Date.now() + 1 };

    setChats(prev => ({
      ...prev,
      [charId]: {
        ...prev[charId],
        messages: [...(prev[charId]?.messages || []), aiMessage],
        lastMessageAt: Date.now() + 1,
        unreadCount: (activeApp === 'wechat' ? 0 : (prev[charId]?.unreadCount || 0) + 1)
      }
    }));
  };

  const handleAddPost = async (content: string, platform: 'moments' | 'weibo') => {
    const newPost: SocialPost = { 
      id: `p-${Date.now()}`, authorId: 'user', content, images: [], timestamp: Date.now(), 
      likes: 0, comments: 0, commentsList: [], platform
    };
    if (platform === 'moments') setMomentsPosts(p => [newPost, ...p]);
    else setWeiboPosts(p => [newPost, ...p]);
    triggerAIInteraction(newPost);
  };

  const handleAddComment = async (postId: string, content: string, platform: 'moments' | 'weibo', replyToName?: string) => {
    const userComment: Comment = { id: `c-u-${Date.now()}`, authorId: 'user', authorName: userProfile.name, content, timestamp: Date.now(), replyToName };
    const setter = platform === 'weibo' ? setWeiboPosts : setMomentsPosts;
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

  const updateNews = async () => {
    const news = await generateWorldNewsItems(world.worldDescription, apiConfig.world, apiConfig.providerKeys);
    setWorld(prev => ({ ...prev, news: [...news.map((n:any)=>({...n, id:`n-${Date.now()}-${Math.random()}`, timestamp:Date.now()})), ...prev.news] }));
  };

  const updateHotSearches = async () => {
    const hot = await generateWorldHotSearches(world.worldDescription, apiConfig.world, apiConfig.providerKeys);
    setWorld(prev => ({ ...prev, hotSearches: hot.map((h:any)=>({...h, id:`h-${Date.now()}-${Math.random()}`})) }));
  };

  const updateSocial = async (platform: 'weibo' | 'moments') => {
    const posts = await generateWorldSocialPosts(platform, world.worldDescription, characters, apiConfig.world, apiConfig.providerKeys);
    const formatted = posts.map((p:any) => ({
      ...p, id: `p-${Date.now()}-${Math.random()}`, 
      authorId: characters.find(c => c.name === p.authorName)?.id || 'unknown',
      images: [], timestamp: Date.now(), likes: Math.floor(Math.random()*100), comments: 0, commentsList: [], platform
    }));
    if (platform === 'weibo') setWeiboPosts(prev => [...formatted, ...prev]);
    else setMomentsPosts(prev => [...formatted, ...prev]);
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
              chats={chats} characters={characters} user={userProfile} onUpdateUser={setUserProfile}
              onSendMessage={handleSendMessage} onAddCharacter={prev => setCharacters(p => [...p, prev])}
              onAddPost={content => handleAddPost(content, 'moments')}
              onAddComment={(id, content, reply) => handleAddComment(id, content, 'moments', reply)}
              onBack={() => setActiveApp('home')} 
              onClearUnread={(id) => setChats(prev => prev[id] ? {...prev, [id]: {...prev[id], unreadCount: 0}} : prev)}
              balance={balance} posts={momentsPosts} 
            />
          ) : activeApp === 'weibo' ? (
            <WeiboApp 
              posts={weiboPosts} characters={characters} world={world}
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
            <NewsApp news={world.news} onUpdate={updateNews} onBack={() => setActiveApp('home')} />
          ) : activeApp === 'settings' ? (
            <SettingsApp 
              characters={characters} setCharacters={setCharacters} world={world} setWorld={setWorld} 
              apiConfig={apiConfig} setApiConfig={setApiConfig} onBack={() => setActiveApp('home')} 
              onRefreshNews={updateNews} onRefreshHot={updateHotSearches} onRefreshMoments={() => updateSocial('moments')} onRefreshWeibo={() => updateSocial('weibo')}
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

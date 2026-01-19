
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
  Comment,
  Ticket
} from './types';
import { INITIAL_CHARACTERS, INITIAL_WORLD } from './constants';
import { 
  generateCharacterResponse, 
  generateWorldNewsItems, 
  generateWorldHotSearches, 
  generateWorldSocialPosts, 
  generateInteractionForPost,
  generateWorldTickets,
  generateRecommendedSocialPosts
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
  const [loadingStep, setLoadingStep] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('gs_chars', JSON.stringify(characters));
    localStorage.setItem('gs_world', JSON.stringify(world));
    localStorage.setItem('gs_chats', JSON.stringify(chats));
    localStorage.setItem('gs_moments', JSON.stringify(momentsPosts));
    localStorage.setItem('gs_weibo', JSON.stringify(weiboPosts));
    localStorage.setItem('gs_user', JSON.stringify(userProfile));
    localStorage.setItem('gs_api_config', JSON.stringify(apiConfig));
  }, [characters, world, chats, momentsPosts, weiboPosts, userProfile, apiConfig]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
        const aiComments: Comment[] = interaction.interactions
          .filter((it: any) => characters.some(c => c.name === it.authorName))
          .map((it: any, idx: number) => {
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
    }, 2000);
  };

  const handleSendMessage = async (charId: string, text: string, type: Message['type'] = 'text', amount?: number, locationName?: string, autoReply: boolean = false) => {
    const newMessage: Message = { id: Date.now().toString(), senderId: 'user', text, type, amount, locationName, timestamp: Date.now() };

    setChats(prev => ({
      ...prev,
      [charId]: {
        characterId: charId,
        messages: [...(prev[charId]?.messages || []), newMessage],
        lastMessageAt: Date.now(),
        unreadCount: 0,
        isTyping: autoReply
      }
    }));

    if (type === 'transfer' && amount) setBalance(b => b - amount);
    if (autoReply) await handleTriggerAIResponse(charId);
  };

  const handleTriggerAIResponse = async (charId: string) => {
    const currentSession = chats[charId];
    if (!currentSession || currentSession.isTyping) return;

    setChats(prev => ({ ...prev, [charId]: { ...prev[charId], isTyping: true } }));
    const character = characters.find(c => c.id === charId)!;
    const history = (chats[charId]?.messages || []);
    const lastUserMessage = history.filter(m => m.senderId === 'user').slice(-1)[0]?.text || "...";
    
    const segments = await generateCharacterResponse(
      character, 
      history, 
      world.worldDescription, 
      lastUserMessage, 
      userProfile, 
      apiConfig.chat,
      apiConfig.providerKeys
    );

    const sendSegment = async (idx: number) => {
      if (idx >= segments.length) {
        setChats(prev => ({ ...prev, [charId]: { ...prev[charId], isTyping: false } }));
        return;
      }
      const segment = segments[idx];
      const typingDelay = Math.min(Math.max(segment.text.length * 100, 1000), 4000);
      setTimeout(() => {
        const aiMessage: Message = { 
          id: (Date.now() + idx).toString(), 
          senderId: charId, 
          text: segment.text, 
          type: segment.type === 'action' ? 'action' : 'text', 
          timestamp: Date.now() 
        };
        setChats(prev => ({
          ...prev,
          [charId]: {
            ...prev[charId],
            messages: [...(prev[charId]?.messages || []), aiMessage],
            lastMessageAt: Date.now(),
            unreadCount: (activeApp === 'wechat' ? 0 : (prev[charId]?.unreadCount || 0) + 1),
            isTyping: (idx < segments.length - 1)
          }
        }));
        sendSegment(idx + 1);
      }, typingDelay);
    };
    sendSegment(0);
  };

  const handleAddPost = async (content: string, platform: 'moments' | 'weibo') => {
    const newPost: SocialPost = { 
      id: `p-${Date.now()}`, authorId: 'user', content, images: [], timestamp: Date.now(), 
      likes: 0, likedByMe: false, comments: 0, commentsList: [], platform
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

  const handleToggleLike = (postId: string, platform: 'moments' | 'weibo') => {
    const setter = platform === 'weibo' ? setWeiboPosts : setMomentsPosts;
    setter(prev => prev.map(p => {
        if (p.id === postId) {
            const isLiked = !p.likedByMe;
            return { ...p, likedByMe: isLiked, likes: isLiked ? p.likes + 1 : Math.max(0, p.likes - 1) };
        }
        return p;
    }));
  };

  const updateNews = async () => {
    const newsStages = [
      { label: '正在生成：科技 / 财经 / 政治', filter: '科技, 财经, 政治' },
      { label: '正在生成：民生 / 社会 / 娱乐', filter: '民生, 社会, 娱乐' }
    ];

    for (let i = 0; i < newsStages.length; i++) {
      setLoadingStep(newsStages[i].label);
      const news = await generateWorldNewsItems(world.worldDescription, apiConfig.world, apiConfig.providerKeys, newsStages[i].filter);
      const formattedNews = news.map((n: any) => ({ ...n, id: `n-${Date.now()}-${Math.random()}`, timestamp: Date.now() }));
      setWorld(prev => ({ ...prev, news: [...formattedNews, ...prev.news] }));
      
      if (i < newsStages.length - 1) await delay(15000);
    }
    setLoadingStep('');
  };

  const updateHotSearches = async () => {
    setLoadingStep('正在刷新热搜榜单...');
    const hot = await generateWorldHotSearches(world.worldDescription, apiConfig.world, apiConfig.providerKeys);
    setWorld(prev => ({ ...prev, hotSearches: hot.map((h:any)=>({...h, id:`h-${Date.now()}-${Math.random()}`})) }));
    setLoadingStep('');
  };

  const updateTickets = async () => {
    const categories: ('concert' | 'movie' | 'theater' | 'sports' | 'exhibition')[] = ['concert', 'theater', 'movie', 'sports', 'exhibition'];
    const catNames: Record<string, string> = { concert: '演唱会', theater: '话剧', movie: '电影', sports: '体育', exhibition: '展览' };

    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      setLoadingStep(`正在生成：${catNames[cat]}票务...`);
      const tickets = await generateWorldTickets(world.worldDescription, apiConfig.world, apiConfig.providerKeys, cat);
      const newTickets: Ticket[] = tickets.map(t => ({
        ...t,
        id: `t-${Date.now()}-${Math.random()}`,
        isPurchased: false
      }));
      setWorld(prev => ({ ...prev, tickets: [...newTickets, ...prev.tickets] }));
      
      if (i < categories.length - 1) await delay(15000);
    }
    setLoadingStep('');
  };

  const updateSocial = async (platform: 'weibo' | 'moments') => {
    if (platform === 'moments') {
      setLoadingStep('正在生成朋友圈动态...');
      const generated = await generateWorldSocialPosts('moments', world.worldDescription, characters, apiConfig.world, apiConfig.providerKeys);
      const formatted = generated
        .filter((p: any) => characters.some(c => c.name === p.authorName))
        .map((p: any) => {
          const char = characters.find(c => c.name === p.authorName)!;
          return {
            ...p, id: `p-${Date.now()}-${Math.random()}`, 
            authorId: char.id, platform: 'moments' as const, images: [], timestamp: Date.now(), 
            likes: Math.floor(Math.random()*20), likedByMe: false, comments: 0, commentsList: [], isVirtual: false
          };
        });
      setMomentsPosts(prev => [...formatted, ...prev]);
      formatted.forEach(p => triggerAIInteraction(p));
      setLoadingStep('');
      return;
    }

    // Weibo Update Sequence
    // 1. Recommended Virtual Posts
    setLoadingStep('步骤 1/3：正在搜罗推荐微博...');
    const recommended = await generateRecommendedSocialPosts(world.worldDescription, apiConfig.world, apiConfig.providerKeys);
    const virtualFormatted = recommended.map((p: any) => ({
      ...p, id: `p-v-${Date.now()}-${Math.random()}`,
      authorId: 'virtual', images: [], timestamp: Date.now(), platform: 'weibo' as const,
      likes: Math.floor(Math.random()*500), likedByMe: false, comments: 0, commentsList: [], isVirtual: true
    }));
    setWeiboPosts(prev => [...virtualFormatted, ...prev]);
    virtualFormatted.forEach(p => triggerAIInteraction(p));

    await delay(15000);

    // 2. Character Posts
    setLoadingStep('步骤 2/3：正在更新关注角色动态...');
    const charGen = await generateWorldSocialPosts('weibo', world.worldDescription, characters, apiConfig.world, apiConfig.providerKeys);
    const charFormatted = charGen
      .filter((p: any) => characters.some(c => c.name === p.authorName))
      .map((p: any) => {
        const char = characters.find(c => c.name === p.authorName)!;
        return {
          ...p, id: `p-${Date.now()}-${Math.random()}`, 
          authorId: char.id, platform: 'weibo' as const, images: [], timestamp: Date.now(), 
          likes: Math.floor(Math.random()*100), likedByMe: false, comments: 0, commentsList: [], isVirtual: false
        };
      });
    setWeiboPosts(prev => [...charFormatted, ...prev]);
    charFormatted.forEach(p => triggerAIInteraction(p));

    await delay(15000);

    // 3. Hot Searches
    setLoadingStep('步骤 3/3：正在刷新实时热搜...');
    await updateHotSearches();

    setLoadingStep('');
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
              onSendMessage={handleSendMessage} onTriggerAI={handleTriggerAIResponse} onAddCharacter={prev => setCharacters(p => [...p, prev])}
              onAddPost={content => handleAddPost(content, 'moments')}
              onAddComment={(id, content, reply) => handleAddComment(id, content, 'moments', reply)}
              onToggleLike={(id) => handleToggleLike(id, 'moments')}
              onBack={() => setActiveApp('home')} 
              onClearUnread={(id) => setChats(prev => prev[id] ? {...prev, [id]: {...prev[id], unreadCount: 0}} : prev)}
              balance={balance} posts={momentsPosts} 
            />
          ) : activeApp === 'weibo' ? (
            <WeiboApp 
              posts={weiboPosts} characters={characters} world={world}
              onAddPost={content => handleAddPost(content, 'weibo')}
              onAddComment={(id, content, reply) => handleAddComment(id, content, 'weibo', reply)}
              onToggleLike={(id) => handleToggleLike(id, 'weibo')}
              onBack={() => setActiveApp('home')} 
            />
          ) : activeApp === 'damai' ? (
            <DamaiApp 
              tickets={world.tickets} balance={balance} 
              characters={characters}
              onBuy={id => {
                const ticket = world.tickets.find(t => t.id === id);
                if (ticket && balance >= ticket.price) {
                  setBalance(b => b - ticket.price);
                  setWorld(prev => ({ ...prev, tickets: prev.tickets.map(t => t.id === id ? { ...t, isPurchased: true } : t) }));
                }
              }} 
              onInvite={(id, t) => {
                 const inviteText = `我刚刚买了《${t.title}》的票，${t.date}在上海。要不要一起去？我看好位置都选好了！`;
                 handleSendMessage(id, inviteText, 'text', undefined, undefined, true);
              }}
              onBack={() => setActiveApp('home')} 
            />
          ) : activeApp === 'news' ? (
            <NewsApp news={world.news} onUpdate={updateNews} onBack={() => setActiveApp('home')} />
          ) : activeApp === 'settings' ? (
            <SettingsApp 
              characters={characters} setCharacters={setCharacters} world={world} setWorld={setWorld} 
              apiConfig={apiConfig} setApiConfig={setApiConfig} onBack={() => setActiveApp('home')} 
              onRefreshNews={updateNews} onRefreshHot={updateHotSearches} onRefreshMoments={() => updateSocial('moments')} onRefreshWeibo={() => updateSocial('weibo')}
              onRefreshTickets={updateTickets} loadingStep={loadingStep}
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

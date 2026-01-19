
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
  generateRecommendedSocialPosts,
  generateStorylineSummary
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
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

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
      try {
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
      } catch (e) {
        console.error("AI interaction error", e);
      }
    }, 2000);
  };

  // Add missing social interaction handlers
  const handleAddPost = (content: string, platform: 'moments' | 'weibo') => {
    const newPost: SocialPost = {
      id: `p-u-${Date.now()}`,
      authorId: 'user',
      authorName: userProfile.name,
      authorAvatar: userProfile.avatar,
      content,
      images: [],
      timestamp: Date.now(),
      likes: 0,
      likedByMe: false,
      comments: 0,
      commentsList: [],
      platform,
      isVirtual: false
    };

    if (platform === 'moments') {
      setMomentsPosts(prev => [newPost, ...prev]);
    } else {
      setWeiboPosts(prev => [newPost, ...prev]);
    }
    
    triggerAIInteraction(newPost);
  };

  const handleAddComment = (postId: string, content: string, platform: 'moments' | 'weibo', replyToName?: string) => {
    const newComment: Comment = {
      id: `c-u-${Date.now()}`,
      authorId: 'user',
      authorName: userProfile.name,
      content,
      timestamp: Date.now(),
      replyToName
    };

    const setter = platform === 'moments' ? setMomentsPosts : setWeiboPosts;
    setter(prev => prev.map(p => {
      if (p.id === postId) {
        const newList = [...(p.commentsList || []), newComment];
        return { ...p, comments: newList.length, commentsList: newList };
      }
      return p;
    }));
  };

  const handleToggleLike = (postId: string, platform: 'moments' | 'weibo') => {
    const setter = platform === 'moments' ? setMomentsPosts : setWeiboPosts;
    setter(prev => prev.map(p => {
      if (p.id === postId) {
        const liked = !p.likedByMe;
        return { 
          ...p, 
          likedByMe: liked, 
          likes: p.likes + (liked ? 1 : -1) 
        };
      }
      return p;
    }));
  };

  const handleSendMessage = async (charId: string, text: string, type: Message['type'] = 'text', amount?: number, locationName?: string, autoReply: boolean = false) => {
    const newMessage: Message = { id: Date.now().toString(), senderId: 'user', text, type, amount, locationName, timestamp: Date.now() };

    setChats(prev => {
      const session = prev[charId] || { characterId: charId, messages: [], lastMessageAt: 0 };
      return {
        ...prev,
        [charId]: {
          ...session,
          messages: [...session.messages, newMessage],
          lastMessageAt: Date.now(),
          unreadCount: 0,
          isTyping: autoReply
        }
      };
    });

    if (type === 'transfer' && amount) setBalance(b => b - amount);
    if (autoReply) await handleTriggerAIResponse(charId);
  };

  const updateStorylineIfNecessary = async (charId: string) => {
    const session = chats[charId];
    if (!session) return;
    
    const msgCount = session.messages.length;
    if (msgCount > 0 && msgCount % 20 === 0) {
      const character = characters.find(c => c.id === charId);
      if (!character) return;
      
      try {
        const newSummary = await generateStorylineSummary(
          character, 
          session.messages, 
          userProfile, 
          apiConfig.world, 
          apiConfig.providerKeys
        );
        
        if (newSummary && newSummary !== character.storyline) {
          setCharacters(prev => prev.map(c => c.id === charId ? { ...c, storyline: newSummary } : c));
        }
      } catch (e) {
        console.error("Storyline update failed", e);
      }
    }
  };

  const handleTriggerAIResponse = async (charId: string) => {
    const currentSession = chats[charId];
    if (!currentSession || currentSession.isTyping) return;

    setChats(prev => ({ ...prev, [charId]: { ...prev[charId], isTyping: true } }));
    const character = characters.find(c => c.id === charId)!;
    const history = (chats[charId]?.messages || []);
    const lastUserMessage = history.filter(m => m.senderId === 'user').slice(-1)[0]?.text || "...";
    
    try {
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
          await updateStorylineIfNecessary(charId);
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
          setChats(prev => {
            const session = prev[charId];
            return {
              ...prev,
              [charId]: {
                ...session,
                messages: [...session.messages, aiMessage],
                lastMessageAt: Date.now(),
                unreadCount: (activeApp === 'wechat' ? 0 : (session.unreadCount || 0) + 1),
                isTyping: (idx < segments.length - 1)
              }
            };
          });
          sendSegment(idx + 1);
        }, typingDelay);
      };
      sendSegment(0);
    } catch (e) {
      setChats(prev => ({ ...prev, [charId]: { ...prev[charId], isTyping: false } }));
      setErrorFeedback("对话生成失败，请检查 API 设置。");
    }
  };

  const updateNews = async (isSequential = false) => {
    try {
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
    } catch (e) {
      setErrorFeedback("新闻刷新出现问题，可能是网络波动。");
    } finally {
      if (!isSequential) setLoadingStep('');
    }
  };

  const updateHotSearches = async (isSequential = false) => {
    try {
      setLoadingStep('正在刷新热搜榜单...');
      const hot = await generateWorldHotSearches(world.worldDescription, apiConfig.world, apiConfig.providerKeys);
      setWorld(prev => ({ ...prev, hotSearches: hot.map((h:any)=>({...h, id:`h-${Date.now()}-${Math.random()}`})) }));
    } catch (e) {
      setErrorFeedback("热搜刷新失败。");
    } finally {
      if (!isSequential) setLoadingStep('');
    }
  };

  const updateTickets = async (isSequential = false) => {
    try {
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
    } catch (e) {
      setErrorFeedback("票务更新失败。");
    } finally {
      if (!isSequential) setLoadingStep('');
    }
  };

  const updateSocial = async (platform: 'weibo' | 'moments', isSequential = false) => {
    try {
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
        return;
      }

      // Weibo Sequence
      setLoadingStep('微博刷新 1/3：正在搜罗推荐微博...');
      const recommended = await generateRecommendedSocialPosts(world.worldDescription, apiConfig.world, apiConfig.providerKeys);
      const virtualFormatted = recommended.map((p: any) => ({
        ...p, id: `p-v-${Date.now()}-${Math.random()}`,
        authorId: 'virtual', images: [], timestamp: Date.now(), platform: 'weibo' as const,
        likes: Math.floor(Math.random()*500), likedByMe: false, comments: 0, commentsList: [], isVirtual: true
      }));
      setWeiboPosts(prev => [...virtualFormatted, ...prev]);
      virtualFormatted.forEach(p => triggerAIInteraction(p));

      await delay(15000);

      setLoadingStep('微博刷新 2/3：正在更新角色动态...');
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

      setLoadingStep('微博刷新 3/3：正在刷新热搜...');
      await updateHotSearches(true);
    } catch (e) {
      setErrorFeedback("微博社交系统同步失败。");
    } finally {
      if (!isSequential) setLoadingStep('');
    }
  };

  const handleUpdateAll = async () => {
    if (loadingStep) return;
    
    setLoadingStep('全量更新开始：初始化世界线...');
    try {
      await updateNews(true);
      await delay(15000);
      
      await updateTickets(true);
      await delay(15000);
      
      await updateSocial('weibo', true);
      await delay(15000);
      
      await updateSocial('moments', true);
      
      setLoadingStep('世界线已成功全面刷新！');
      setTimeout(() => setLoadingStep(''), 3000);
    } catch (e) {
      setErrorFeedback("全量更新中断，请检查 API 配额或网络。");
      setLoadingStep('');
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
            <NewsApp news={world.news} onUpdate={() => updateNews(false)} onBack={() => setActiveApp('home')} />
          ) : activeApp === 'settings' ? (
            <SettingsApp 
              characters={characters} setCharacters={setCharacters} world={world} setWorld={setWorld} 
              apiConfig={apiConfig} setApiConfig={setApiConfig} onBack={() => setActiveApp('home')} 
              onRefreshNews={() => updateNews(false)} onRefreshHot={() => updateHotSearches(false)} onRefreshMoments={() => updateSocial('moments', false)} onRefreshWeibo={() => updateSocial('weibo', false)}
              onRefreshTickets={() => updateTickets(false)} onRefreshAll={handleUpdateAll} loadingStep={loadingStep}
            />
          ) : (
            <HomeScreen onOpenApp={setActiveApp} worldDate={world.currentDate} />
          )}
        </div>

        {errorFeedback && (
          <div className="absolute inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-300">
             <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 animate-in zoom-in duration-200">
                <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-2xl mx-auto"><i className="fas fa-exclamation-triangle"></i></div>
                <div className="text-center">
                   <h3 className="font-bold text-lg text-gray-900">同步出错</h3>
                   <p className="text-sm text-gray-500 mt-2">{errorFeedback}</p>
                </div>
                <button onClick={() => setErrorFeedback(null)} className="w-full bg-red-500 text-white py-3 rounded-2xl font-bold shadow-lg shadow-red-200 active:scale-95 transition-all">知道了</button>
             </div>
          </div>
        )}

        <div className="absolute bottom-1.5 w-full flex justify-center pb-1 z-[100] pointer-events-none">
          <div className={`w-32 h-1.5 ${activeApp === 'home' ? 'bg-white/40' : 'bg-gray-400/40'} rounded-full backdrop-blur-md`}></div>
        </div>
      </div>
    </div>
  );
};

export default App;

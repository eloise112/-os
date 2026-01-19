
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Character, ChatSession, Message, SocialPost } from '../types';

interface WeChatAppProps {
  chats: Record<string, ChatSession>;
  characters: Character[];
  balance: number;
  posts: SocialPost[];
  onSendMessage: (charId: string, text: string, type?: Message['type'], amount?: number) => void;
  onAddCharacter: (char: Character) => void;
  onAddPost: (content: string) => void;
  onBack: () => void;
}

type WeChatView = 'chats' | 'contacts' | 'discover' | 'moments' | 'profile' | 'chatting' | 'char_detail' | 'create_char' | 'posting' | 'search';

const STICKERS = ['😊', '😂', '🥺', '😎', '🤔', '🔥', '❤️', '👍', '🐱', '🐶', '🍕', '🎉', '🌹', '💔', '😭', '😡'];

const WeChatApp: React.FC<WeChatAppProps> = ({ chats, characters, onSendMessage, onAddCharacter, onAddPost, onBack, balance, posts }) => {
  const [view, setView] = useState<WeChatView>('chats');
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [transferAmount, setTransferAmount] = useState('100');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    characters.forEach((c, i) => {
      if (i === 0) counts[c.id] = 1;
    });
    return counts;
  });

  const [newCharName, setNewCharName] = useState('');
  const [newCharBackground, setNewCharBackground] = useState('');
  const [newCharAvatar, setNewCharAvatar] = useState(`https://picsum.photos/seed/${Date.now()}/200/200`);
  const [newPostContent, setNewPostContent] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedChar = useMemo(() => 
    characters.find(c => c.id === selectedCharId), 
    [characters, selectedCharId]
  );

  const session = useMemo(() => 
    selectedCharId ? chats[selectedCharId] : undefined, 
    [chats, selectedCharId]
  );

  useEffect(() => {
    if (view === 'search') {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [view]);

  useEffect(() => {
    if (view === 'chatting' && selectedCharId) {
      setUnreadCounts(prev => ({ ...prev, [selectedCharId]: 0 }));
    }
  }, [view, selectedCharId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chats, selectedCharId, view]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { characters: [], messages: [] };
    const q = searchQuery.toLowerCase();
    const matchedChars = characters.filter(c => c.name.toLowerCase().includes(q));
    
    const matchedMessages: { char: Character; msg: Message }[] = [];
    Object.entries(chats).forEach(([charId, sessionEntry]) => {
      const char = characters.find(c => c.id === charId);
      if (!char) return;
      (sessionEntry as ChatSession).messages.forEach(msg => {
        if (msg.text && typeof msg.text === 'string' && msg.text.toLowerCase().includes(q)) {
          matchedMessages.push({ char, msg });
        }
      });
    });

    return {
      characters: matchedChars,
      messages: matchedMessages.sort((a, b) => b.msg.timestamp - a.msg.timestamp)
    };
  }, [searchQuery, characters, chats]);

  const handleSend = () => {
    if (!input.trim() || !selectedCharId) return;
    onSendMessage(selectedCharId, input, 'text');
    setInput('');
  };

  const toggleLike = (postId: string) => {
    const newLiked = new Set(likedPosts);
    if (newLiked.has(postId)) newLiked.delete(postId);
    else newLiked.add(postId);
    setLikedPosts(newLiked);
  };

  const handleCreateChar = () => {
    if (!newCharName.trim()) return alert("请输入角色姓名");
    onAddCharacter({
      id: `char-${Date.now()}`,
      name: newCharName,
      avatar: newCharAvatar,
      background: newCharBackground || '这个角色暂时没有背景介绍。',
      preferences: '暂无偏好设定',
      storyline: '一段全新的故事即将开始...'
    });
    setNewCharName('');
    setView('contacts');
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === highlight.toLowerCase() 
        ? <span key={i} className="text-[#07c160] font-bold">{part}</span> 
        : part
    );
  };

  const formatMomentTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${Math.floor(diff / 86400000)}天前`;
  };

  // --- Search Overlay ---
  if (view === 'search') {
    return (
      <div className="h-full flex flex-col bg-[#f2f2f2] animate-in fade-in duration-200">
        <div className="p-4 pt-11 bg-white flex items-center gap-3 shrink-0">
          <div className="flex-1 bg-[#f0f0f0] rounded-lg px-3 py-1.5 flex items-center gap-2">
            <i className="fas fa-search text-gray-400 text-sm"></i>
            <input 
              ref={searchInputRef}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索"
              className="bg-transparent border-none outline-none text-[15px] flex-1"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400">
                <i className="fas fa-times-circle"></i>
              </button>
            )}
          </div>
          <button onClick={() => { setView('chats'); setSearchQuery(''); }} className="text-[#576b95] text-[15px] font-medium">取消</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {!searchQuery.trim() ? (
            <div className="p-6">
              <div className="text-center text-gray-400 text-[13px] mb-8">搜索指定内容</div>
              <div className="grid grid-cols-3 gap-y-6 text-center text-[#576b95] text-[14px]">
                <button>朋友圈</button><button>文章</button><button>公众号</button>
                <button>小程序</button><button>音乐</button><button>表情</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.characters.length > 0 && (
                <div className="bg-white">
                  <div className="px-4 py-2 text-[12px] text-gray-400 border-b border-gray-50">联系人</div>
                  {searchResults.characters.map(char => (
                    <button key={char.id} onClick={() => { setSelectedCharId(char.id); setView('char_detail'); }} className="w-full flex items-center p-3 gap-3 active:bg-gray-100 border-b border-gray-50">
                      <img src={char.avatar} className="w-10 h-10 rounded-md" />
                      <span className="text-[15px] font-medium">{highlightText(char.name, searchQuery)}</span>
                    </button>
                  ))}
                </div>
              )}
              {searchResults.messages.length > 0 && (
                <div className="bg-white">
                  <div className="px-4 py-2 text-[12px] text-gray-400 border-b border-gray-50">聊天记录</div>
                  {searchResults.messages.map(({ char, msg }) => (
                    <button key={msg.id} onClick={() => { setSelectedCharId(char.id); setView('chatting'); }} className="w-full flex items-center p-3 gap-3 active:bg-gray-100 border-b border-gray-50">
                      <img src={char.avatar} className="w-10 h-10 rounded-md shrink-0" />
                      <div className="flex-1 text-left overflow-hidden">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[15px] font-medium">{char.name}</span>
                          <span className="text-[10px] text-gray-400">{new Date(msg.timestamp).toLocaleDateString()}</span>
                        </div>
                        <div className="text-[13px] text-gray-500 truncate">{highlightText(msg.text, searchQuery)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {searchResults.characters.length === 0 && searchResults.messages.length === 0 && (
                <div className="text-center py-20 text-gray-400 text-sm"><i className="fas fa-search text-5xl mb-4 block opacity-20"></i>暂无相关结果</div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Moments (朋友圈) ---
  if (view === 'moments') {
    return (
      <div className="h-full flex flex-col bg-white animate-in slide-in-from-right duration-300 relative">
        <div className="p-4 pt-11 absolute top-0 w-full z-50 flex justify-between items-center text-white">
          <button onClick={() => setView('discover')} className="flex items-center gap-1 active:opacity-50"><i className="fas fa-chevron-left text-lg"></i></button>
          <button onClick={() => setView('posting')} className="active:scale-90 transition-transform"><i className="fas fa-camera text-[20px]"></i></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="h-72 bg-gray-200 relative mb-14">
            <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800" className="w-full h-full object-cover" />
            <div className="absolute -bottom-10 right-4 flex items-end gap-4">
              <span className="text-white font-bold drop-shadow-md text-[18px] mb-6">测试用户</span>
              <img src="https://picsum.photos/seed/user/100/100" className="w-20 h-20 rounded-xl border-4 border-white shadow-lg bg-white" />
            </div>
          </div>
          <div className="space-y-0 pb-10">
            {posts.map(post => {
              const author = characters.find(c => c.id === post.authorId) || (post.authorId === 'user' ? { name: '测试用户', avatar: 'https://picsum.photos/seed/user/100/100', id: 'user' } : null);
              const isLiked = likedPosts.has(post.id);
              return (
                <div key={post.id} className="flex gap-3 px-4 py-6 border-b border-gray-100 last:border-none">
                  <img src={author?.avatar} className="w-12 h-12 rounded-lg shrink-0 cursor-pointer active:opacity-70" onClick={() => author?.id !== 'user' && (setSelectedCharId(author?.id || null), setView('char_detail'))} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[#576b95] font-bold text-[16px] mb-1.5" onClick={() => author?.id !== 'user' && (setSelectedCharId(author?.id || null), setView('char_detail'))}>{author?.name}</div>
                    <p className="text-[15.5px] text-gray-900 leading-[1.4] mb-3 whitespace-pre-wrap break-words">{post.content}</p>
                    {post.images && post.images.length > 0 && (
                      <div className={`grid gap-1 mb-3 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
                        {post.images.map((img, idx) => (
                          <img key={idx} src={img} className={`object-cover rounded-sm ${post.images.length === 1 ? 'max-w-[200px] max-h-[250px]' : 'w-full aspect-square'}`} />
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-gray-400 text-[13px]">{formatMomentTime(post.timestamp)}</span>
                      <button onClick={() => toggleLike(post.id)} className="bg-[#f7f7f7] px-2.5 py-1 rounded text-[#576b95] active:bg-gray-200"><i className={isLiked ? "fas fa-heart text-red-500" : "far fa-heart"}></i></button>
                    </div>
                    {(isLiked || post.comments > 0) && (
                      <div className="mt-2.5 bg-[#f7f7f7] rounded-sm p-2 text-[14px]">
                        {isLiked && <div className="flex items-center gap-2 pb-1 text-[#576b95] font-medium"><i className="far fa-heart text-[12px]"></i><span>我</span></div>}
                        {post.comments > 0 && <div className="border-t border-gray-200/50 mt-1 pt-1 flex gap-1"><span className="text-[#576b95] font-bold shrink-0">某人:</span><span className="text-gray-800">真精彩！</span></div>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- Nav Helpers ---
  const unreadTotal = Object.values(unreadCounts).reduce((a: number, b: number) => a + b, 0);

  // --- Views like Chatting, Contacts, Profile etc. ---
  if (view === 'chatting' && selectedChar) {
    return (
      <div className="h-full flex flex-col bg-[#ededed] animate-in fade-in slide-in-from-right duration-300">
        <div className="p-4 pt-11 bg-[#ededed] border-b border-gray-200 flex items-center shrink-0">
          <button onClick={() => setView('chats')} className="mr-4 flex items-center gap-1 text-gray-700 active:opacity-50"><i className="fas fa-chevron-left text-lg"></i><span className="text-sm font-medium">微信</span></button>
          <div className="flex-1 text-center font-bold text-[16px]">{selectedChar.name}</div>
          <button onClick={() => setView('char_detail')} className="w-8 text-right text-gray-700"><i className="fas fa-ellipsis-h"></i></button>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-5 scroll-smooth">
          {session?.messages.map(m => {
            const isUser = m.senderId === 'user';
            return (
              <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <img src={isUser ? 'https://picsum.photos/seed/user/100/100' : selectedChar.avatar} className="w-10 h-10 rounded-md shadow-sm shrink-0" />
                  <div className={`mx-2 p-2.5 rounded-lg text-[14px] shadow-sm leading-relaxed ${isUser ? 'bg-[#95ec69] text-black relative bubble-right' : 'bg-white text-black relative bubble-left border border-gray-200'}`}>
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="bg-[#f7f7f7] border-t border-gray-200 p-2 pb-6 shrink-0">
          <div className="flex items-center gap-2 px-1">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} className="flex-1 bg-white rounded-md p-2 outline-none text-sm border border-gray-200" placeholder="发送消息..." />
            <button onClick={handleSend} className="bg-[#07c160] text-white px-3 py-1.5 rounded text-sm font-medium">发送</button>
          </div>
        </div>
        <style>{`.bubble-left::before{content:'';position:absolute;left:-6px;top:12px;border-width:6px 6px 6px 0;border-color:transparent #fff transparent transparent;border-style:solid}.bubble-right::before{content:'';position:absolute;right:-6px;top:12px;border-width:6px 0 6px 6px;border-color:transparent transparent transparent #95ec69;border-style:solid}`}</style>
      </div>
    );
  }

  // --- Contacts ---
  if (view === 'contacts') {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="p-4 pt-11 flex justify-center items-center border-b border-gray-100 shrink-0 font-bold text-[17px]">通讯录</div>
        <div className="flex-1 overflow-y-auto">
          <div onClick={() => setView('search')} className="bg-gray-50 p-2 border-b border-gray-100 cursor-pointer"><div className="bg-white p-1.5 rounded-md flex items-center justify-center gap-2 text-gray-400 text-sm shadow-sm"><i className="fas fa-search text-xs"></i> 搜索</div></div>
          {characters.map(char => (
            <button key={char.id} onClick={() => { setSelectedCharId(char.id); setView('char_detail'); }} className="w-full flex items-center p-4 gap-4 active:bg-gray-100 border-b border-gray-50"><img src={char.avatar} className="w-10 h-10 rounded-lg shadow-sm" /><span className="font-semibold text-[16px] text-gray-900">{char.name}</span></button>
          ))}
        </div>
        <Nav active="contacts" setView={setView} unreadTotal={unreadTotal} />
      </div>
    );
  }

  // --- Discover ---
  if (view === 'discover') {
    return (
      <div className="h-full flex flex-col bg-[#f2f2f2]">
        <div className="p-4 pt-11 flex justify-center items-center bg-white border-b border-gray-100 shrink-0 font-bold text-[17px]">发现</div>
        <div className="flex-1 overflow-y-auto pt-2 space-y-2">
          <div className="bg-white divide-y divide-gray-50">
            <button onClick={() => setView('moments')} className="w-full flex items-center p-4 gap-4 active:bg-gray-100">
              <i className="fas fa-camera-retro text-xl text-[#f7b500] w-6 text-center"></i>
              <span className="flex-1 text-left text-gray-900 font-medium">朋友圈</span>
              <div className="flex items-center gap-2"><img src={characters[0]?.avatar} className="w-8 h-8 rounded-md" /><i className="fas fa-chevron-right text-gray-300 text-xs"></i></div>
            </button>
          </div>
        </div>
        <Nav active="discover" setView={setView} unreadTotal={unreadTotal} />
      </div>
    );
  }

  // --- Profile ---
  if (view === 'profile') {
    return (
      <div className="h-full flex flex-col bg-[#f2f2f2] animate-in slide-in-from-right duration-300">
        <div className="pt-11 bg-white p-6 flex gap-5 items-center mb-2">
          <img src="https://picsum.photos/seed/user/100/100" className="w-16 h-16 rounded-xl shadow-md border-2 border-gray-50" />
          <div className="flex-1"><h2 className="text-xl font-bold text-gray-900 leading-tight">测试用户</h2><p className="text-sm text-gray-400 mt-1">微信号: Gemini_User_01</p></div>
        </div>
        <div className="bg-white mb-2 divide-y divide-gray-50">
          <div className="p-4 flex items-center gap-4 active:bg-gray-100"><i className="fas fa-wallet text-xl text-blue-500 w-6 text-center"></i><span className="flex-1 text-gray-900">服务</span><span className="text-xs text-gray-400 font-bold">余额 ¥{balance.toFixed(2)}</span><i className="fas fa-chevron-right text-gray-300 text-xs ml-1"></i></div>
        </div>
        <Nav active="profile" setView={setView} unreadTotal={unreadTotal} />
      </div>
    );
  }

  // --- Main Chat List ---
  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <div className="p-4 pt-11 flex justify-between items-center border-b border-gray-100 shrink-0">
        <button onClick={onBack} className="text-[#07c160] font-medium flex items-center gap-1 active:opacity-50 text-[16px]"><i className="fas fa-chevron-left text-sm"></i> 返回</button>
        <span className="font-bold text-[17px]">微信</span>
        <div className="flex gap-5 text-gray-700"><button onClick={() => setView('search')} className="active:scale-95"><i className="fas fa-search text-[18px]"></i></button><button onClick={() => setView('create_char')} className="active:scale-95"><i className="fas fa-plus text-[20px]"></i></button></div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div onClick={() => setView('search')} className="bg-[#f0f0f0] mx-4 my-3 rounded-lg py-1.5 flex items-center justify-center gap-2 text-gray-400 text-[13px] cursor-pointer"><i className="fas fa-search text-[11px]"></i> 搜索</div>
        {characters.map(char => {
          const lastMsg = chats[char.id]?.messages.slice(-1)[0];
          const unread = unreadCounts[char.id] || 0;
          return (
            <button key={char.id} onClick={() => { setSelectedCharId(char.id); setView('chatting'); }} className="w-full flex items-center p-4 gap-4 active:bg-gray-100 transition-colors border-b border-gray-50">
              <div className="relative shrink-0">
                <img src={char.avatar} className="w-14 h-14 rounded-xl shadow-sm bg-gray-50" />
                {unread > 0 && <div className="absolute -top-1.5 -right-1.5 bg-[#fa5151] text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 border-2 border-white shadow-sm">{unread}</div>}
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <div className="flex justify-between items-center mb-0.5"><span className="font-semibold text-[16px] text-gray-900 truncate">{char.name}</span>{chats[char.id]?.lastMessageAt && <span className="text-[11px] text-gray-400 font-normal shrink-0">{new Date(chats[char.id].lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}</div>
                <div className="text-[14px] text-gray-400 truncate w-full">{lastMsg ? lastMsg.text : "点击开始聊天..."}</div>
              </div>
            </button>
          );
        })}
      </div>
      <Nav active="chats" setView={setView} unreadTotal={unreadTotal} />
    </div>
  );
};

const Nav: React.FC<{ active: string, setView: (v: WeChatView) => void, unreadTotal?: number }> = ({ active, setView, unreadTotal }) => (
  <div className="border-t border-gray-100 bg-[#f7f7f7] flex justify-around p-2 pt-1 pb-8 shrink-0">
    <button onClick={() => setView('chats')} className={`flex flex-col items-center gap-1 relative ${active === 'chats' ? 'text-[#07c160]' : 'text-gray-400'}`}>
      <div className="relative"><i className={`${active === 'chats' ? 'fas' : 'far'} fa-comment text-2xl`}></i>{active !== 'chats' && unreadTotal ? unreadTotal > 0 && <div className="absolute -top-1 -right-1.5 bg-[#fa5151] w-2.5 h-2.5 rounded-full border border-white"></div> : null}</div>
      <span className="text-[10px] font-bold">微信</span>
    </button>
    <button onClick={() => setView('contacts')} className={`flex flex-col items-center gap-1 ${active === 'contacts' ? 'text-[#07c160]' : 'text-gray-400'}`}><i className={`${active === 'contacts' ? 'fas' : 'far'} fa-address-book text-2xl`}></i><span className="text-[10px] font-bold">通讯录</span></button>
    <button onClick={() => setView('discover')} className={`flex flex-col items-center gap-1 ${active === 'discover' ? 'text-[#07c160]' : 'text-gray-400'}`}><i className={`${active === 'discover' ? 'fas' : 'far'} fa-compass text-2xl`}></i><span className="text-[10px] font-bold">发现</span></button>
    <button onClick={() => setView('profile')} className={`flex flex-col items-center gap-1 ${active === 'profile' ? 'text-[#07c160]' : 'text-gray-400'}`}><i className={`${active === 'profile' ? 'fas' : 'far'} fa-user text-2xl`}></i><span className="text-[10px] font-bold">我</span></button>
  </div>
);

export default WeChatApp;

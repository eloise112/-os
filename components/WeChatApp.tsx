
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Character, ChatSession, Message, SocialPost, UserProfile, Comment } from '../types';

interface WeChatAppProps {
  chats: Record<string, ChatSession>;
  characters: Character[];
  user: UserProfile;
  onUpdateUser: (u: UserProfile) => void;
  balance: number;
  posts: SocialPost[];
  onSendMessage: (charId: string, text: string, type?: Message['type'], amount?: number, locationName?: string) => void;
  onAddCharacter: (char: Character) => void;
  onAddPost: (content: string) => void;
  onAddComment: (postId: string, content: string, replyToName?: string) => void;
  onBack: () => void;
}

type WeChatView = 'chats' | 'contacts' | 'discover' | 'moments' | 'profile' | 'chatting' | 'char_detail' | 'create_char' | 'posting' | 'search' | 'edit_profile' | 'location_picker';

const STICKERS = ['😊', '😂', '🥺', '😎', '🤔', '🔥', '❤️', '👍', '🐱', '🐶', '🍕', '🎉', '🌹', '💔', '😭', '😡', '😱', '🤫', '🍺', '🌈'];

const SUGGESTED_LOCATIONS = [
  '极光大厦 - 顶层露台',
  '霓虹街 207 号',
  '赛博咖啡馆 - 5 号桌',
  '新纪元中心 - 空中花园',
  '老城旧事 - 巷口茶摊',
  '量子图书馆 - 禁书区',
  '幻影剧场 - VIP 包厢',
  '悬浮空间站 -观景台',
  '虹桥机场 - T2 航站楼',
  '外滩 - 十六铺码头',
  '静安寺 - 步行街'
];

const WeChatApp: React.FC<WeChatAppProps> = ({ chats, characters, user, onUpdateUser, onSendMessage, onAddCharacter, onAddPost, onAddComment, onBack, balance, posts }) => {
  const [view, setView] = useState<WeChatView>('chats');
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [transferAmount, setTransferAmount] = useState('100');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  
  // Moments states
  const [postInput, setPostInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [activeCommentPost, setActiveCommentPost] = useState<{ id: string, replyToName?: string } | null>(null);

  // New Character state
  const [newChar, setNewChar] = useState<Partial<Character>>({
    name: '',
    avatar: `https://picsum.photos/seed/${Date.now()}/200/200`,
    background: '',
    preferences: '',
    storyline: '',
    firstMessage: '你好，很高兴见到你。'
  });

  // Location Picker
  const [customLocation, setCustomLocation] = useState('');
  const [selectedLocationIdx, setSelectedLocationIdx] = useState<number | null>(null);

  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    characters.forEach((c, i) => {
      if (i === 0) counts[c.id] = 1;
    });
    return counts;
  });

  const [editingName, setEditingName] = useState(user.name);
  const [editingAvatar, setEditingAvatar] = useState(user.avatar);
  const [editingPersona, setEditingPersona] = useState(user.persona);

  const scrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

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
    if (view === 'edit_profile') {
      setEditingName(user.name);
      setEditingAvatar(user.avatar);
      setEditingPersona(user.persona);
    }
    if (view === 'location_picker') {
        setCustomLocation('');
        setSelectedLocationIdx(null);
    }
  }, [view, user]);

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

  useEffect(() => {
    if (activeCommentPost) {
      commentInputRef.current?.focus();
    }
  }, [activeCommentPost]);

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

  const handleSendComment = () => {
    if (!commentInput.trim() || !activeCommentPost) return;
    onAddComment(activeCommentPost.id, commentInput, activeCommentPost.replyToName);
    setCommentInput('');
    setActiveCommentPost(null);
  };

  const handleSendSticker = (sticker: string) => {
    if (!selectedCharId) return;
    onSendMessage(selectedCharId, sticker, 'sticker');
    setShowStickers(false);
  };

  const handleSendTransfer = () => {
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) return alert("请输入有效金额");
    if (amt > balance) return alert("余额不足");
    if (!selectedCharId) return;
    onSendMessage(selectedCharId, "转账", 'transfer', amt);
    setShowPlusMenu(false);
  };

  const confirmSendLocation = () => {
    const finalLocation = customLocation.trim() || (selectedLocationIdx !== null ? SUGGESTED_LOCATIONS[selectedLocationIdx] : null);
    if (!finalLocation || !selectedCharId) {
        alert("请选择或输入一个位置");
        return;
    }
    onSendMessage(selectedCharId, "[位置]", 'location', undefined, finalLocation);
    setView('chatting');
  };

  const toggleLike = (postId: string) => {
    const newLiked = new Set(likedPosts);
    if (newLiked.has(postId)) newLiked.delete(postId);
    else newLiked.add(postId);
    setLikedPosts(newLiked);
  };

  const handleCreatePost = () => {
    if (!postInput.trim()) return;
    onAddPost(postInput);
    setPostInput('');
    setView('moments');
  };

  const handleCreateChar = () => {
    if (!newChar.name?.trim()) return alert("请输入角色姓名");
    const char: Character = {
      id: `char-${Date.now()}`,
      name: newChar.name,
      avatar: newChar.avatar || `https://picsum.photos/seed/${Date.now()}/200/200`,
      background: newChar.background || '暂无背景',
      preferences: newChar.preferences || '暂无偏好',
      storyline: newChar.storyline || '故事开始了...',
      firstMessage: newChar.firstMessage || '你好。',
      perceiveWorldNews: true,
      perceiveSocialMedia: true,
      perceiveUserPersona: true
    };
    onAddCharacter(char);
    setNewChar({ name: '', avatar: `https://picsum.photos/seed/${Date.now()+1}/200/200`, background: '', preferences: '', storyline: '', firstMessage: '你好。' });
    setView('contacts');
  };

  const handleSaveProfile = () => {
    if (!editingName.trim()) return alert("姓名不能为空");
    onUpdateUser({
      ...user,
      name: editingName,
      avatar: editingAvatar,
      persona: editingPersona
    });
    setView('profile');
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

  // --- Create Character View ---
  if (view === 'create_char') {
    return (
      <div className="h-full flex flex-col bg-[#f2f2f7] animate-in slide-in-from-right duration-300">
        <div className="p-4 pt-11 bg-white border-b border-gray-200 flex items-center justify-between shrink-0">
          <button onClick={() => setView('chats')} className="text-gray-900 text-[16px]">取消</button>
          <span className="font-bold text-[17px]">新建角色</span>
          <button onClick={handleCreateChar} className="text-[#07c160] font-bold active:opacity-50">完成</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-white rounded-xl p-4 flex flex-col items-center gap-4 shadow-sm">
             <img src={newChar.avatar} className="w-20 h-20 rounded-2xl border-2 border-gray-50 shadow-sm" />
             <button onClick={() => setNewChar({...newChar, avatar: `https://picsum.photos/seed/${Date.now()}/200/200`})} className="text-[12px] text-blue-500 font-medium">更换随机头像</button>
          </div>
          <div className="bg-white rounded-xl overflow-hidden shadow-sm divide-y divide-gray-50">
            <div className="p-4 flex items-center gap-4">
               <span className="w-16 text-[14px] text-gray-500 font-medium">姓名</span>
               <input value={newChar.name} onChange={e => setNewChar({...newChar, name: e.target.value})} placeholder="角色姓名" className="flex-1 text-[14px] outline-none" />
            </div>
            <div className="p-4 flex flex-col gap-2">
               <span className="text-[14px] text-gray-500 font-medium">背景设定 (Tavern Background)</span>
               <textarea value={newChar.background} onChange={e => setNewChar({...newChar, background: e.target.value})} placeholder="描述角色的身份、性格、过往..." className="w-full min-h-[100px] text-[14px] outline-none resize-none bg-gray-50 p-2 rounded-lg" />
            </div>
            <div className="p-4 flex flex-col gap-2">
               <span className="text-[14px] text-gray-500 font-medium">第一句话</span>
               <textarea value={newChar.firstMessage} onChange={e => setNewChar({...newChar, firstMessage: e.target.value})} placeholder="初次见面时角色会说的话..." className="w-full text-[14px] outline-none resize-none bg-gray-50 p-2 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Character Detail View ---
  if (view === 'char_detail' && selectedChar) {
    return (
      <div className="h-full flex flex-col bg-[#f2f2f7] animate-in slide-in-from-right duration-300">
        <div className="p-4 pt-11 bg-white border-b border-gray-200 flex items-center gap-3 shrink-0">
          <button onClick={() => setView('chatting')} className="text-gray-900 active:opacity-50"><i className="fas fa-chevron-left"></i></button>
          <span className="font-bold text-[17px] flex-1">详细资料</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="bg-white px-4 py-6 flex flex-col items-center gap-4 mb-3">
             <img src={selectedChar.avatar} className="w-24 h-24 rounded-2xl shadow-md border-2 border-white object-cover" />
             <div className="text-center">
                <h2 className="text-xl font-bold">{selectedChar.name}</h2>
                <p className="text-[12px] text-gray-400 mt-1">微信号: Char_{selectedChar.id.slice(-4)}</p>
             </div>
          </div>
          <div className="bg-white divide-y divide-gray-50 mb-3">
             <div className="p-4 flex flex-col gap-2">
                <span className="text-[12px] text-gray-400 uppercase font-black tracking-widest">人设背景 (Background)</span>
                <p className="text-[14px] text-gray-800 leading-relaxed font-medium">{selectedChar.background}</p>
             </div>
             <div className="p-4 flex flex-col gap-2">
                <span className="text-[12px] text-gray-400 uppercase font-black tracking-widest">性格偏好 (Preferences)</span>
                <p className="text-[14px] text-gray-800 leading-relaxed font-medium">{selectedChar.preferences}</p>
             </div>
          </div>
          <div className="bg-white p-4 mb-10">
             <button className="w-full bg-[#fa5151] text-white py-3 rounded-xl font-bold active:scale-95 transition-transform">删除联系人</button>
          </div>
        </div>
      </div>
    );
  }

  // --- Posting View ---
  if (view === 'posting') {
    return (
      <div className="h-full flex flex-col bg-white animate-in slide-in-from-bottom duration-300">
        <div className="p-4 pt-11 flex justify-between items-center border-b border-gray-100">
          <button onClick={() => setView('moments')} className="text-gray-900 text-[16px]">取消</button>
          <button 
            onClick={handleCreatePost} 
            disabled={!postInput.trim()}
            className={`px-3 py-1.5 rounded-md text-[14px] font-bold ${postInput.trim() ? 'bg-[#07c160] text-white' : 'bg-gray-100 text-gray-400'}`}
          >发表</button>
        </div>
        <div className="p-4">
          <textarea 
            value={postInput}
            onChange={e => setPostInput(e.target.value)}
            placeholder="这一刻的想法..."
            className="w-full h-40 outline-none text-[16px] resize-none"
            autoFocus
          />
          <div className="flex flex-wrap gap-2 mt-4">
             <div className="w-20 h-20 bg-gray-100 flex items-center justify-center text-gray-400 rounded-sm">
               <i className="fas fa-plus text-2xl"></i>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Moments View ---
  if (view === 'moments') {
    return (
      <div className="h-full flex flex-col bg-white animate-in slide-in-from-right duration-300 overflow-hidden relative">
        <div className="absolute top-0 w-full p-4 pt-11 z-20 flex justify-between items-center text-white drop-shadow-md">
           <button onClick={() => setView('discover')} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/10 active:scale-90"><i className="fas fa-chevron-left text-lg"></i></button>
           <button onClick={() => setView('posting')} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/10 active:scale-90"><i className="fas fa-camera text-lg"></i></button>
        </div>
        <div className="flex-1 overflow-y-auto" onClick={() => activeCommentPost && setActiveCommentPost(null)}>
           {/* Header Cover */}
           <div className="relative mb-16 h-72">
              <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600" className="w-full h-full object-cover" />
              <div className="absolute -bottom-8 right-4 flex items-end gap-3">
                 <span className="text-white font-bold text-[18px] mb-4 drop-shadow-lg">{user.name}</span>
                 <img src={user.avatar} className="w-20 h-20 rounded-xl shadow-lg border-2 border-white object-cover" />
              </div>
           </div>

           {/* Feed */}
           <div className="px-4 pb-20 divide-y divide-gray-50">
             {posts.map(post => {
               const author = post.authorId === 'user' ? { name: user.name, avatar: user.avatar } : characters.find(c => c.id === post.authorId);
               const isLiked = likedPosts.has(post.id);
               return (
                 <div key={post.id} className="py-6 flex gap-3">
                    <img src={author?.avatar} className="w-11 h-11 rounded-md object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                       <h3 className="text-[#576b95] font-bold text-[15px] mb-1">{author?.name}</h3>
                       <p className="text-[15px] text-gray-900 leading-relaxed mb-3 break-words">{post.content}</p>
                       
                       {post.images && post.images.length > 0 && (
                         <div className={`grid gap-1 mb-3 ${post.images.length === 1 ? 'grid-cols-1' : post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                           {post.images.map((img, i) => (
                             <img key={i} src={img} className="w-full aspect-square object-cover rounded-sm" />
                           ))}
                         </div>
                       )}

                       <div className="flex justify-between items-center mt-2">
                          <span className="text-[12px] text-gray-400">{formatMomentTime(post.timestamp)}</span>
                          <div className="flex items-center gap-4">
                             <button 
                               onClick={() => toggleLike(post.id)} 
                               className={`flex items-center gap-1 text-[13px] ${isLiked ? 'text-red-500' : 'text-[#576b95]'} active:scale-125 transition-transform`}
                             >
                               <i className={isLiked ? 'fas fa-heart' : 'far fa-heart'}></i>
                               <span>{post.likes + (isLiked ? 1 : 0)}</span>
                             </button>
                             <button 
                               onClick={(e) => { e.stopPropagation(); setActiveCommentPost({ id: post.id }); }}
                               className="text-[#576b95] text-[13px] flex items-center gap-1 active:scale-110 transition-transform"
                             >
                               <i className="far fa-comment"></i>
                               <span>{post.commentsList?.length || 0}</span>
                             </button>
                          </div>
                       </div>

                       {/* Comments Section */}
                       {(isLiked || (post.commentsList && post.commentsList.length > 0)) && (
                         <div className="mt-3 bg-[#f7f7f7] rounded-sm p-2 space-y-1 relative">
                            {/* Arrow Up */}
                            <div className="absolute -top-1.5 left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-bottom-[6px] border-b-[#f7f7f7]"></div>
                            
                            {isLiked && (
                               <div className="flex items-center gap-1.5 pb-1 border-b border-gray-100 mb-1">
                                  <i className="far fa-heart text-[#576b95] text-[11px]"></i>
                                  <span className="text-[#576b95] text-[12px] font-bold">{user.name}</span>
                               </div>
                            )}

                            {post.commentsList?.map(comment => (
                              <div 
                                key={comment.id} 
                                className="text-[13px] leading-snug active:bg-gray-200 transition-colors py-0.5 rounded px-1"
                                onClick={(e) => { e.stopPropagation(); setActiveCommentPost({ id: post.id, replyToName: comment.authorName }); }}
                              >
                                <span className="text-[#576b95] font-bold">{comment.authorName}</span>
                                {comment.replyToName && (
                                  <>
                                    <span className="text-gray-900 mx-1">回复</span>
                                    <span className="text-[#576b95] font-bold">{comment.replyToName}</span>
                                  </>
                                )}
                                <span className="text-gray-900">: {comment.content}</span>
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
                 </div>
               );
             })}
           </div>
        </div>

        {/* Floating Comment Bar */}
        {activeCommentPost && (
          <div className="absolute bottom-0 left-0 w-full bg-[#f7f7f7] border-t border-gray-200 p-2 pb-8 flex items-center gap-2 animate-in slide-in-from-bottom duration-200 z-50">
            <input 
              ref={commentInputRef}
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSendComment()}
              placeholder={activeCommentPost.replyToName ? `回复 ${activeCommentPost.replyToName}:` : "评论..."}
              className="flex-1 bg-white rounded-md p-2 outline-none text-[14px] border border-gray-200"
            />
            <button 
              onClick={handleSendComment}
              disabled={!commentInput.trim()}
              className={`px-4 py-2 rounded text-[14px] font-bold ${commentInput.trim() ? 'bg-[#07c160] text-white' : 'bg-gray-100 text-gray-400'}`}
            >发送</button>
          </div>
        )}
      </div>
    );
  }

  // --- Location Picker View ---
  if (view === 'location_picker') {
      return (
          <div className="h-full flex flex-col bg-[#f2f2f2] animate-in slide-in-from-bottom duration-300">
              <div className="p-4 pt-11 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
                  <button onClick={() => setView('chatting')} className="text-gray-900 text-[16px]">取消</button>
                  <span className="font-bold text-[17px]">发送位置</span>
                  <button onClick={confirmSendLocation} className="bg-[#07c160] text-white px-3 py-1 rounded text-[14px] font-bold">发送</button>
              </div>
              <div className="bg-white p-3 border-b border-gray-100">
                  <div className="bg-[#f2f2f2] rounded-lg px-3 py-2 flex items-center gap-2">
                      <i className="fas fa-search text-gray-400 text-sm"></i>
                      <input 
                        value={customLocation}
                        onChange={e => {
                            setCustomLocation(e.target.value);
                            setSelectedLocationIdx(null);
                        }}
                        placeholder="搜索或输入自定义位置" 
                        className="bg-transparent border-none outline-none text-[15px] flex-1"
                      />
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                  <div className="h-48 bg-gray-200 relative mb-2">
                      <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/mapview/400/200')] bg-cover opacity-60"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                          <i className="fas fa-map-marker-alt text-red-500 text-3xl drop-shadow-lg"></i>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur px-2 py-1 rounded text-[9px] text-gray-500">
                          MapBox Simulator
                      </div>
                  </div>
                  <div className="bg-white divide-y divide-gray-50">
                      {SUGGESTED_LOCATIONS.map((loc, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => {
                                setSelectedLocationIdx(idx);
                                setCustomLocation('');
                            }}
                            className="w-full text-left p-4 flex items-center gap-4 active:bg-gray-100"
                          >
                              <i className={`fas fa-map-pin ${selectedLocationIdx === idx ? 'text-green-500' : 'text-gray-300'}`}></i>
                              <div className="flex-1">
                                  <div className={`text-[15px] font-medium ${selectedLocationIdx === idx ? 'text-green-600' : 'text-gray-900'}`}>{loc}</div>
                                  <div className="text-[12px] text-gray-400">上海市 · 浦东新区</div>
                              </div>
                              {selectedLocationIdx === idx && <i className="fas fa-check text-green-500 text-sm"></i>}
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      );
  }

  // --- Edit Profile ---
  if (view === 'edit_profile') {
    return (
      <div className="h-full flex flex-col bg-[#ededed] animate-in slide-in-from-right duration-300">
        <div className="p-4 pt-11 bg-[#ededed] border-b border-gray-200 flex items-center justify-between shrink-0">
          <button onClick={() => setView('profile')} className="text-gray-900 text-[16px]">取消</button>
          <span className="font-bold text-[17px]">个人资料</span>
          <button onClick={handleSaveProfile} className="bg-[#07c160] text-white px-3 py-1 rounded text-[14px] font-bold">完成</button>
        </div>
        <div className="flex-1 overflow-y-auto pt-2">
          <div className="bg-white divide-y divide-gray-100">
            <div className="p-4 flex items-center justify-between">
              <span className="text-[16px]">头像</span>
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setEditingAvatar(`https://picsum.photos/seed/${Date.now()}/100/100`)}>
                <img src={editingAvatar} className="w-14 h-14 rounded-md object-cover border border-gray-100" />
                <i className="fas fa-chevron-right text-gray-300 text-xs"></i>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-[16px] shrink-0 w-20">名字</span>
              <input value={editingName} onChange={e => setEditingName(e.target.value)} placeholder="设置你的昵称" className="flex-1 text-right outline-none text-gray-500 text-[16px]" />
              <i className="fas fa-chevron-right text-gray-300 text-xs ml-2"></i>
            </div>
            <div className="p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[16px]">个人设定 (AI感知)</span>
                <span className="text-[10px] text-gray-400">描述你在AI眼中的形象</span>
              </div>
              <textarea value={editingPersona} onChange={e => setEditingPersona(e.target.value)} placeholder="例如：我是一名性格冷静的侦探..." className="w-full text-sm font-medium border border-gray-100 p-3 rounded-xl bg-gray-50 min-h-[100px] outline-none" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Search Overlay ---
  if (view === 'search') {
    return (
      <div className="h-full flex flex-col bg-[#f2f2f2] animate-in fade-in duration-200">
        <div className="p-4 pt-11 bg-white flex items-center gap-3 shrink-0">
          <div className="flex-1 bg-[#f0f0f0] rounded-lg px-3 py-1.5 flex items-center gap-2">
            <i className="fas fa-search text-gray-400 text-sm"></i>
            <input ref={searchInputRef} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索" className="bg-transparent border-none outline-none text-[15px] flex-1" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="text-gray-400"><i className="fas fa-times-circle"></i></button>}
          </div>
          <button onClick={() => { setView('chats'); setSearchQuery(''); }} className="text-[#576b95] text-[15px] font-medium">取消</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {searchQuery.trim() ? (
            <div className="space-y-2">
              {searchResults.characters.length > 0 && (
                <div className="bg-white">
                  <div className="px-4 py-2 text-[12px] text-gray-400 border-b border-gray-50">联系人</div>
                  {searchResults.characters.map(char => (
                    <button key={char.id} onClick={() => { setSelectedCharId(char.id); setView('chatting'); }} className="w-full flex items-center p-3 gap-3 active:bg-gray-100 border-b border-gray-50">
                      <img src={char.avatar} className="w-10 h-10 rounded-md" />
                      <span className="text-[15px] font-medium">{highlightText(char.name, searchQuery)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
             <div className="p-6 text-center text-gray-400 text-[13px]">搜索指定内容</div>
          )}
        </div>
      </div>
    );
  }

  // --- Chatting View ---
  if (view === 'chatting' && selectedChar) {
    return (
      <div className="h-full flex flex-col bg-[#ededed] animate-in fade-in slide-in-from-right duration-300">
        <div className="p-4 pt-11 bg-[#ededed] border-b border-gray-200 flex items-center shrink-0">
          <button onClick={() => setView('chats')} className="mr-4 flex items-center gap-1 text-gray-700 active:opacity-50"><i className="fas fa-chevron-left text-lg"></i><span className="text-sm font-medium">微信</span></button>
          <div className="flex-1 text-center font-bold text-[16px] truncate px-4">{selectedChar.name}</div>
          <button onClick={() => setView('char_detail')} className="w-8 text-right text-gray-700"><i className="fas fa-ellipsis-h"></i></button>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-5 scroll-smooth">
          {session?.messages.map(m => {
            const isUser = m.senderId === 'user';
            return (
              <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <img src={isUser ? user.avatar : selectedChar.avatar} className="w-10 h-10 rounded-md shadow-sm shrink-0 object-cover" />
                  <div className={`mx-2 relative`}>
                    {m.type === 'transfer' ? (
                      <div className="bg-[#fa9d3b] text-white p-3 rounded-lg w-52 shadow-sm border border-orange-600">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl"><i className="fas fa-hand-holding-usd"></i></div>
                          <div>
                            <div className="font-bold text-lg">¥{m.amount?.toFixed(2)}</div>
                            <div className="text-[10px] opacity-90">转账给 {isUser ? selectedChar.name : user.name}</div>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/20 text-[10px]">微信支付</div>
                      </div>
                    ) : m.type === 'sticker' ? (
                      <div className="text-5xl py-1">{m.text}</div>
                    ) : m.type === 'location' ? (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-52">
                        <div className="h-20 bg-blue-50 flex items-center justify-center relative">
                           <i className="fas fa-map-marker-alt text-red-500 text-2xl drop-shadow-sm"></i>
                           <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/map/200/100')] opacity-30 bg-cover"></div>
                        </div>
                        <div className="p-2">
                           <div className="font-bold text-[14px] text-gray-800 truncate">{m.locationName}</div>
                           <div className="text-[10px] text-gray-400">虚拟定位服务</div>
                        </div>
                      </div>
                    ) : (
                      <div className={`p-2.5 rounded-lg text-[14px] shadow-sm leading-relaxed ${isUser ? 'bg-[#95ec69] text-black bubble-right' : 'bg-white text-black bubble-left border border-gray-200'}`}>
                        {m.text}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="bg-[#f7f7f7] border-t border-gray-200 p-2 pb-6 shrink-0">
          <div className="flex items-center gap-2 px-1">
             <button onClick={() => { setShowStickers(!showStickers); setShowPlusMenu(false); }} className="text-2xl text-gray-600 active:scale-90 transition-transform"><i className="far fa-laugh"></i></button>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} className="flex-1 bg-white rounded-md p-2 outline-none text-sm border border-gray-200" placeholder="发送消息..." />
            <button onClick={() => { setShowPlusMenu(!showPlusMenu); setShowStickers(false); }} className="text-2xl text-gray-600 active:scale-90 transition-transform"><i className="far fa-plus-square"></i></button>
            {input.trim() && <button onClick={handleSend} className="bg-[#07c160] text-white px-3 py-1.5 rounded text-sm font-medium">发送</button>}
          </div>

          {showPlusMenu && (
            <div className="grid grid-cols-4 gap-y-6 p-6 pt-8 border-t mt-3 animate-in slide-in-from-bottom-4 duration-200 bg-white">
              <button onClick={() => setView('posting')} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-600 text-xl border border-gray-100 shadow-sm"><i className="far fa-image"></i></div>
                <span className="text-[11px] text-gray-500">照片</span>
              </button>
              <button className="flex-1 flex flex-col items-center gap-2" onClick={() => { setView('location_picker'); setShowPlusMenu(false); }}>
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-green-500 text-xl border border-gray-100 shadow-sm"><i className="fas fa-map-marker-alt"></i></div>
                <span className="text-[11px] text-gray-500">位置</span>
              </button>
              <button onClick={handleSendTransfer} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-orange-500 text-xl border border-gray-100 shadow-sm"><i className="fas fa-exchange-alt"></i></div>
                <span className="text-[11px] text-gray-500">转账</span>
              </button>
              <div className="flex flex-col items-center justify-center col-span-1">
                <input type="number" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} className="w-16 bg-gray-100 border-none p-1 rounded text-center text-xs font-bold" />
                <span className="text-[9px] text-gray-400 mt-1">转账额</span>
              </div>
            </div>
          )}

          {showStickers && (
            <div className="grid grid-cols-5 gap-4 p-4 pt-6 border-t mt-3 animate-in slide-in-from-bottom-4 duration-200 h-44 overflow-y-auto bg-white">
              {STICKERS.map(s => <button key={s} onClick={() => handleSendSticker(s)} className="text-3xl hover:scale-125 transition-transform">{s}</button>)}
            </div>
          )}
        </div>
        <style>{`.bubble-left::before{content:'';position:absolute;left:-6px;top:12px;border-width:6px 6px 6px 0;border-color:transparent #fff transparent transparent;border-style:solid}.bubble-right::before{content:'';position:absolute;right:-6px;top:12px;border-width:6px 0 6px 6px;border-color:transparent transparent transparent #95ec69;border-style:solid}`}</style>
      </div>
    );
  }

  // --- Main Tabs ---
  if (view === 'profile') {
    return (
      <div className="h-full flex flex-col bg-[#ededed]">
        <div onClick={() => setView('edit_profile')} className="pt-16 pb-8 bg-white px-6 flex gap-5 items-center cursor-pointer active:bg-gray-50 shrink-0">
          <img src={user.avatar} className="w-16 h-16 rounded-xl shadow-sm border border-gray-100 object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 leading-tight truncate">{user.name}</h2>
            <p className="text-[14px] text-gray-400 truncate mt-1">微信号: {user.wechatId}</p>
          </div>
          <i className="fas fa-chevron-right text-gray-300 text-xs"></i>
        </div>
        <div className="flex-1 overflow-y-auto mt-2 space-y-2">
          <div className="bg-white p-4 flex items-center gap-4"><i className="fas fa-wallet text-xl text-[#07c160] w-6 text-center"></i><span className="flex-1">服务</span><span className="text-xs text-gray-400">¥{balance.toFixed(2)}</span><i className="fas fa-chevron-right text-gray-300 text-xs"></i></div>
          <div className="bg-white divide-y divide-gray-50">
            <div className="p-4 flex items-center gap-4"><i className="fas fa-cube text-xl text-red-500 w-6 text-center"></i><span className="flex-1">收藏</span><i className="fas fa-chevron-right text-gray-300 text-xs"></i></div>
            <div onClick={() => setView('moments')} className="p-4 flex items-center gap-4"><i className="fas fa-image text-xl text-blue-500 w-6 text-center"></i><span className="flex-1">朋友圈</span><i className="fas fa-chevron-right text-gray-300 text-xs"></i></div>
          </div>
        </div>
        <Nav active="profile" setView={setView} unreadTotal={Object.values(unreadCounts).reduce((a: number, b: number) => a + b, 0)} />
      </div>
    );
  }

  if (view === 'discover') {
    return (
      <div className="h-full flex flex-col bg-[#ededed]">
        <div className="p-4 pt-11 flex justify-center items-center bg-white border-b border-gray-100 shrink-0 font-bold text-[17px]">发现</div>
        <div className="flex-1 overflow-y-auto pt-2 space-y-2">
          <div className="bg-white p-4 flex items-center gap-4 active:bg-gray-50" onClick={() => setView('moments')}>
            <i className="fas fa-camera-retro text-xl text-[#f7b500] w-6 text-center"></i>
            <span className="flex-1 text-gray-900 font-medium">朋友圈</span>
            <div className="flex items-center gap-2">
               <div className="relative">
                 <img src={posts[0]?.authorId === 'user' ? user.avatar : characters.find(c => c.id === posts[0]?.authorId)?.avatar} className="w-8 h-8 rounded-md object-cover" />
                 <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
               </div>
               <i className="fas fa-chevron-right text-gray-300 text-xs"></i>
            </div>
          </div>
        </div>
        <Nav active="discover" setView={setView} unreadTotal={Object.values(unreadCounts).reduce((a: number, b: number) => a + b, 0)} />
      </div>
    );
  }

  if (view === 'contacts') {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="p-4 pt-11 flex justify-center items-center border-b border-gray-100 shrink-0 font-bold text-[17px]">通讯录</div>
        <div className="flex-1 overflow-y-auto">
          {characters.map(char => (
            <button key={char.id} onClick={() => { setSelectedCharId(char.id); setView('chatting'); }} className="w-full flex items-center p-4 gap-4 active:bg-gray-100 border-b border-gray-50"><img src={char.avatar} className="w-10 h-10 rounded-lg shadow-sm object-cover" /><span className="font-semibold text-[16px] text-gray-900">{char.name}</span></button>
          ))}
        </div>
        <Nav active="contacts" setView={setView} unreadTotal={Object.values(unreadCounts).reduce((a: number, b: number) => a + b, 0)} />
      </div>
    );
  }

  // Default: Chats
  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <div className="p-4 pt-11 flex justify-between items-center border-b border-gray-100 shrink-0">
        <button onClick={onBack} className="text-[#07c160] font-medium flex items-center gap-1 active:opacity-50 text-[16px]"><i className="fas fa-chevron-left text-sm"></i> 返回</button>
        <span className="font-bold text-[17px]">微信</span>
        <div className="flex gap-5 text-gray-700">
          <button onClick={() => setView('search')} className="active:scale-95"><i className="fas fa-search text-[18px]"></i></button>
          <button onClick={() => setView('create_char')} className="active:scale-95"><i className="fas fa-plus text-[20px]"></i></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div onClick={() => setView('search')} className="bg-[#f0f0f0] mx-4 my-3 rounded-lg py-1.5 flex items-center justify-center gap-2 text-gray-400 text-[13px] cursor-pointer"><i className="fas fa-search text-[11px]"></i> 搜索</div>
        {characters.map(char => {
          const lastMsg = chats[char.id]?.messages.slice(-1)[0];
          const unread = unreadCounts[char.id] || 0;
          return (
            <button key={char.id} onClick={() => { setSelectedCharId(char.id); setView('chatting'); }} className="w-full flex items-center p-4 gap-4 active:bg-gray-100 border-b border-gray-50">
              <div className="relative shrink-0">
                <img src={char.avatar} className="w-14 h-14 rounded-xl shadow-sm bg-gray-50 object-cover" />
                {unread > 0 && <div className="absolute -top-1.5 -right-1.5 bg-[#fa5151] text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 border-2 border-white shadow-sm">{unread}</div>}
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-semibold text-[16px] text-gray-900 truncate">{char.name}</span>
                  {chats[char.id]?.lastMessageAt && <span className="text-[11px] text-gray-400 font-normal shrink-0">{new Date(chats[char.id].lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                </div>
                <div className="text-[14px] text-gray-400 truncate w-full">{lastMsg ? lastMsg.text : "点击开始聊天..."}</div>
              </div>
            </button>
          );
        })}
      </div>
      <Nav active="chats" setView={setView} unreadTotal={Object.values(unreadCounts).reduce((a: number, b: number) => a + b, 0)} />
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

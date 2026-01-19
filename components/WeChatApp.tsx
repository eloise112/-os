
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
  onTriggerAI: (charId: string) => void;
  onAddCharacter: (char: Character) => void;
  onAddPost: (content: string) => void;
  onAddComment: (postId: string, content: string, replyToName?: string) => void;
  onBack: () => void;
  onClearUnread: (charId: string) => void;
}

type WeChatView = 'chats' | 'contacts' | 'discover' | 'moments' | 'profile' | 'chatting' | 'char_detail' | 'create_char' | 'posting' | 'search' | 'edit_profile';

const EMOJIS = ['😊', '😂', '🥰', '😍', '😒', '😭', '😎', '🤔', '🙄', '😴', '😋', '🥳', '😇', '🤔', '🤐', '🤨', '😏', '😶', '😑', '😬', '😮', '😱', '🥱', '😴', '🤤', '😪', '🌞', '🌙', '⭐', '🔥', '✨', '🎈'];

const PRESET_LOCATIONS = ['虹桥天地', '静安寺', '外滩18号', '梅赛德斯-奔驰文化中心', '徐家汇中心', '新天地', '武康路', '东方明珠'];

const WeChatApp: React.FC<WeChatAppProps> = ({ chats, characters, user, onUpdateUser, onSendMessage, onTriggerAI, onAddCharacter, onAddPost, onAddComment, onBack, onClearUnread, balance, posts }) => {
  const [view, setView] = useState<WeChatView>('chats');
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isActionMode, setIsActionMode] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [activeCommentPost, setActiveCommentPost] = useState<{ id: string, replyToName?: string } | null>(null);
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [toolTab, setToolTab] = useState<'tools' | 'emoji'>('tools');
  const [transferAmount, setTransferAmount] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [customLocation, setCustomLocation] = useState('');

  const [newChar, setNewChar] = useState<Partial<Character>>({
    name: '', avatar: `https://picsum.photos/seed/${Date.now()}/200/200`, background: '', preferences: '', storyline: '', firstMessage: '你好。'
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const selectedChar = useMemo(() => characters.find(c => c.id === selectedCharId), [characters, selectedCharId]);
  const session = useMemo(() => selectedCharId ? chats[selectedCharId] : undefined, [chats, selectedCharId]);

  useEffect(() => {
    if (view === 'search') setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [view]);

  useEffect(() => {
    if (view === 'chatting' && selectedCharId) {
      onClearUnread(selectedCharId);
    }
  }, [view, selectedCharId, onClearUnread]);

  const messageCount = session?.messages.length || 0;
  const isTyping = session?.isTyping || false;

  useEffect(() => {
    if (view === 'chatting' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [view, messageCount, isTyping, selectedCharId]);

  useEffect(() => {
    if (activeCommentPost) commentInputRef.current?.focus();
  }, [activeCommentPost]);

  const handleSend = () => {
    if (!input.trim() || !selectedCharId) return;
    onSendMessage(selectedCharId, input, isActionMode ? 'action' : 'text');
    setInput('');
    setShowMoreTools(false);
  };

  const handleManualReply = () => {
    if (!selectedCharId) return;
    onTriggerAI(selectedCharId);
  };

  const handleSendEmoji = (emoji: string) => {
    if (!selectedCharId) return;
    onSendMessage(selectedCharId, emoji, 'text');
    setShowMoreTools(false);
  };

  const handleSendLocation = (locName: string) => {
    if (!selectedCharId || !locName.trim()) return;
    onSendMessage(selectedCharId, `📍 [我的位置] ${locName}`, 'location', undefined, locName);
    setShowLocationPicker(false);
    setShowMoreTools(false);
    setCustomLocation('');
  };

  const handleSendTransfer = () => {
    const amt = parseFloat(transferAmount);
    if (!selectedCharId || isNaN(amt) || amt <= 0 || amt > balance) return;
    onSendMessage(selectedCharId, `[转账] ¥${amt.toFixed(2)}`, 'transfer', amt);
    setTransferAmount('');
    setShowTransferModal(false);
    setShowMoreTools(false);
  };

  const handleSendComment = () => {
    if (!commentInput.trim() || !activeCommentPost) return;
    onAddComment(activeCommentPost.id, commentInput, activeCommentPost.replyToName);
    setCommentInput(''); setActiveCommentPost(null);
  };

  const handleCreateChar = () => {
    if (!newChar.name?.trim()) return;
    onAddCharacter({ ...newChar as Character, id: `char-${Date.now()}` });
    setView('contacts');
  };

  // Main UI
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
               <span className="text-[14px] text-gray-500 font-medium">背景设定</span>
               <textarea value={newChar.background} onChange={e => setNewChar({...newChar, background: e.target.value})} placeholder="角色身份性格..." className="w-full min-h-[100px] text-[14px] outline-none bg-gray-50 p-2 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'moments') {
    return (
      <div className="h-full flex flex-col bg-white animate-in slide-in-from-right duration-300 overflow-hidden relative">
        <div className="absolute top-0 w-full p-4 pt-11 z-20 flex justify-between items-center text-white drop-shadow-md">
           <button onClick={() => setView('discover')} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/10 active:scale-90"><i className="fas fa-chevron-left"></i></button>
           <button onClick={() => setView('posting')} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/10 active:scale-90"><i className="fas fa-camera"></i></button>
        </div>
        <div className="flex-1 overflow-y-auto" onClick={() => setActiveCommentPost(null)}>
           <div className="relative mb-16 h-72">
              <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600" className="w-full h-full object-cover" />
              <div className="absolute -bottom-8 right-4 flex items-end gap-3">
                 <span className="text-white font-bold text-[18px] mb-4 drop-shadow-lg">{user.name}</span>
                 <img src={user.avatar} className="w-20 h-20 rounded-xl shadow-lg border-2 border-white object-cover" />
              </div>
           </div>
           <div className="px-4 pb-20 divide-y divide-gray-50">
             {posts.filter(p => p.platform === 'moments').map(post => {
               const author = post.authorId === 'user' ? { name: user.name, avatar: user.avatar } : characters.find(c => c.id === post.authorId);
               return (
                 <div key={post.id} className="py-6 flex gap-3">
                    <img src={author?.avatar} className="w-11 h-11 rounded-md object-cover flex-shrink-0" />
                    <div className="flex-1">
                       <h3 className="text-[#576b95] font-bold text-[15px] mb-1">{author?.name}</h3>
                       <p className="text-[15px] text-gray-900 mb-3">{post.content}</p>
                       <div className="flex justify-between items-center text-[12px] text-gray-400">
                          <span>刚刚</span>
                          <button onClick={(e) => { e.stopPropagation(); setActiveCommentPost({ id: post.id }); }} className="text-[#576b95]"><i className="far fa-comment"></i></button>
                       </div>
                       {(post.commentsList && post.commentsList.length > 0) && (
                         <div className="mt-3 bg-[#f7f7f7] rounded-sm p-2 space-y-1">
                            {post.commentsList.map(c => (
                              <div key={c.id} className="text-[13px]" onClick={(e) => { e.stopPropagation(); setActiveCommentPost({ id: post.id, replyToName: c.authorName }); }}>
                                <span className="text-[#576b95] font-bold">{c.authorName}</span>: {c.content}
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
        {activeCommentPost && (
          <div className="absolute bottom-0 left-0 w-full bg-[#f7f7f7] border-t p-2 pb-8 flex items-center gap-2 z-50">
            <input ref={commentInputRef} value={commentInput} onChange={e => setCommentInput(e.target.value)} className="flex-1 bg-white rounded-md p-2 outline-none text-[14px]" />
            <button onClick={handleSendComment} className="bg-[#07c160] text-white px-4 py-2 rounded font-bold">发送</button>
          </div>
        )}
      </div>
    );
  }

  if (view === 'chatting' && selectedChar) {
    const isUserTyping = input.trim().length > 0;
    
    return (
      <div className="h-full flex flex-col bg-[#ededed] animate-in slide-in-from-right duration-300 relative">
        <div className="p-4 pt-11 bg-[#ededed] border-b border-gray-200 flex items-center shrink-0 z-10">
          <button onClick={() => setView('chats')} className="mr-4 text-gray-700"><i className="fas fa-chevron-left text-lg"></i></button>
          <div className="flex-1 text-center font-bold">
            {selectedChar.name}
            {session?.isTyping && <div className="text-[10px] text-gray-400 font-normal mt-[-2px] animate-pulse">对方正在输入...</div>}
          </div>
          <button className="w-8 text-right text-gray-700"><i className="fas fa-ellipsis-h"></i></button>
        </div>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-5 scroll-smooth relative">
          {session?.messages.map(m => {
            const isUser = m.senderId === 'user';
            const isAction = m.type === 'action';
            const isTransfer = m.type === 'transfer';
            const isLocation = m.type === 'location';
            
            return (
              <div key={m.id} className={`flex ${isAction ? 'justify-center' : isUser ? 'justify-end' : 'justify-start'} w-full`}>
                <div className={`flex ${isAction ? 'w-full px-1' : 'max-w-[90%]'} ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start`}>
                  {!isAction && <img src={isUser ? user.avatar : selectedChar.avatar} className="w-10 h-10 rounded-md shadow-sm shrink-0 object-cover" />}
                  <div className={`flex flex-col items-start ${isAction ? 'w-full' : ''}`}>
                    {isAction ? (
                      <div className="my-1 w-full bg-gray-200/50 text-gray-500 text-[8px] px-4 py-3 rounded-2xl font-mono border border-gray-300/30 shadow-sm relative italic leading-relaxed text-center">
                        <span className="opacity-30 text-[7px] absolute -top-1.5 left-4 bg-gray-400 text-white rounded px-1 scale-75 uppercase font-bold tracking-tighter">behavior</span>
                        {m.text}
                      </div>
                    ) : isTransfer ? (
                      <div className={`mx-2 p-3 rounded-xl shadow-sm bg-orange-500 text-white w-48 flex items-center gap-3 border-2 border-white/20`}>
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
                           <i className="fas fa-hand-holding-usd"></i>
                        </div>
                        <div className="flex-1">
                           <div className="text-[15px] font-bold">¥ {m.amount?.toFixed(2)}</div>
                           <div className="text-[10px] opacity-80">点击领取转账</div>
                        </div>
                      </div>
                    ) : isLocation ? (
                      <div className={`mx-2 p-0 rounded-xl shadow-sm bg-white overflow-hidden w-56 border border-gray-100`}>
                         <div className="h-24 bg-blue-50 flex items-center justify-center text-blue-300">
                            <i className="fas fa-map-marked-alt text-4xl"></i>
                         </div>
                         <div className="p-2">
                            <div className="text-[13px] font-bold text-gray-800 truncate">{m.locationName}</div>
                            <div className="text-[10px] text-gray-400">上海市 · 实时定位</div>
                         </div>
                      </div>
                    ) : (
                      <div className={`mx-2 p-2.5 rounded-lg text-[14px] shadow-sm ${isUser ? 'bg-[#95ec69]' : 'bg-white'}`}>
                        {m.text}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div className="h-10 w-full"></div>
        </div>

        {/* Manual Reply Floating Button */}
        {!session?.isTyping && (
          <button 
            onClick={handleManualReply}
            className="absolute bottom-24 right-4 bg-white/90 backdrop-blur-md text-[#07c160] px-4 py-2 rounded-full shadow-lg border border-gray-200 font-bold text-[13px] z-20 active:scale-95 transition-all flex items-center gap-2"
          >
             <i className="fas fa-magic"></i> 回复
          </button>
        )}

        <div className="bg-[#f7f7f7] border-t p-2 flex flex-col items-center gap-2 shrink-0 z-30">
          <div className="w-full flex items-center gap-2 px-1">
            <button 
              onClick={() => setIsActionMode(!isActionMode)}
              className={`w-10 h-8 flex items-center justify-center rounded-md transition-colors ${isActionMode ? 'bg-[#07c160] text-white shadow-inner' : 'text-gray-400 bg-white border border-gray-200'}`}
            >
              <i className="fas fa-running text-lg"></i>
            </button>
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyPress={e => e.key === 'Enter' && handleSend()} 
              onFocus={() => {
                setShowMoreTools(false);
                setTimeout(() => { if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 300);
              }}
              className={`flex-1 bg-white rounded-md p-2 outline-none text-sm border transition-colors ${isActionMode ? 'border-[#07c160] bg-green-50/20' : 'border-gray-300'}`} 
              placeholder={isActionMode ? "写下你的动作描写..." : "发送消息..."} 
            />
            <button onClick={() => { setShowMoreTools(!showMoreTools); setToolTab('emoji'); }} className="text-gray-600 text-2xl"><i className="far fa-smile"></i></button>
            {isUserTyping ? (
              <button onClick={handleSend} className="bg-[#07c160] text-white px-4 py-1.5 rounded-md font-bold text-[14px]">发送</button>
            ) : (
              <button onClick={() => { setShowMoreTools(!showMoreTools); setToolTab('tools'); }} className="text-gray-600 text-2xl"><i className="far fa-plus-square"></i></button>
            )}
          </div>
          
          {showMoreTools && (
            <div className="w-full h-48 bg-[#f7f7f7] animate-in slide-in-from-bottom duration-200 overflow-y-auto p-4 border-t border-gray-200 pb-10">
               {toolTab === 'emoji' ? (
                 <div className="grid grid-cols-8 gap-3">
                   {EMOJIS.map(e => (
                     <button key={e} onClick={() => handleSendEmoji(e)} className="text-2xl hover:scale-125 transition-transform">{e}</button>
                   ))}
                 </div>
               ) : (
                 <div className="grid grid-cols-4 gap-4">
                    <button onClick={() => setShowLocationPicker(true)} className="flex flex-col items-center gap-2">
                       <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl text-gray-600 shadow-sm border border-gray-100">
                          <i className="fas fa-map-marker-alt text-red-500"></i>
                       </div>
                       <span className="text-[10px] text-gray-500 font-medium">位置</span>
                    </button>
                    <button onClick={() => setShowTransferModal(true)} className="flex flex-col items-center gap-2">
                       <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl text-gray-600 shadow-sm border border-gray-100">
                          <i className="fas fa-hand-holding-usd text-orange-500"></i>
                       </div>
                       <span className="text-[10px] text-gray-500 font-medium">转账</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 opacity-40 grayscale">
                       <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl text-gray-600 shadow-sm border border-gray-100">
                          <i className="fas fa-image text-green-500"></i>
                       </div>
                       <span className="text-[10px] text-gray-500 font-medium">相册</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 opacity-40 grayscale">
                       <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl text-gray-600 shadow-sm border border-gray-100">
                          <i className="fas fa-camera text-blue-500"></i>
                       </div>
                       <span className="text-[10px] text-gray-500 font-medium">拍摄</span>
                    </button>
                 </div>
               )}
            </div>
          )}
        </div>

        {/* Location Picker Modal */}
        {showLocationPicker && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[210] flex items-end">
             <div className="bg-white rounded-t-3xl w-full p-6 animate-in slide-in-from-bottom duration-300 space-y-4 max-h-[85%] flex flex-col shadow-2xl">
                <div className="flex justify-between items-center mb-2">
                   <h3 className="font-black text-lg">选择位置</h3>
                   <button onClick={() => setShowLocationPicker(false)} className="text-gray-400 active:scale-90"><i className="fas fa-times text-xl"></i></button>
                </div>
                
                <div className="bg-gray-100 rounded-xl p-3 flex items-center gap-2 border border-transparent focus-within:border-blue-400 transition-colors">
                   <i className="fas fa-search text-gray-400 text-sm"></i>
                   <input 
                     value={customLocation} 
                     onChange={e => setCustomLocation(e.target.value)}
                     className="bg-transparent flex-1 outline-none text-sm" 
                     placeholder="搜索或输入自定义位置..." 
                   />
                   {customLocation && (
                     <button onClick={() => setCustomLocation('')} className="text-gray-300"><i className="fas fa-times-circle"></i></button>
                   )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                   {customLocation.trim() && (
                      <button 
                        onClick={() => handleSendLocation(customLocation)}
                        className="w-full text-left p-4 rounded-xl bg-blue-50 flex items-center gap-3 border border-blue-100 animate-in fade-in duration-200 mb-2"
                      >
                         <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">
                            <i className="fas fa-plus"></i>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[10px] text-blue-400 font-bold uppercase">发送自定义位置</span>
                            <span className="text-sm font-bold text-blue-800 truncate max-w-[200px]">{customLocation}</span>
                         </div>
                      </button>
                   )}
                   <label className="text-[10px] text-gray-400 font-bold uppercase block py-3 px-1">常用地点 (Presets)</label>
                   {PRESET_LOCATIONS.map(loc => (
                      <button 
                        key={loc}
                        onClick={() => handleSendLocation(loc)}
                        className="w-full text-left p-4 rounded-xl active:bg-gray-100 flex items-center gap-4 border-b border-gray-50 group"
                      >
                         <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-red-400 group-active:scale-90 transition-transform">
                            <i className="fas fa-map-pin"></i>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-800">{loc}</span>
                            <span className="text-[10px] text-gray-400">上海市 · 热门地标</span>
                         </div>
                      </button>
                   ))}
                </div>
                <div className="pb-8"></div>
             </div>
          </div>
        )}

        {showTransferModal && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
             <div className="bg-white rounded-3xl w-full p-6 animate-in zoom-in duration-200 shadow-2xl">
                <div className="text-center mb-6">
                   <div className="w-14 h-14 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                      <i className="fas fa-coins"></i>
                   </div>
                   <h3 className="font-black text-xl">转账给好友</h3>
                   <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-wider font-bold">向 {selectedChar.name} 付款</p>
                </div>
                <div className="space-y-4">
                   <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                      <label className="text-[10px] text-gray-400 font-bold uppercase block mb-2">输入金额 (Amount)</label>
                      <div className="flex items-center gap-2">
                         <span className="text-3xl font-black text-gray-800">¥</span>
                         <input 
                           type="number" 
                           value={transferAmount}
                           onChange={e => setTransferAmount(e.target.value)}
                           className="bg-transparent text-4xl font-black w-full outline-none text-gray-900" 
                           placeholder="0.00" 
                           autoFocus
                         />
                      </div>
                   </div>
                   <div className="flex justify-between text-[11px] px-2 font-bold">
                      <span className="text-gray-400">可用余额: ¥{balance.toFixed(2)}</span>
                      {parseFloat(transferAmount) > balance && <span className="text-red-500">余额不足 (Insufficient)</span>}
                   </div>
                   <div className="flex gap-3 pt-2">
                      <button onClick={() => setShowTransferModal(false)} className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black active:scale-95 transition-transform">取消</button>
                      <button 
                        onClick={handleSendTransfer}
                        disabled={!transferAmount || parseFloat(transferAmount) <= 0 || parseFloat(transferAmount) > balance}
                        className="flex-1 bg-[#07c160] text-white py-4 rounded-2xl font-black disabled:opacity-30 active:scale-95 transition-transform shadow-lg shadow-green-200"
                      >
                        确认转账
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  const unreadTotal = (Object.values(chats) as ChatSession[]).reduce((sum, s) => sum + (s.unreadCount || 0), 0);

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <div className="p-4 pt-11 flex justify-between items-center border-b border-gray-100 shrink-0">
        <button onClick={onBack} className="text-[#07c160] font-medium flex items-center gap-1">返回</button>
        <span className="font-bold text-[17px]">微信</span>
        <button onClick={() => setView('create_char')}><i className="fas fa-plus text-[20px]"></i></button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div onClick={() => setView('search')} className="bg-[#f0f0f0] mx-4 my-3 rounded-lg py-1.5 flex items-center justify-center gap-2 text-gray-400 text-[13px] cursor-pointer">搜索</div>
        {characters.map(char => {
          const s = chats[char.id];
          const lastMsg = s?.messages.slice(-1)[0];
          const unread = s?.unreadCount || 0;
          return (
            <button key={char.id} onClick={() => { setSelectedCharId(char.id); setView('chatting'); }} className="w-full flex items-center p-4 gap-4 active:bg-gray-100 border-b border-gray-50">
              <div className="relative shrink-0">
                <img src={char.avatar} className="w-14 h-14 rounded-xl shadow-sm object-cover" />
                {unread > 0 && <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 border-2 border-white">{unread}</div>}
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[16px] truncate">
                    {char.name}
                    {s?.isTyping && <span className="text-[10px] text-green-500 ml-2 font-normal">输入中...</span>}
                  </span>
                  {s?.lastMessageAt && <span className="text-[11px] text-gray-400">{new Date(s.lastMessageAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>}
                </div>
                <div className="text-[14px] text-gray-400 truncate">
                  {lastMsg ? (
                    lastMsg.type === 'action' ? `[动作] ${lastMsg.text}` : 
                    lastMsg.type === 'transfer' ? `[转账] ¥${lastMsg.amount?.toFixed(2)}` :
                    lastMsg.type === 'location' ? `📍 ${lastMsg.locationName}` :
                    lastMsg.text
                  ) : "点击聊天..."}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <Nav active={view} setView={setView} unreadTotal={unreadTotal} />
    </div>
  );
};

const Nav: React.FC<{ active: string, setView: (v: any) => void, unreadTotal?: number }> = ({ active, setView, unreadTotal }) => (
  <div className="border-t bg-[#f7f7f7] flex justify-around p-2 pt-1 pb-8 shrink-0">
    <button onClick={() => setView('chats')} className={`flex flex-col items-center gap-1 relative ${active === 'chats' ? 'text-[#07c160]' : 'text-gray-400'}`}>
      <div className="relative"><i className="fas fa-comment text-2xl"></i>{unreadTotal && unreadTotal > 0 && active !== 'chats' ? <div className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full border border-white"></div> : null}</div>
      <span className="text-[10px]">微信</span>
    </button>
    <button onClick={() => setView('contacts')} className="text-gray-400 flex flex-col items-center gap-1"><i className="fas fa-address-book text-2xl"></i><span className="text-[10px]">通讯录</span></button>
    <button onClick={() => setView('discover')} className="text-gray-400 flex flex-col items-center gap-1"><i className="fas fa-compass text-2xl"></i><span className="text-[10px]">发现</span></button>
    <button onClick={() => setView('profile')} className="text-gray-400 flex flex-col items-center gap-1"><i className="fas fa-user text-2xl"></i><span className="text-[10px]">我</span></button>
  </div>
);

export default WeChatApp;

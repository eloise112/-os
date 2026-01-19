
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
  onToggleLike: (postId: string) => void;
  onBack: () => void;
  onClearUnread: (charId: string) => void;
}

type WeChatView = 'chats' | 'contacts' | 'discover' | 'moments' | 'profile' | 'chatting' | 'char_detail' | 'create_char' | 'posting' | 'search' | 'edit_profile';

const EMOJIS = ['😊', '😂', '🥰', '😍', '😒', '😭', '😎', '🤔', '🙄', '😴', '😋', '🥳', '😇', '🤔', '🤐', '🤨', '😏', '😶', '😑', '😬', '😮', '😱', '🥱', '😴', '🤤', '😪', '🌞', '🌙', '⭐', '🔥', '✨', '🎈'];
const PRESET_LOCATIONS = ['虹桥天地', '静安寺', '外滩18号', '梅赛德斯-奔驰文化中心', '徐家汇中心', '新天地', '武康路', '东方明珠'];

const WeChatApp: React.FC<WeChatAppProps> = ({ chats, characters, user, onUpdateUser, onSendMessage, onTriggerAI, onAddCharacter, onAddPost, onAddComment, onToggleLike, onBack, onClearUnread, balance, posts }) => {
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
  const [customLocationName, setCustomLocationName] = useState('');
  const [newPostText, setNewPostText] = useState('');
  const [activeActionsMenu, setActiveActionsMenu] = useState<string | null>(null);

  // Editing User State
  const [editUser, setEditUser] = useState<UserProfile>(user);

  const [newChar, setNewChar] = useState<Partial<Character>>({
    name: '', avatar: `https://picsum.photos/seed/${Date.now()}/200/200`, background: '', preferences: '', storyline: '', firstMessage: '你好。'
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const selectedChar = useMemo(() => characters.find(c => c.id === selectedCharId), [characters, selectedCharId]);
  const session = useMemo(() => selectedCharId ? chats[selectedCharId] : undefined, [chats, selectedCharId]);

  useEffect(() => {
    if (view === 'chatting' && selectedCharId) onClearUnread(selectedCharId);
  }, [view, selectedCharId, onClearUnread]);

  useEffect(() => {
    if (view === 'edit_profile') setEditUser(user);
  }, [view, user]);

  const messageCount = session?.messages.length || 0;
  const isTyping = session?.isTyping || false;

  useEffect(() => {
    if (view === 'chatting' && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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

  const handleManualReply = () => { if (selectedCharId) onTriggerAI(selectedCharId); };

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
    setCustomLocationName('');
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

  const handleSendPost = () => {
    if (!newPostText.trim()) return;
    onAddPost(newPostText);
    setNewPostText('');
    setView('moments');
  };

  const handleSaveProfile = () => {
    onUpdateUser(editUser);
    setView('profile');
  };

  const handleToggleLikeMenu = (postId: string) => {
     setActiveActionsMenu(prev => prev === postId ? null : postId);
  };

  // Rendering logic for different views
  if (view === 'edit_profile') {
    return (
      <div className="h-full flex flex-col bg-[#f2f2f7] animate-in slide-in-from-right duration-300">
        <div className="p-4 pt-11 bg-white border-b border-gray-200 flex items-center justify-between shrink-0">
          <button onClick={() => setView('profile')} className="text-gray-900 text-[16px]">取消</button>
          <span className="font-bold text-[17px]">个人信息</span>
          <button onClick={handleSaveProfile} className="text-[#07c160] font-bold">完成</button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 pt-4 pb-12">
           <div className="bg-white divide-y divide-gray-100 border-y border-gray-200">
              <div className="p-4 flex items-center justify-between active:bg-gray-50" onClick={() => setEditUser({...editUser, avatar: `https://picsum.photos/seed/${Date.now()}/100/100`})}>
                 <span className="text-[16px]">头像</span>
                 <div className="flex items-center gap-2">
                    <img src={editUser.avatar} className="w-16 h-16 rounded-xl object-cover" />
                    <i className="fas fa-chevron-right text-gray-300 text-sm"></i>
                 </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                 <span className="text-[16px] shrink-0 w-24">名字</span>
                 <input value={editUser.name} onChange={e => setEditUser({...editUser, name: e.target.value})} className="flex-1 text-right text-gray-500 outline-none font-medium" />
              </div>
              <div className="p-4 flex items-center justify-between">
                 <span className="text-[16px] shrink-0 w-24">微信号</span>
                 <input value={editUser.wechatId} onChange={e => setEditUser({...editUser, wechatId: e.target.value})} className="flex-1 text-right text-gray-500 outline-none font-medium" />
              </div>
           </div>
           
           <div className="px-4 py-2">
              <h3 className="text-[14px] text-gray-500 mb-2 uppercase tracking-tight">个性签名 / 设定 / 喜好</h3>
              <div className="bg-white border-y border-gray-200 p-4">
                 <textarea 
                    value={editUser.persona} 
                    onChange={e => setEditUser({...editUser, persona: e.target.value})} 
                    className="w-full min-h-[160px] text-[15px] outline-none text-gray-600 leading-relaxed resize-none" 
                    placeholder="在这里描述你的个性、日常、或者是你想让AI了解的设定..."
                 />
              </div>
              <p className="mt-3 text-[12px] text-gray-400 leading-tight">完善这些信息后，AI角色在聊天和朋友圈互动中会表现得更懂你。</p>
           </div>
        </div>
      </div>
    );
  }

  if (view === 'chatting' && selectedChar) {
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
                <div className={`flex ${isAction ? 'w-full px-1' : 'max-w-[85%]'} ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start`}>
                  {!isAction && <img src={isUser ? user.avatar : (selectedChar.avatar || 'https://picsum.photos/seed/ai/100/100')} className="w-10 h-10 rounded-md shadow-sm shrink-0 object-cover" />}
                  <div className={`flex flex-col items-start ${isAction ? 'w-full' : ''}`}>
                    {isAction ? (
                      <div className="my-1 w-full bg-gray-200/50 text-gray-500 text-[9.5px] px-4 py-3 rounded-2xl font-mono border border-gray-300/30 shadow-sm relative italic leading-relaxed text-center">
                        <span className="opacity-30 text-[7px] absolute -top-1.5 left-4 bg-gray-400 text-white rounded px-1 scale-75 uppercase font-bold tracking-tighter">BEHAVIOR</span>
                        {m.text}
                      </div>
                    ) : isTransfer ? (
                      <div className={`mx-2 p-3 rounded-xl shadow-sm bg-orange-500 text-white w-48 flex items-center gap-3 border-2 border-white/20 active:scale-95 transition-transform`}>
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl"><i className="fas fa-hand-holding-usd"></i></div>
                        <div className="flex-1">
                           <div className="text-[15px] font-bold">¥ {m.amount?.toFixed(2)}</div>
                           <div className="text-[10px] opacity-80">点击领取转账</div>
                        </div>
                      </div>
                    ) : isLocation ? (
                      <div className={`mx-2 p-0 rounded-xl shadow-sm bg-white overflow-hidden w-56 border border-gray-100 active:scale-95 transition-transform`}>
                         <div className="h-24 bg-blue-50 flex items-center justify-center text-blue-300"><i className="fas fa-map-marked-alt text-4xl"></i></div>
                         <div className="p-2">
                            <div className="text-[13px] font-bold text-gray-800 truncate">{m.locationName}</div>
                            <div className="text-[10px] text-gray-400">上海市 · 实时定位</div>
                         </div>
                      </div>
                    ) : (
                      <div className={`mx-2 p-2.5 rounded-lg text-[15px] shadow-sm relative ${isUser ? 'bg-[#95ec69] text-black after:content-[""] after:absolute after:top-3 after:-right-1 after:w-2 after:h-2 after:bg-[#95ec69] after:rotate-45' : 'bg-white text-black after:content-[""] after:absolute after:top-3 after:-left-1 after:w-2 after:h-2 after:bg-white after:rotate-45'}`}>
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

        {!session?.isTyping && (
          <button onClick={handleManualReply} className="absolute bottom-24 right-4 bg-white/90 backdrop-blur-md text-[#07c160] px-4 py-2 rounded-full shadow-lg border border-gray-200 font-bold text-[13px] z-20 active:scale-95 transition-all flex items-center gap-2">
             <i className="fas fa-magic"></i> 回复
          </button>
        )}

        <div className="bg-[#f7f7f7] border-t p-2 pb-8 flex flex-col items-center gap-2 shrink-0 z-30">
          <div className="w-full flex items-center gap-2 px-1">
            <button onClick={() => setIsActionMode(!isActionMode)} className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${isActionMode ? 'bg-[#07c160] text-white' : 'bg-white border border-gray-200 text-gray-400'}`}><i className="fas fa-running text-lg"></i></button>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} className={`flex-1 bg-white rounded-lg p-2.5 outline-none text-sm border ${isActionMode ? 'border-[#07c160]' : 'border-gray-300'}`} placeholder={isActionMode ? "写下你的动作描写..." : "发送消息..."} />
            <button onClick={() => { setShowMoreTools(!showMoreTools); setToolTab('emoji'); }} className="text-gray-500 text-2xl"><i className="far fa-smile"></i></button>
            {input.trim() ? (
              <button onClick={handleSend} className="bg-[#07c160] text-white px-4 py-2 rounded-lg font-bold text-[14px]">发送</button>
            ) : (
              <button onClick={() => { setShowMoreTools(!showMoreTools); setToolTab('tools'); }} className="text-gray-500 text-2xl"><i className="far fa-plus-square"></i></button>
            )}
          </div>
          {showMoreTools && (
            <div className="w-full h-48 bg-[#f7f7f7] p-4 border-t border-gray-200 overflow-y-auto grid grid-cols-4 gap-4 animate-in slide-in-from-bottom duration-200">
               {toolTab === 'emoji' ? (
                 <div className="col-span-4 grid grid-cols-8 gap-3">{EMOJIS.map(e => (<button key={e} onClick={() => handleSendEmoji(e)} className="text-2xl active:scale-125 transition-transform">{e}</button>))}</div>
               ) : (
                 <>
                   <button onClick={() => setShowLocationPicker(true)} className="flex flex-col items-center gap-2"><div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm border border-gray-100"><i className="fas fa-map-marker-alt text-red-500"></i></div><span className="text-[11px] text-gray-500">位置</span></button>
                   <button onClick={() => setShowTransferModal(true)} className="flex flex-col items-center gap-2"><div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm border border-gray-100"><i className="fas fa-hand-holding-usd text-orange-500"></i></div><span className="text-[11px] text-gray-500">转账</span></button>
                 </>
               )}
            </div>
          )}
        </div>
        
        {showLocationPicker && (
          <div className="absolute inset-0 bg-black/50 z-[210] flex items-end">
             <div className="bg-white rounded-t-3xl w-full p-6 space-y-4 max-h-[85%] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center mb-2"><h3 className="font-bold text-lg text-gray-800">发送位置</h3><button onClick={() => setShowLocationPicker(false)}><i className="fas fa-times text-xl text-gray-300"></i></button></div>
                
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-xl border border-transparent focus-within:border-[#07c160] transition-all">
                     <i className="fas fa-map-pin text-gray-400 text-sm"></i>
                     <input 
                       value={customLocationName} 
                       onChange={e => setCustomLocationName(e.target.value)} 
                       className="bg-transparent flex-1 outline-none text-sm" 
                       placeholder="自拟或编辑选中的位置..." 
                     />
                     {customLocationName.trim() && (
                       <button onClick={() => handleSendLocation(customLocationName)} className="text-[#07c160] font-bold text-sm bg-white px-3 py-1 rounded-lg shadow-sm">发送</button>
                     )}
                  </div>
                  <p className="text-[10px] text-gray-400 px-1">点击下方推荐位置可快速填入并编辑。</p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1">
                   {PRESET_LOCATIONS.map(loc => (
                    <button key={loc} onClick={() => setCustomLocationName(loc)} className="w-full text-left p-4 rounded-xl active:bg-gray-100 flex items-center justify-between border-b border-gray-50 group">
                       <div className="flex items-center gap-4">
                          <i className="fas fa-map-pin text-red-400"></i>
                          <span className="text-sm font-medium text-gray-700">{loc}</span>
                       </div>
                       <i className="fas fa-edit text-gray-300 group-active:text-[#07c160] transition-colors"></i>
                    </button>
                  ))}
                </div>
             </div>
          </div>
        )}

        {showTransferModal && (
          <div className="absolute inset-0 bg-black/40 z-[200] flex items-center justify-center p-6 backdrop-blur-sm">
             <div className="bg-white rounded-3xl w-full p-6 animate-in zoom-in duration-200 shadow-2xl">
                <div className="text-center mb-6"><div className="w-14 h-14 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl"><i className="fas fa-coins"></i></div><h3 className="font-bold text-xl">转账给好友</h3></div>
                <div className="space-y-4"><div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 text-center"><input type="number" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} className="bg-transparent text-4xl font-black w-full outline-none text-center" placeholder="0.00" autoFocus /></div><div className="flex gap-3"><button onClick={() => setShowTransferModal(false)} className="flex-1 bg-gray-100 py-4 rounded-2xl font-bold">取消</button><button onClick={handleSendTransfer} className="flex-1 bg-[#07c160] text-white py-4 rounded-2xl font-bold">确认</button></div></div>
             </div>
          </div>
        )}
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
        <div className="flex-1 overflow-y-auto" onClick={() => { setActiveActionsMenu(null); setActiveCommentPost(null); }}>
           <div className="relative mb-16 h-72">
              <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600" className="w-full h-full object-cover" />
              <div className="absolute -bottom-8 right-4 flex items-end gap-3">
                 <span className="text-white font-bold text-[18px] mb-4 drop-shadow-lg">{user.name}</span>
                 <img src={user.avatar} className="w-20 h-20 rounded-xl shadow-lg border-2 border-white object-cover" />
              </div>
           </div>
           <div className="px-4 pb-24 divide-y divide-gray-100">
             {posts
              .filter(p => p.platform === 'moments' && (p.authorId === 'user' || characters.some(c => c.id === p.authorId)))
              .sort((a,b) => b.timestamp - a.timestamp)
              .map(post => {
               const author = post.authorId === 'user' ? { name: user.name, avatar: user.avatar } : characters.find(c => c.id === post.authorId)!;
               return (
                 <div key={post.id} className="py-6 flex gap-3">
                    <img src={author.avatar} className="w-11 h-11 rounded-md object-cover flex-shrink-0" />
                    <div className="flex-1 relative">
                       <h3 className="text-[#576b95] font-bold text-[15px] mb-1">{author.name}</h3>
                       <p className="text-[15px] text-gray-900 mb-3 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                       <div className="flex justify-between items-center text-[12px] text-gray-400">
                          <span className="text-[11px]">刚刚</span>
                          <div className="relative">
                             <button onClick={(e) => { e.stopPropagation(); handleToggleLikeMenu(post.id); }} className="bg-gray-100 w-8 h-6 rounded-md text-[#576b95] flex items-center justify-center text-sm font-black active:bg-gray-200">
                                <span className="mb-1">..</span>
                             </button>
                             {activeActionsMenu === post.id && (
                               <div className="absolute right-10 -top-1 bg-[#4c4c4c] rounded-md flex overflow-hidden animate-in slide-in-from-right-2 duration-150 z-30">
                                  <button onClick={(e) => { e.stopPropagation(); onToggleLike(post.id); setActiveActionsMenu(null); }} className="flex items-center gap-1.5 px-4 py-2 text-white text-[13px] border-r border-black/20 active:bg-black/10">
                                     <i className={post.likedByMe ? 'fas fa-heart text-red-500' : 'far fa-heart'}></i> {post.likedByMe ? '取消' : '赞'}
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); setActiveCommentPost({ id: post.id }); setActiveActionsMenu(null); }} className="flex items-center gap-1.5 px-4 py-2 text-white text-[13px] active:bg-black/10">
                                     <i className="far fa-comment"></i> 评论
                                  </button>
                               </div>
                             )}
                          </div>
                       </div>
                       
                       {(post.likes > 0 || (post.commentsList && post.commentsList.length > 0)) && (
                         <div className="mt-3 bg-[#f7f7f7] rounded-sm p-2 relative before:content-[''] before:absolute before:-top-2 before:left-3 before:border-8 before:border-transparent before:border-b-[#f7f7f7]">
                            {post.likes > 0 && (
                               <div className="flex items-center gap-2 text-[13px] text-[#576b95] font-bold border-b border-gray-200/50 pb-1.5 mb-1.5">
                                  <i className="far fa-heart text-xs opacity-50"></i>
                                  <span>{post.likedByMe ? '我' : ''}{post.likedByMe && post.likes > 1 ? ', ' : ''}{post.likes > (post.likedByMe ? 1 : 0) ? `${post.likes - (post.likedByMe ? 1 : 0)}位朋友` : (post.likedByMe ? '' : `${post.likes}位朋友`)}</span>
                               </div>
                            )}
                            {post.commentsList && post.commentsList.length > 0 && (
                               <div className="space-y-1">
                                  {post.commentsList
                                   .filter(c => c.authorId === 'user' || characters.some(char => char.id === c.authorId))
                                   .map(c => (
                                    <div key={c.id} className="text-[14px]" onClick={(e) => { e.stopPropagation(); setActiveCommentPost({ id: post.id, replyToName: c.authorName }); }}>
                                      <span className="text-[#576b95] font-bold">{c.authorName}</span>
                                      {c.replyToName && <> <span className="text-gray-400 font-normal ml-1 mr-1">回复</span> <span className="text-[#576b95] font-bold">{c.replyToName}</span></>}
                                      : <span className="text-gray-900">{c.content}</span>
                                    </div>
                                  ))}
                               </div>
                            )}
                         </div>
                       )}
                    </div>
                 </div>
               );
             })}
           </div>
        </div>
        {activeCommentPost && (
          <div className="absolute bottom-0 left-0 w-full bg-[#f7f7f7] border-t p-2 pb-8 flex items-center gap-2 z-50 animate-in slide-in-from-bottom duration-200">
            <input ref={commentInputRef} value={commentInput} onChange={e => setCommentInput(e.target.value)} className="flex-1 bg-white rounded-md p-2 outline-none text-[15px]" placeholder={`回复 ${activeCommentPost.replyToName || ''}...`} autoFocus />
            <button onClick={handleSendComment} className="bg-[#07c160] text-white px-4 py-2 rounded font-bold">发送</button>
          </div>
        )}
      </div>
    );
  }

  if (view === 'posting') {
    return (
      <div className="h-full flex flex-col bg-white animate-in slide-in-from-bottom duration-300">
        <div className="p-4 pt-11 flex justify-between items-center border-b border-gray-100">
          <button onClick={() => setView('moments')} className="text-gray-500">取消</button>
          <button onClick={handleSendPost} disabled={!newPostText.trim()} className={`px-4 py-1.5 rounded-md font-bold text-white ${newPostText.trim() ? 'bg-[#07c160]' : 'bg-gray-200'}`}>发表</button>
        </div>
        <textarea value={newPostText} onChange={e => setNewPostText(e.target.value)} placeholder="这一刻的想法..." className="flex-1 p-4 outline-none resize-none text-[16px] leading-relaxed" autoFocus />
      </div>
    );
  }

  // Handle main tabs
  let mainContent;
  switch (view) {
    case 'chats':
      mainContent = (
        <>
          <div className="bg-[#f0f0f0] mx-4 my-3 rounded-lg py-1.5 flex items-center justify-center gap-2 text-gray-400 text-[13px] cursor-pointer">搜索</div>
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
                    <span className="font-semibold text-[16px] truncate">{char.name} {s?.isTyping && <span className="text-[10px] text-green-500 font-normal">输入中...</span>}</span>
                    {s?.lastMessageAt && <span className="text-[11px] text-gray-400">{new Date(s.lastMessageAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>}
                  </div>
                  <div className="text-[14px] text-gray-400 truncate">
                    {lastMsg ? (lastMsg.type === 'action' ? `[动作] ${lastMsg.text}` : lastMsg.text) : "点击开始聊天"}
                  </div>
                </div>
              </button>
            );
          })}
        </>
      );
      break;
    case 'contacts':
      mainContent = (
        <div className="bg-white h-full overflow-y-auto pb-24">
          <div className="p-2 bg-gray-50 text-[10px] text-gray-400 font-bold px-4">我的好友</div>
          {characters.map(char => (
            <div key={char.id} className="p-4 flex items-center gap-4 border-b border-gray-50 active:bg-gray-50">
               <img src={char.avatar} className="w-10 h-10 rounded-md object-cover shadow-sm" />
               <span className="font-bold text-[16px]">{char.name}</span>
            </div>
          ))}
        </div>
      );
      break;
    case 'discover':
      mainContent = (
        <div className="bg-[#f2f2f7] h-full pt-4 space-y-3">
          <button onClick={() => setView('moments')} className="w-full bg-white flex items-center p-4 gap-4 active:bg-gray-100">
             <div className="w-8 h-8 rounded bg-blue-500 text-white flex items-center justify-center shadow-sm"><i className="fas fa-camera"></i></div>
             <span className="flex-1 text-left font-medium">朋友圈</span>
             <div className="flex items-center gap-2">
                <img src={posts.filter(p=>p.platform==='moments')[0]?.images[0] || user.avatar} className="w-8 h-8 rounded object-cover border border-gray-100" />
                <i className="fas fa-chevron-right text-gray-300 text-xs"></i>
             </div>
          </button>
          <div className="bg-white divide-y divide-gray-50">
             <div className="p-4 flex items-center gap-4 text-gray-400"><div className="w-8 h-8 rounded bg-red-500 text-white flex items-center justify-center"><i className="fas fa-video"></i></div> <span className="text-black font-medium">视频号</span> <i className="fas fa-chevron-right text-gray-300 text-xs ml-auto"></i></div>
             <div className="p-4 flex items-center gap-4 text-gray-400"><div className="w-8 h-8 rounded bg-yellow-500 text-white flex items-center justify-center"><i className="fas fa-gamepad"></i></div> <span className="text-black font-medium">游戏</span> <i className="fas fa-chevron-right text-gray-300 text-xs ml-auto"></i></div>
          </div>
        </div>
      );
      break;
    case 'profile':
      mainContent = (
        <div className="bg-[#f2f2f7] h-full space-y-3">
          <div className="bg-white p-6 pt-12 flex items-center gap-5 active:bg-gray-50" onClick={() => setView('edit_profile')}>
             <img src={user.avatar} className="w-16 h-16 rounded-xl object-cover shadow-sm border border-gray-100" />
             <div className="flex-1">
                <h2 className="text-xl font-bold">{user.name}</h2>
                <div className="text-gray-400 text-xs mt-1">微信号: {user.wechatId}</div>
             </div>
             <i className="fas fa-qrcode text-gray-400"></i>
             <i className="fas fa-chevron-right text-gray-300 text-xs"></i>
          </div>
          <div className="bg-white divide-y divide-gray-50">
             <div className="p-4 flex items-center gap-4 active:bg-gray-50"><i className="fas fa-wallet text-blue-500"></i> <span className="font-medium">服务</span> <div className="flex-1 text-right text-gray-400 text-xs">钱包 ¥{balance.toFixed(2)}</div> <i className="fas fa-chevron-right text-gray-300 text-xs"></i></div>
             <div className="p-4 flex items-center gap-4 active:bg-gray-50"><i className="fas fa-cog text-gray-500"></i> <span className="font-medium">设置</span> <i className="fas fa-chevron-right text-gray-300 text-xs ml-auto"></i></div>
          </div>
        </div>
      );
      break;
    default: mainContent = null;
  }

  const unreadTotal = (Object.values(chats) as ChatSession[]).reduce((sum, s) => sum + (s.unreadCount || 0), 0);

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <div className="p-4 pt-11 flex justify-between items-center border-b border-gray-100 shrink-0 bg-white z-10">
        <button onClick={onBack} className="text-[#07c160] font-medium flex items-center gap-1">返回</button>
        <span className="font-bold text-[17px]">
          {view === 'chats' ? '微信' : view === 'contacts' ? '通讯录' : view === 'discover' ? '发现' : '我'}
        </span>
        <button onClick={() => setView('create_char')}><i className="fas fa-plus text-[20px]"></i></button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {mainContent}
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
    <button onClick={() => setView('contacts')} className={`flex flex-col items-center gap-1 ${active === 'contacts' ? 'text-[#07c160]' : 'text-gray-400'}`}><i className="fas fa-address-book text-2xl"></i><span className="text-[10px]">通讯录</span></button>
    <button onClick={() => setView('discover')} className={`flex flex-col items-center gap-1 ${active === 'discover' || active === 'moments' || active === 'posting' ? 'text-[#07c160]' : 'text-gray-400'}`}><i className="fas fa-compass text-2xl"></i><span className="text-[10px]">发现</span></button>
    <button onClick={() => setView('profile')} className={`flex flex-col items-center gap-1 ${active === 'profile' || active === 'edit_profile' ? 'text-[#07c160]' : 'text-gray-400'}`}><i className="fas fa-user text-2xl"></i><span className="text-[10px]">我</span></button>
  </div>
);

export default WeChatApp;

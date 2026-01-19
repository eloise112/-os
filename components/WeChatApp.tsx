
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
  onClearUnread: (charId: string) => void;
}

type WeChatView = 'chats' | 'contacts' | 'discover' | 'moments' | 'profile' | 'chatting' | 'char_detail' | 'create_char' | 'posting' | 'search' | 'edit_profile' | 'location_picker';

const WeChatApp: React.FC<WeChatAppProps> = ({ chats, characters, user, onUpdateUser, onSendMessage, onAddCharacter, onAddPost, onAddComment, onBack, onClearUnread, balance, posts }) => {
  const [view, setView] = useState<WeChatView>('chats');
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [activeCommentPost, setActiveCommentPost] = useState<{ id: string, replyToName?: string } | null>(null);

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
  }, [view, selectedCharId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chats, selectedCharId, view, session?.isTyping]);

  useEffect(() => {
    if (activeCommentPost) commentInputRef.current?.focus();
  }, [activeCommentPost]);

  const handleSend = () => {
    if (!input.trim() || !selectedCharId) return;
    onSendMessage(selectedCharId, input, 'text');
    setInput('');
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
    return (
      <div className="h-full flex flex-col bg-[#ededed] animate-in slide-in-from-right duration-300">
        <div className="p-4 pt-11 bg-[#ededed] border-b border-gray-200 flex items-center shrink-0">
          <button onClick={() => setView('chats')} className="mr-4 text-gray-700"><i className="fas fa-chevron-left text-lg"></i></button>
          <div className="flex-1 text-center font-bold">
            {selectedChar.name}
            {session?.isTyping && <div className="text-[10px] text-gray-400 font-normal mt-[-2px] animate-pulse">对方正在输入...</div>}
          </div>
          <button className="w-8 text-right text-gray-700"><i className="fas fa-ellipsis-h"></i></button>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-5">
          {session?.messages.map(m => {
            const isUser = m.senderId === 'user';
            return (
              <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <img src={isUser ? user.avatar : selectedChar.avatar} className="w-10 h-10 rounded-md shadow-sm shrink-0 object-cover" />
                  <div className={`mx-2 p-2.5 rounded-lg text-[14px] shadow-sm ${isUser ? 'bg-[#95ec69]' : 'bg-white'}`}>{m.text}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="bg-[#f7f7f7] border-t p-2 pb-8 flex items-center gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} className="flex-1 bg-white rounded-md p-2 outline-none text-sm border" placeholder="发送消息..." />
          <button onClick={handleSend} className="bg-[#07c160] text-white px-4 py-2 rounded font-bold">发送</button>
        </div>
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
                <div className="text-[14px] text-gray-400 truncate">{lastMsg ? lastMsg.text : "点击聊天..."}</div>
              </div>
            </button>
          );
        })}
      </div>
      <Nav active={view} setView={setView} unreadTotal={unreadTotal} />
    </div>
  );
};

const Nav: React.FC<{ active: string, setView: (v: WeChatView) => void, unreadTotal?: number }> = ({ active, setView, unreadTotal }) => (
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

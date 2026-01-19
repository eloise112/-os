
import React, { useState, useRef, useEffect } from 'react';
import { SocialPost, Character, WorldState } from '../types';

interface WeiboAppProps {
  posts: SocialPost[];
  characters: Character[];
  world: WorldState;
  onAddPost: (content: string) => void;
  onAddComment: (postId: string, content: string, replyToName?: string) => void;
  onToggleLike: (postId: string) => void;
  onBack: () => void;
}

const WeiboApp: React.FC<WeiboAppProps> = ({ posts, characters, world, onAddPost, onAddComment, onToggleLike, onBack }) => {
  const [activeTab, setActiveTab] = useState<'follow' | 'recommend' | 'hot'>('recommend');
  const [isPosting, setIsPosting] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const commentInputRef = useRef<HTMLInputElement>(null);

  const handlePost = () => {
    if (!postContent.trim()) return;
    onAddPost(postContent);
    setPostContent('');
    setIsPosting(false);
  };

  const handleComment = () => {
    if (!commentText.trim() || !commentingId) return;
    onAddComment(commentingId, commentText);
    setCommentText('');
    setCommentingId(null);
  };

  useEffect(() => {
    if (commentingId) commentInputRef.current?.focus();
  }, [commentingId]);

  if (isPosting) {
    return (
      <div className="h-full flex flex-col bg-white animate-in slide-in-from-bottom duration-300">
        <div className="p-4 pt-11 flex justify-between items-center border-b">
          <button onClick={() => setIsPosting(false)} className="text-gray-600">取消</button>
          <span className="font-bold">发布微博</span>
          <button onClick={handlePost} disabled={!postContent.trim()} className={`px-4 py-1.5 rounded-full font-bold ${postContent.trim() ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>发送</button>
        </div>
        <textarea value={postContent} onChange={e => setPostContent(e.target.value)} placeholder="分享新鲜事..." className="flex-1 p-4 outline-none resize-none leading-relaxed" autoFocus />
      </div>
    );
  }

  const filteredPosts = posts.filter(p => {
    if (p.platform !== 'weibo') return false;
    if (activeTab === 'follow') {
      // Show user's posts and specific AI character card posts
      return p.authorId === 'user' || characters.some(c => c.id === p.authorId);
    }
    if (activeTab === 'recommend') {
      // Show virtual mass-market posts
      return p.isVirtual === true;
    }
    return false;
  }).sort((a,b) => b.timestamp - a.timestamp);

  return (
    <div className="h-full flex flex-col bg-[#f2f2f2] animate-in slide-in-from-right duration-300 relative">
      <div className="bg-white p-4 pt-11 sticky top-0 z-20 shadow-sm border-b shrink-0">
        <div className="flex items-center justify-between mb-4">
           <button onClick={onBack} className="text-orange-500 font-bold"><i className="fas fa-chevron-left"></i> 微博</button>
           <div className="flex gap-6 font-bold text-[16px]">
              <button onClick={() => setActiveTab('follow')} className={activeTab === 'follow' ? 'text-black border-b-2 border-orange-500 pb-1' : 'text-gray-400 pb-1'}>关注</button>
              <button onClick={() => setActiveTab('recommend')} className={activeTab === 'recommend' ? 'text-black border-b-2 border-orange-500 pb-1' : 'text-gray-400 pb-1'}>推荐</button>
              <button onClick={() => setActiveTab('hot')} className={activeTab === 'hot' ? 'text-black border-b-2 border-orange-500 pb-1' : 'text-gray-400 pb-1'}>热搜</button>
           </div>
           <button onClick={() => setIsPosting(true)} className="text-orange-500 text-xl"><i className="fas fa-plus-circle"></i></button>
        </div>
        <div className="bg-gray-100 rounded-full px-4 py-1.5 text-gray-400 text-sm flex items-center gap-2">
           <i className="fas fa-search"></i> 发现更多新鲜事
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" onClick={() => setCommentingId(null)}>
        {activeTab !== 'hot' ? (
           <div className="space-y-2">
             {filteredPosts.length === 0 ? (
               <div className="py-20 text-center text-gray-400 font-medium">
                  {activeTab === 'follow' ? '暂无动态，去关注更多角色吧' : '正在搜集最新动态...'}
               </div>
             ) : (
               filteredPosts.map(post => {
                 const authorChar = post.authorId === 'user' ? null : characters.find(c => c.id === post.authorId);
                 const displayName = post.authorName || authorChar?.name || (post.authorId === 'user' ? '我' : '匿名用户');
                 const displayAvatar = post.authorAvatar || authorChar?.avatar || 'https://picsum.photos/seed/user/100/100';
                 
                 return (
                   <div key={post.id} className="bg-white p-4">
                      <div className="flex items-center gap-3 mb-3">
                         <img src={displayAvatar} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                         <div className="flex-1">
                            <div className="font-bold text-[15px] flex items-center gap-1">
                               {displayName} 
                               {!post.isVirtual && post.authorId !== 'user' && <i className="fas fa-check-circle text-orange-400 text-[10px]" title="认证角色"></i>}
                            </div>
                            <div className="text-[11px] text-gray-400">
                               来自 智能终端 · {new Date(post.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                            </div>
                         </div>
                         {post.authorId === 'virtual' && <button className="text-[12px] text-orange-500 border border-orange-500 px-3 py-0.5 rounded-full font-bold">+ 关注</button>}
                      </div>
                      <p className="text-[15px] leading-relaxed mb-4 text-gray-800 whitespace-pre-wrap">{post.content}</p>
                      
                      <div className="flex border-t pt-2 text-gray-400 text-xs mt-2">
                         <button className="flex-1 py-1 hover:text-orange-500 transition-colors"><i className="far fa-share-square mr-1"></i> 分享</button>
                         <button onClick={(e) => { e.stopPropagation(); setCommentingId(post.id); }} className="flex-1 py-1 hover:text-orange-500 transition-colors"><i className="far fa-comment mr-1"></i> {post.commentsList?.length || 0}</button>
                         <button onClick={(e) => { e.stopPropagation(); onToggleLike(post.id); }} className={`flex-1 py-1 transition-colors ${post.likedByMe ? 'text-orange-500' : 'hover:text-orange-500'}`}><i className={`${post.likedByMe ? 'fas' : 'far'} fa-thumbs-up mr-1`}></i> {post.likes}</button>
                      </div>

                      {post.commentsList && post.commentsList.length > 0 && (
                        <div className="mt-3 bg-gray-50 p-3 rounded-lg space-y-2 border border-gray-100">
                           {post.commentsList.map(c => (
                             <div key={c.id} className="text-[13px] leading-relaxed">
                                <span className="font-bold text-[#576b95]">{c.authorName}</span>
                                {c.replyToName && <span className="text-gray-400 mx-1">回复 <span className="text-[#576b95] font-bold">{c.replyToName}</span></span>}
                                : <span className="text-gray-700">{c.content}</span>
                             </div>
                           ))}
                        </div>
                      )}
                   </div>
                 );
               })
             )}
           </div>
        ) : (
           <div className="bg-white min-h-full">
              <div className="p-4 border-b font-bold text-gray-400 text-[11px] tracking-widest uppercase bg-gray-50/50">实时热搜榜</div>
              {world.hotSearches.map((item, index) => (
                 <div key={item.id} className="flex items-center gap-4 px-4 py-4 border-b active:bg-gray-50 group">
                    <span className={`w-6 font-black italic text-lg text-center ${index < 3 ? 'text-orange-500' : 'text-gray-300'}`}>{index + 1}</span>
                    <div className="flex-1">
                       <div className="font-bold text-[15px] text-gray-900 group-active:text-orange-500 transition-colors">{item.title}</div>
                       <div className="text-[10px] text-gray-400 mt-0.5">{item.hotness} 实时讨论</div>
                    </div>
                    {item.tag && (
                       <span className={`text-[10px] text-white font-bold px-1.5 rounded py-0.5 ${item.tag === '爆' ? 'bg-red-500 shadow-[0_2px_4px_rgba(239,68,68,0.4)]' : item.tag === '热' ? 'bg-orange-500' : item.tag === '新' ? 'bg-blue-500' : 'bg-green-500'}`}>{item.tag}</span>
                    )}
                 </div>
              ))}
           </div>
        )}
      </div>

      {commentingId && (
        <div className="absolute bottom-0 w-full bg-white border-t p-2 pb-8 flex items-center gap-2 z-50 animate-in slide-in-from-bottom duration-200">
           <input ref={commentInputRef} value={commentText} onChange={e => setCommentText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleComment()} placeholder="发布你的评论..." className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none border border-transparent focus:border-orange-500" />
           <button onClick={handleComment} className="text-orange-500 font-bold px-3">发送</button>
        </div>
      )}

      <div className="bg-white border-t flex justify-around p-3 pb-8 shrink-0 text-gray-400 shadow-lg">
        <button onClick={()=>setActiveTab('recommend')} className={`flex flex-col items-center gap-1 ${activeTab==='recommend' || activeTab==='follow' ? 'text-orange-500' : ''}`}>
           <i className="fas fa-home text-2xl"></i>
           <span className="text-[9px] font-bold">首页</span>
        </button>
        <button onClick={()=>setActiveTab('hot')} className={`flex flex-col items-center gap-1 ${activeTab==='hot' ? 'text-orange-500' : ''}`}>
           <i className="fas fa-fire text-2xl"></i>
           <span className="text-[9px] font-bold">发现</span>
        </button>
        <button className="flex flex-col items-center gap-1"><i className="fas fa-search text-2xl"></i><span className="text-[9px] font-bold">搜索</span></button>
        <button className="flex flex-col items-center gap-1"><i className="fas fa-envelope text-2xl"></i><span className="text-[9px] font-bold">消息</span></button>
        <button className="flex flex-col items-center gap-1"><i className="fas fa-user text-2xl"></i><span className="text-[9px] font-bold">我</span></button>
      </div>
    </div>
  );
};

export default WeiboApp;

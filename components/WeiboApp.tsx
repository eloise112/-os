
import React, { useState, useRef, useEffect } from 'react';
import { SocialPost, Character } from '../types';

interface WeiboAppProps {
  posts: SocialPost[];
  characters: Character[];
  onAddPost: (content: string) => void;
  onAddComment: (postId: string, content: string, replyToName?: string) => void;
  onBack: () => void;
}

const WeiboApp: React.FC<WeiboAppProps> = ({ posts, characters, onAddPost, onAddComment, onBack }) => {
  const [isPosting, setIsPosting] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const commentInputRef = useRef<HTMLInputElement>(null);

  const handlePost = () => {
    if (!postContent.trim()) return;
    onAddPost(postContent);
    setPostContent('');
    setIsPosting(false);
  };

  const handleComment = () => {
    if (!commentText.trim() || !activeCommentPostId) return;
    onAddComment(activeCommentPostId, commentText);
    setCommentText('');
    setActiveCommentPostId(null);
  };

  useEffect(() => {
    if (activeCommentPostId) commentInputRef.current?.focus();
  }, [activeCommentPostId]);

  if (isPosting) {
    return (
      <div className="h-full flex flex-col bg-white animate-in slide-in-from-bottom duration-300">
        <div className="p-4 pt-11 flex justify-between items-center border-b border-gray-100">
          <button onClick={() => setIsPosting(false)} className="text-gray-600 text-[15px]">取消</button>
          <span className="font-bold text-[17px]">发微博</span>
          <button 
            onClick={handlePost} 
            disabled={!postContent.trim()}
            className={`px-4 py-1.5 rounded-full text-[14px] font-bold ${postContent.trim() ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}
          >发送</button>
        </div>
        <div className="p-4">
          <textarea 
            value={postContent}
            onChange={e => setPostContent(e.target.value)}
            placeholder="分享新鲜事... (微博语气请端着一点)"
            className="w-full h-48 outline-none text-[16px] resize-none leading-relaxed"
            autoFocus
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#f2f2f2] animate-in slide-in-from-right duration-300 relative">
      <div className="bg-white p-4 pt-11 sticky top-0 z-20 flex items-center shadow-sm gap-3 border-b border-gray-100 shrink-0">
        <button onClick={onBack} className="text-orange-500 flex items-center gap-1 active:opacity-50">
          <i className="fas fa-chevron-left"></i>
          <span className="text-sm font-bold">微博</span>
        </button>
        <div className="flex-1 bg-gray-100 rounded-full py-2 px-4 text-[13px] text-gray-400 flex items-center gap-2">
          <i className="fas fa-search text-gray-300"></i> 热门话题: 极光能源革命
        </div>
        <button onClick={() => setIsPosting(true)} className="text-orange-500 active:scale-95"><i className="fas fa-plus-circle text-2xl"></i></button>
      </div>

      <div className="flex-1 overflow-y-auto" onClick={() => setActiveCommentPostId(null)}>
        {posts.length === 0 && <div className="text-center py-20 text-gray-400 text-sm">暂无新动态</div>}
        {posts.sort((a,b) => b.timestamp - a.timestamp).map(post => {
          const author = post.authorId === 'user' ? null : characters.find(c => c.id === post.authorId);
          return (
            <div key={post.id} className="bg-white mt-2 p-5 first:mt-0 shadow-sm border-b border-gray-50">
              <div className="flex items-center gap-4 mb-4">
                <img src={author?.avatar || 'https://picsum.photos/seed/user/100/100'} className="w-11 h-11 rounded-full border border-gray-100 shadow-sm object-cover" alt="avatar" />
                <div className="flex-1">
                  <div className="font-bold text-[15px] text-gray-900">{author?.name || '我 (已登录)'}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {new Date(post.timestamp).toLocaleDateString()} 来自 智能终端
                  </div>
                </div>
                {!author && <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-bold">我的发布</span>}
              </div>
              <p className="text-[15px] text-gray-800 leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
              
              {post.commentsList && post.commentsList.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-3 mb-4 border border-gray-100">
                  {post.commentsList.map(comment => (
                    <div key={comment.id} className="text-[13px] border-b border-gray-100 last:border-0 pb-2">
                      <span className="font-bold text-[#576b95] cursor-pointer active:opacity-60">{comment.authorName}</span>
                      <span className="text-gray-800 ml-1">: {comment.content}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex border-t border-gray-50 pt-3 mt-4 text-gray-500">
                <button className="flex-1 flex justify-center items-center gap-2 text-xs active:bg-gray-50 py-1 rounded">
                  <i className="far fa-share-square"></i> 分享
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveCommentPostId(post.id); }}
                  className="flex-1 flex justify-center items-center gap-2 text-xs active:bg-gray-50 py-1 rounded"
                >
                  <i className="far fa-comment"></i> {post.commentsList?.length || 0}
                </button>
                <button className="flex-1 flex justify-center items-center gap-2 text-xs active:text-red-500 py-1 rounded group">
                  <i className="far fa-thumbs-up group-active:scale-150 transition-transform"></i> {post.likes}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {activeCommentPostId && (
        <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2 pb-8 flex items-center gap-2 z-50 animate-in slide-in-from-bottom duration-200">
          <input 
            ref={commentInputRef}
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleComment()}
            placeholder="写评论... (微博评论请文明用语)"
            className="flex-1 bg-gray-100 rounded-full py-2 px-4 outline-none text-[14px]"
          />
          <button 
            onClick={handleComment}
            disabled={!commentText.trim()}
            className={`px-4 py-2 font-bold text-[14px] ${commentText.trim() ? 'text-orange-500' : 'text-gray-300'}`}
          >发送</button>
        </div>
      )}
      
      <div className="bg-white border-t border-gray-100 flex justify-around p-3 pb-8 shrink-0">
        <i className="fas fa-home text-2xl text-orange-500"></i>
        <i className="fas fa-play-circle text-2xl text-gray-300"></i>
        <i className="fas fa-search text-2xl text-gray-300"></i>
        <i className="fas fa-envelope text-2xl text-gray-300"></i>
        <i className="fas fa-user text-2xl text-gray-300"></i>
      </div>
    </div>
  );
};

export default WeiboApp;

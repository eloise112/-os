
import React from 'react';
import { SocialPost, Character } from '../types';

interface WeiboAppProps {
  posts: SocialPost[];
  characters: Character[];
  onBack: () => void;
}

const WeiboApp: React.FC<WeiboAppProps> = ({ posts, characters, onBack }) => {
  return (
    <div className="h-full flex flex-col bg-[#f2f2f2] animate-in slide-in-from-right duration-300">
      <div className="bg-white p-4 pt-11 sticky top-0 z-20 flex items-center shadow-sm gap-3 border-b border-gray-100">
        <button onClick={onBack} className="text-orange-500 flex items-center gap-1 active:opacity-50">
          <i className="fas fa-chevron-left"></i>
          <span className="text-sm font-bold">微博</span>
        </button>
        <div className="flex-1 bg-gray-100 rounded-full py-2 px-4 text-[13px] text-gray-400 flex items-center gap-2">
          <i className="fas fa-search text-gray-300"></i> 大家都在搜: 热门话题
        </div>
        <button className="text-gray-600 active:scale-95"><i className="fas fa-plus-circle text-xl"></i></button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {posts.length === 0 && <div className="text-center py-20 text-gray-400 text-sm">暂无新动态</div>}
        {posts.sort((a,b) => b.timestamp - a.timestamp).map(post => {
          const author = characters.find(c => c.id === post.authorId);
          return (
            <div key={post.id} className="bg-white mt-2 p-5 first:mt-0 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <img src={author?.avatar || 'https://picsum.photos/50/50'} className="w-11 h-11 rounded-full border border-gray-100 shadow-sm" alt="avatar" />
                <div className="flex-1">
                  <div className="font-bold text-[15px] text-gray-900">{author?.name || '匿名用户'}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">今天 {new Date(post.timestamp).getHours()}:{new Date(post.timestamp).getMinutes()} 来自 智能终端</div>
                </div>
                <button className="text-[11px] text-orange-500 border border-orange-500 px-3 py-1 rounded-full font-bold active:bg-orange-50">+ 关注</button>
              </div>
              <p className="text-[15px] text-gray-800 leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
              
              <div className="flex border-t border-gray-50 pt-3 mt-4">
                <button className="flex-1 flex justify-center items-center gap-2 text-gray-500 text-xs active:bg-gray-50 py-1 rounded">
                  <i className="far fa-share-square"></i> 分享
                </button>
                <button className="flex-1 flex justify-center items-center gap-2 text-gray-500 text-xs active:bg-gray-50 py-1 rounded">
                  <i className="far fa-comment"></i> {post.comments}
                </button>
                <button className="flex-1 flex justify-center items-center gap-2 text-gray-400 text-xs active:text-red-500 py-1 rounded group">
                  <i className="far fa-thumbs-up group-active:scale-150 transition-transform"></i> {post.likes}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
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


import React from 'react';
import { SocialPost, Character } from '../types';

interface WeiboAppProps {
  posts: SocialPost[];
  characters: Character[];
  onBack: () => void;
}

const WeiboApp: React.FC<WeiboAppProps> = ({ posts, characters, onBack }) => {
  return (
    <div className="h-full flex flex-col bg-gray-100">
      <div className="bg-white p-4 sticky top-0 z-10 flex items-center shadow-sm">
        <button onClick={onBack} className="mr-4 text-red-500"><i className="fas fa-arrow-left"></i></button>
        <div className="flex-1 bg-gray-100 rounded-full py-1 px-4 text-xs text-gray-400 flex items-center gap-2">
          <i className="fas fa-search"></i> 大家都在搜: 角色新动态
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {posts.sort((a,b) => b.timestamp - a.timestamp).map(post => {
          const author = characters.find(c => c.id === post.authorId);
          return (
            <div key={post.id} className="bg-white mt-2 p-4">
              <div className="flex items-center gap-3 mb-3">
                <img src={author?.avatar || 'https://picsum.photos/50/50'} className="w-10 h-10 rounded-full shadow-sm" alt="avatar" />
                <div>
                  <div className="font-bold text-sm text-gray-900">{author?.name || '神秘人'}</div>
                  <div className="text-[10px] text-gray-400">{new Date(post.timestamp).toLocaleString()} 来自 智能终端</div>
                </div>
                <button className="ml-auto text-xs text-orange-500 border border-orange-500 px-2 py-0.5 rounded-full font-medium">+ 关注</button>
              </div>
              <p className="text-sm text-gray-800 leading-relaxed mb-3">{post.content}</p>
              
              <div className="flex border-t mt-2 pt-3">
                <div className="flex-1 flex justify-center items-center gap-1 text-gray-500 text-xs">
                  <i className="far fa-share-square"></i> 分享
                </div>
                <div className="flex-1 flex justify-center items-center gap-1 text-gray-500 text-xs">
                  <i className="far fa-comment"></i> {post.comments}
                </div>
                <div className="flex-1 flex justify-center items-center gap-1 text-red-500 text-xs font-bold">
                  <i className="far fa-thumbs-up"></i> {post.likes}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeiboApp;

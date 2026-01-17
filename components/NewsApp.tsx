
import React from 'react';
import { NewsItem } from '../types';

interface NewsAppProps {
  news: NewsItem[];
  onUpdate: () => void;
  onBack: () => void;
}

const NewsApp: React.FC<NewsAppProps> = ({ news, onUpdate, onBack }) => {
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 bg-orange-500 text-white font-bold flex justify-between items-center">
        <button onClick={onBack}><i className="fas fa-times"></i></button>
        <span>世界新闻中心</span>
        <button onClick={onUpdate} className="bg-white/20 px-3 py-1 rounded text-xs">更新世界线</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {news.length === 0 && <div className="text-center text-gray-400 py-20">今日暂无重大新闻...</div>}
        {news.map(item => (
          <div key={item.id} className="mb-8 border-b border-gray-100 pb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-orange-100 text-orange-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase">{item.category}</span>
              <span className="text-[10px] text-gray-400">{new Date(item.timestamp).toLocaleTimeString()}</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2 leading-snug">{item.title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{item.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsApp;

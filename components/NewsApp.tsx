
import React from 'react';
import { NewsItem } from '../types';

interface NewsAppProps {
  news: NewsItem[];
  onUpdate: () => void;
  onBack: () => void;
}

const NewsApp: React.FC<NewsAppProps> = ({ news, onUpdate, onBack }) => {
  return (
    <div className="h-full flex flex-col bg-white animate-in slide-in-from-right duration-300">
      <div className="p-4 pt-11 bg-black text-white flex justify-between items-center shrink-0 shadow-xl">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-white/10 transition-colors">
          <i className="fas fa-chevron-left text-lg"></i>
        </button>
        <span className="font-black text-xl italic tracking-tighter">THE DAILY NEWS</span>
        <button onClick={onUpdate} className="bg-white text-black px-3 py-1 rounded-full text-[10px] font-black active:scale-95 transition-transform">
          更新快讯
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="border-b-4 border-black pb-2 mb-6 flex justify-between items-end">
          <span className="font-black text-3xl uppercase tracking-tighter">今日头条</span>
          <span className="text-[10px] font-bold text-gray-400">{new Date().toLocaleDateString('zh-CN')}</span>
        </div>
        
        {news.length === 0 && (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <i className="fas fa-newspaper text-5xl text-gray-100"></i>
            <div className="text-gray-400 font-bold">暂无最新战报</div>
          </div>
        )}

        {news.map((item, idx) => (
          <div key={item.id} className="mb-10 group cursor-pointer">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-black text-white text-[9px] px-2 py-0.5 font-black uppercase tracking-widest">{item.category}</span>
              <div className="flex-1 h-[1px] bg-gray-100"></div>
              <span className="text-[10px] font-bold text-gray-400 italic">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-3 leading-tight group-active:text-red-600 transition-colors">{item.title}</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed font-medium">{item.content}</p>
            {idx < news.length - 1 && <div className="mt-8 border-t border-gray-100 border-dashed"></div>}
          </div>
        ))}
      </div>
      
      <div className="bg-black text-white p-3 text-center text-[10px] font-black tracking-widest uppercase opacity-80">
        World State Engine v2.5 Online
      </div>
    </div>
  );
};

export default NewsApp;

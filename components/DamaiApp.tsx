
import React from 'react';
import { Ticket } from '../types';

interface DamaiAppProps {
  tickets: Ticket[];
  balance: number;
  onBuy: (id: string) => void;
  onBack: () => void;
}

const DamaiApp: React.FC<DamaiAppProps> = ({ tickets, balance, onBuy, onBack }) => {
  return (
    <div className="h-full flex flex-col bg-white animate-in slide-in-from-right duration-300">
      <div className="p-4 pt-11 bg-gradient-to-r from-[#ff1268] to-[#ff4d88] text-white flex items-center gap-4 shrink-0 shadow-md">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 active:scale-90 transition-transform">
          <i className="fas fa-chevron-left"></i>
        </button>
        <span className="font-bold text-[18px] flex-1">大麦</span>
        <div className="bg-white/20 px-3 py-1 rounded-full text-[11px] font-bold">
          余额: ¥{balance}
        </div>
      </div>

      <div className="flex p-4 gap-5 overflow-x-auto bg-gray-50 border-b border-gray-100 no-scrollbar">
        {['精选', '演唱会', '话剧', '电影', '体育', '展会'].map((cat, idx) => (
          <span key={cat} className={`whitespace-nowrap text-sm font-medium ${idx === 0 ? 'text-[#ff1268] border-b-2 border-[#ff1268]' : 'text-gray-500'}`}>
            {cat}
          </span>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-7">
        {tickets.map(ticket => (
          <div key={ticket.id} className="flex gap-5 group">
            <div className="relative shrink-0">
              <img src={ticket.image} className="w-28 h-40 rounded-xl object-cover shadow-lg border border-gray-100" alt="poster" />
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[9px] px-1.5 py-0.5 rounded font-bold">大麦专享</div>
            </div>
            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <h4 className="font-extrabold text-[16px] text-gray-900 leading-tight mb-2 group-active:text-[#ff1268] transition-colors">{ticket.title}</h4>
                <div className="text-[12px] text-gray-500 flex items-center gap-2 mb-1.5">
                  <i className="far fa-calendar-alt text-[#ff1268]"></i> {ticket.date}
                </div>
                <div className="text-[11px] text-gray-400 flex items-center gap-2">
                  <i className="fas fa-map-marker-alt"></i> 上海市 | 梅赛德斯-奔驰文化中心
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">价格</span>
                  <span className="text-[#ff1268] font-black text-xl">¥{ticket.price} <span className="text-[11px] font-normal text-gray-400">起</span></span>
                </div>
                <button 
                  onClick={() => !ticket.isPurchased && onBuy(ticket.id)}
                  className={`px-6 py-2 rounded-full text-[13px] font-black tracking-wide shadow-lg transition-all active:scale-95 ${ticket.isPurchased ? 'bg-gray-100 text-gray-400 shadow-none' : 'bg-gradient-to-r from-[#ff1268] to-[#ff4d88] text-white shadow-pink-200'}`}
                >
                  {ticket.isPurchased ? '已购' : '抢票'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DamaiApp;

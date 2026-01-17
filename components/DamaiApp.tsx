
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
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 flex items-center gap-4 bg-gradient-to-r from-red-500 to-pink-600 text-white">
        <button onClick={onBack} className="text-xl"><i className="fas fa-chevron-left"></i></button>
        <span className="font-bold text-lg">大麦</span>
        <div className="ml-auto text-xs opacity-90">我的余额: ¥{balance}</div>
      </div>

      <div className="flex p-4 gap-4 overflow-x-auto bg-gray-50 border-b">
        {['全部', '演唱会', '话剧', '电影', '体育'].map(cat => (
          <span key={cat} className="whitespace-nowrap px-4 py-1 rounded-full bg-white border text-xs font-medium text-gray-600">{cat}</span>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {tickets.map(ticket => (
          <div key={ticket.id} className="flex gap-4 group">
            <img src={ticket.image} className="w-24 h-32 rounded-lg object-cover shadow-md" alt="poster" />
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-gray-900 leading-tight mb-1">{ticket.title}</h4>
                <div className="text-xs text-gray-500 mb-1"><i className="far fa-calendar-alt mr-1"></i> {ticket.date}</div>
                <div className="text-xs text-gray-400"><i className="fas fa-map-marker-alt mr-1"></i> 上海梅赛德斯奔驰中心</div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-red-600 font-bold">¥{ticket.price} <span className="text-[10px] text-gray-400 font-normal">起</span></span>
                <button 
                  onClick={() => !ticket.isPurchased && onBuy(ticket.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${ticket.isPurchased ? 'bg-gray-200 text-gray-500' : 'bg-red-500 text-white shadow-lg active:scale-95'}`}
                >
                  {ticket.isPurchased ? '已购买' : '立即抢票'}
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

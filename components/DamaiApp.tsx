
import React, { useState, useEffect } from 'react';
import { Ticket, Character } from '../types';

interface DamaiAppProps {
  tickets: Ticket[];
  balance: number;
  characters: Character[];
  onBuy: (id: string) => void;
  onInvite: (charId: string, ticket: Ticket) => void;
  onBack: () => void;
}

type DamaiView = 'list' | 'detail' | 'seats' | 'invite_success';

const DamaiApp: React.FC<DamaiAppProps> = ({ tickets, balance, characters, onBuy, onInvite, onBack }) => {
  const [view, setView] = useState<DamaiView>('list');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [grabProgress, setGrabProgress] = useState(0);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const ticket = tickets.find(t => t.id === selectedTicketId) || tickets[0];

  const handleGrab = () => {
    setIsGrabbing(true);
    setGrabProgress(0);
    const interval = setInterval(() => {
      setGrabProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsGrabbing(false);
          setView('seats');
          return 100;
        }
        return p + Math.random() * 20;
      });
    }, 300);
  };

  const toggleSeat = (id: string) => {
    if (selectedSeats.includes(id)) {
      setSelectedSeats(prev => prev.filter(s => s !== id));
    } else if (selectedSeats.length < 2) {
      setSelectedSeats(prev => [...prev, id]);
    }
  };

  const handleConfirmPurchase = () => {
    if (selectedTicketId) {
      onBuy(selectedTicketId);
      setShowInviteModal(true);
    }
  };

  const handleInviteFriend = (charId: string) => {
    if (ticket) {
      onInvite(charId, ticket);
      setShowInviteModal(false);
      setView('invite_success');
      setTimeout(() => setView('list'), 2000);
    }
  };

  if (view === 'detail' && ticket) {
    return (
      <div className="h-full flex flex-col bg-white animate-in slide-in-from-right duration-300">
        <div className="relative h-64 shrink-0">
          <img src={ticket.image} className="w-full h-full object-cover blur-sm opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white"></div>
          <button onClick={() => setView('list')} className="absolute top-11 left-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-white z-10">
            <i className="fas fa-chevron-left"></i>
          </button>
          <div className="absolute top-20 left-1/2 -translate-x-1/2 flex gap-4 w-[90%] items-end">
             <img src={ticket.image} className="w-32 h-44 rounded-xl shadow-2xl object-cover border-2 border-white" />
             <div className="flex-1 pb-2">
                <h2 className="text-xl font-black leading-tight text-gray-900">{ticket.title}</h2>
                <div className="text-pink-600 font-bold mt-2">¥{ticket.price} 起</div>
             </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           <div className="space-y-4">
              <div className="flex items-start gap-3">
                 <i className="far fa-calendar-alt text-gray-400 mt-1"></i>
                 <div>
                    <div className="font-bold text-gray-800">{ticket.date}</div>
                    <div className="text-xs text-gray-400">多个场次可选</div>
                 </div>
              </div>
              <div className="flex items-start gap-3">
                 <i className="fas fa-map-marker-alt text-gray-400 mt-1"></i>
                 <div>
                    <div className="font-bold text-gray-800">梅赛德斯-奔驰文化中心</div>
                    <div className="text-xs text-gray-400">上海市浦东新区世博大道1200号</div>
                 </div>
              </div>
           </div>
           <div className="bg-gray-50 p-4 rounded-xl">
              <div className="font-bold text-sm mb-2">演出介绍</div>
              <p className="text-xs text-gray-500 leading-relaxed">
                本次演出将带来前所未有的视听盛宴，融合了顶尖舞美设计与沉浸式声场。不论是老粉丝还是新听众，都将在这次独特的旅程中找到属于自己的感动。
              </p>
           </div>
        </div>
        <div className="p-4 border-t flex items-center justify-between pb-10">
           <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold">总计</span>
              <span className="text-pink-600 text-xl font-black">¥{ticket.price}</span>
           </div>
           <button 
             disabled={ticket.isPurchased}
             onClick={handleGrab}
             className={`px-12 py-3 rounded-full text-[15px] font-black tracking-widest shadow-xl transition-all ${ticket.isPurchased ? 'bg-gray-100 text-gray-400' : 'bg-gradient-to-r from-[#ff1268] to-[#ff4d88] text-white active:scale-95'}`}
           >
              {isGrabbing ? `抢票中 ${Math.round(grabProgress)}%` : ticket.isPurchased ? '已拥有' : '立即抢票'}
           </button>
        </div>
        {isGrabbing && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
             <div className="bg-white p-8 rounded-3xl w-64 text-center space-y-4">
                <i className="fas fa-bolt text-4xl text-yellow-400 animate-bounce"></i>
                <div className="font-black text-lg">正在排队中...</div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                   <div className="h-full bg-pink-500 transition-all duration-300" style={{ width: `${grabProgress}%` }}></div>
                </div>
                <p className="text-[10px] text-gray-400">前方还有 1,283 人排队，不要离开哦</p>
             </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'seats') {
    return (
      <div className="h-full flex flex-col bg-[#111] text-white animate-in slide-in-from-right duration-300">
        <div className="p-4 pt-11 flex items-center justify-between border-b border-white/10 shrink-0">
          <button onClick={() => setView('detail')} className="text-white/60"><i className="fas fa-chevron-left"></i></button>
          <span className="font-bold">选座</span>
          <div className="w-8"></div>
        </div>
        <div className="flex-1 overflow-hidden p-6 flex flex-col">
           <div className="w-full h-8 bg-white/10 rounded-t-3xl flex items-center justify-center text-[10px] text-white/40 font-bold uppercase tracking-widest mb-12">
              银幕 / 舞台方向
           </div>
           <div className="flex-1 grid grid-cols-8 gap-3 content-center justify-items-center">
              {Array.from({ length: 64 }).map((_, i) => {
                const row = Math.floor(i / 8) + 1;
                const col = (i % 8) + 1;
                const id = `${row}-${col}`;
                const isOccupied = Math.random() < 0.3;
                const isSelected = selectedSeats.includes(id);
                return (
                  <button 
                    key={id}
                    disabled={isOccupied}
                    onClick={() => toggleSeat(id)}
                    className={`w-6 h-6 rounded-md transition-all ${isOccupied ? 'bg-white/5 cursor-not-allowed' : isSelected ? 'bg-[#ff1268] shadow-[0_0_10px_#ff1268]' : 'bg-white/20 active:scale-90'}`}
                  >
                  </button>
                );
              })}
           </div>
           <div className="mt-8 flex justify-around text-[10px] text-white/40 font-bold">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-white/20 rounded-sm"></div> 可选</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-white/5 rounded-sm"></div> 已占</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#ff1268] rounded-sm"></div> 已选</div>
           </div>
        </div>
        <div className="p-6 bg-[#1a1a1a] rounded-t-[3rem] space-y-6 pb-12">
           <div className="flex justify-between items-center">
              <div>
                 <div className="text-xs text-white/40 font-bold">已选座位 ({selectedSeats.length}/2)</div>
                 <div className="flex gap-2 mt-2">
                    {selectedSeats.length === 0 ? <span className="text-white/20 text-sm">请在上方选择座位</span> : selectedSeats.map(s => (
                      <span key={s} className="bg-white/10 px-3 py-1 rounded-lg text-xs">{s.split('-')[0]}排{s.split('-')[1]}座</span>
                    ))}
                 </div>
              </div>
              <div className="text-right">
                 <div className="text-xs text-white/40 font-bold">合计金额</div>
                 <div className="text-xl font-black text-pink-500">¥{ticket.price * selectedSeats.length}</div>
              </div>
           </div>
           <button 
             disabled={selectedSeats.length === 0}
             onClick={handleConfirmPurchase}
             className="w-full bg-[#ff1268] text-white py-4 rounded-full font-black text-lg shadow-2xl shadow-pink-900/40 disabled:opacity-30 active:scale-95 transition-all"
           >
              确认支付并购票
           </button>
        </div>

        {showInviteModal && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-end animate-in fade-in duration-300">
             <div className="w-full bg-white rounded-t-[3rem] p-8 pb-16 space-y-6 animate-in slide-in-from-bottom duration-500">
                <div className="text-center">
                   <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                      <i className="fas fa-check"></i>
                   </div>
                   <h3 className="text-xl font-black text-gray-900">购票成功！</h3>
                   <p className="text-sm text-gray-400 mt-2">票务信息已存入您的票夹。要邀请朋友一起去吗？</p>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                   {characters.map(char => (
                     <button 
                       key={char.id} 
                       onClick={() => handleInviteFriend(char.id)}
                       className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 active:bg-gray-100 transition-colors"
                     >
                        <img src={char.avatar} className="w-12 h-12 rounded-xl object-cover" />
                        <div className="flex-1 text-left">
                           <div className="font-bold text-gray-800">{char.name}</div>
                           <div className="text-[10px] text-gray-400">{char.background.slice(0, 20)}...</div>
                        </div>
                        <i className="fab fa-weixin text-green-500 text-xl"></i>
                     </button>
                   ))}
                </div>
                <button onClick={() => setView('list')} className="w-full py-4 text-gray-400 font-bold text-sm">暂时不邀请，直接返回</button>
             </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'invite_success') {
    return (
      <div className="h-full bg-[#07c160] flex flex-col items-center justify-center text-white p-8 text-center animate-in fade-in duration-500">
         <i className="fab fa-weixin text-7xl mb-6"></i>
         <h2 className="text-2xl font-black">邀请已发出</h2>
         <p className="mt-4 opacity-80 leading-relaxed font-medium">
           已经将演出信息和位置发送给对方，<br/>
           去微信里看看 TA 的回复吧！
         </p>
      </div>
    );
  }

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
        <div className="bg-gray-100 rounded-2xl h-36 flex items-center justify-center text-gray-300 font-black italic relative overflow-hidden group">
           <img src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
           <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-xl z-10 shadow-inner">2025 音乐节季 开启</div>
        </div>

        {tickets.map(ticket => (
          <div key={ticket.id} onClick={() => { setSelectedTicketId(ticket.id); setView('detail'); }} className="flex gap-5 group cursor-pointer active:opacity-70 transition-opacity">
            <div className="relative shrink-0">
              <img src={ticket.image} className="w-28 h-40 rounded-xl object-cover shadow-lg border border-gray-100" alt="poster" />
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[9px] px-1.5 py-0.5 rounded font-bold">大麦专享</div>
              {ticket.isPurchased && <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl"><span className="bg-white text-black font-black text-[10px] px-2 py-1 rounded italic uppercase shadow-xl">已购入</span></div>}
            </div>
            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <h4 className="font-extrabold text-[16px] text-gray-900 leading-tight mb-2 group-hover:text-[#ff1268] transition-colors">{ticket.title}</h4>
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
                <div className="flex items-center gap-2">
                   <button 
                      className={`px-6 py-2 rounded-full text-[13px] font-black tracking-wide shadow-lg transition-all active:scale-95 ${ticket.isPurchased ? 'bg-gray-100 text-gray-400 shadow-none' : 'bg-gradient-to-r from-[#ff1268] to-[#ff4d88] text-white shadow-pink-200'}`}
                    >
                      {ticket.isPurchased ? '已购' : '抢票'}
                    </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DamaiApp;

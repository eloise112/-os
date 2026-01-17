
import React from 'react';
import { AppId } from '../types';

interface AppIconProps {
  id: AppId;
  label: string;
  icon: string;
  gradient: string;
  onClick: (id: AppId) => void;
}

const AppIcon: React.FC<AppIconProps> = ({ id, label, icon, gradient, onClick }) => (
  <button 
    onClick={() => onClick(id)}
    className="flex flex-col items-center gap-1.5 group active:scale-90 transition-all duration-200"
  >
    <div className={`${gradient} w-[62px] h-[62px] rounded-[1.4rem] flex items-center justify-center text-3xl text-white shadow-[0_8px_16px_rgba(0,0,0,0.2)] group-active:shadow-inner overflow-hidden relative`}>
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <i className={icon}></i>
    </div>
    <span className="text-[11px] text-white font-medium drop-shadow-md">{label}</span>
  </button>
);

const HomeScreen: React.FC<{ onOpenApp: (id: AppId) => void, worldDate: string }> = ({ onOpenApp, worldDate }) => {
  return (
    <div className="h-full w-full bg-[url('https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=375&h=812&auto=format&fit=crop')] bg-cover bg-center p-6 pt-16 flex flex-col">
      
      {/* Top Widgets Area */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 glass rounded-3xl p-4 flex flex-col justify-between h-36">
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">世界线状态</span>
          <div className="mt-1">
            <div className="text-2xl font-bold text-white leading-tight">活跃</div>
            <div className="text-[10px] text-white/80">{worldDate}</div>
          </div>
          <div className="w-full bg-white/20 h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-green-400 h-full w-3/4 shadow-[0_0_8px_#4ade80]"></div>
          </div>
        </div>
        <div className="w-36 glass rounded-3xl p-4 flex flex-col items-center justify-center text-center">
          <i className="fas fa-cloud-sun text-3xl text-yellow-300 mb-2"></i>
          <span className="text-xl font-bold text-white">24°</span>
          <span className="text-[10px] text-white/60 font-medium">多云转晴</span>
        </div>
      </div>

      {/* App Grid */}
      <div className="grid grid-cols-4 gap-y-6 gap-x-4">
        <AppIcon id="wechat" label="微信" icon="fab fa-weixin" gradient="bg-gradient-to-br from-[#29d164] to-[#07c160]" onClick={onOpenApp} />
        <AppIcon id="weibo" label="微博" icon="fab fa-weibo" gradient="bg-gradient-to-br from-[#ff8200] to-[#e6162d]" onClick={onOpenApp} />
        <AppIcon id="damai" label="大麦" icon="fas fa-ticket-alt" gradient="bg-gradient-to-br from-[#ff4d88] to-[#ff1268]" onClick={onOpenApp} />
        <AppIcon id="news" label="新闻" icon="fas fa-newspaper" gradient="bg-gradient-to-br from-[#ff9f0a] to-[#ff453a]" onClick={onOpenApp} />
        <AppIcon id="settings" label="设置" icon="fas fa-cog" gradient="bg-gradient-to-br from-[#8e8e93] to-[#48484a]" onClick={onOpenApp} />
      </div>

      {/* Dock Area */}
      <div className="mt-auto mb-6 glass rounded-[2.5rem] p-4 flex justify-around items-center">
        <button className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg">
          <i className="fas fa-phone"></i>
        </button>
        <button className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg">
          <i className="fas fa-envelope"></i>
        </button>
        <button className="w-14 h-14 bg-gradient-to-br from-blue-300 to-blue-400 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg">
          <i className="fab fa-safari"></i>
        </button>
        <button className="w-14 h-14 bg-gradient-to-br from-pink-400 to-purple-600 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg">
          <i className="fas fa-music"></i>
        </button>
      </div>
    </div>
  );
};

export default HomeScreen;

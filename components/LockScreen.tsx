
import React, { useState, useEffect } from 'react';

const LockScreen: React.FC<{ onUnlock: () => void }> = ({ onUnlock }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div 
      onClick={onUnlock}
      className="h-full w-full bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=375&h=812&auto=format&fit=crop')] bg-cover bg-center flex flex-col items-center pt-20 text-white cursor-pointer group"
    >
      <div className="flex flex-col items-center animate-fade-in">
        <i className="fas fa-lock text-sm mb-2 opacity-80"></i>
        <h1 className="text-7xl font-light tracking-tighter">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
        </h1>
        <p className="text-xl font-medium mt-1">
          {time.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </div>

      <div className="mt-auto mb-12 flex flex-col items-center gap-4 animate-bounce">
        <div className="w-12 h-1.5 bg-white/30 rounded-full"></div>
        <p className="text-sm font-medium tracking-wide opacity-70 group-hover:opacity-100 transition-opacity">
          点击或上滑以解锁
        </p>
      </div>
      
      <div className="absolute bottom-10 left-10 w-12 h-12 glass rounded-full flex items-center justify-center">
        <i className="fas fa-flashlight"></i>
      </div>
      <div className="absolute bottom-10 right-10 w-12 h-12 glass rounded-full flex items-center justify-center">
        <i className="fas fa-camera"></i>
      </div>
    </div>
  );
};

export default LockScreen;

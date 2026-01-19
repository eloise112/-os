
import React, { useState } from 'react';
import { Character, WorldState } from '../types';

interface SettingsAppProps {
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  world: WorldState;
  setWorld: React.Dispatch<React.SetStateAction<WorldState>>;
  onBack: () => void;
}

const SettingsApp: React.FC<SettingsAppProps> = ({ characters, setCharacters, world, setWorld, onBack }) => {
  const [activeTab, setActiveTab] = useState<'chars' | 'world'>('chars');

  const updateChar = (id: string, field: keyof Character, value: string) => {
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  return (
    <div className="h-full flex flex-col bg-[#f2f2f7] animate-in slide-in-from-right duration-300">
      <div className="p-4 pt-11 bg-white border-b border-gray-200 flex items-center justify-between shrink-0">
        <button onClick={onBack} className="text-[#007aff] font-medium flex items-center gap-1 active:opacity-50">
          <i className="fas fa-chevron-left"></i> <span>设置</span>
        </button>
        <span className="font-bold text-[17px]">系统设置</span>
        <button onClick={onBack} className="text-[#007aff] font-bold active:opacity-50">完成</button>
      </div>

      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="bg-[#e3e3e8] p-1 rounded-lg flex gap-1">
          <button 
            onClick={() => setActiveTab('chars')}
            className={`flex-1 py-1.5 rounded-md text-[13px] font-bold transition-all ${activeTab === 'chars' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}
          >角色卡包</button>
          <button 
            onClick={() => setActiveTab('world')}
            className={`flex-1 py-1.5 rounded-md text-[13px] font-bold transition-all ${activeTab === 'world' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}
          >世界核心</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTab === 'chars' ? (
          <div className="space-y-6">
            {characters.map(char => (
              <div key={char.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={char.avatar} className="w-14 h-14 rounded-full border-2 border-gray-50 shadow-sm" alt="avatar" />
                    <button className="absolute -bottom-1 -right-1 bg-blue-500 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center border-2 border-white"><i className="fas fa-camera"></i></button>
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest">角色姓名</label>
                    <input 
                      value={char.name} 
                      onChange={e => updateChar(char.id, 'name', e.target.value)}
                      className="font-black text-xl outline-none w-full bg-transparent border-b border-gray-50 focus:border-blue-200 transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-1">人设背景</label>
                    <textarea 
                      value={char.background} 
                      onChange={e => updateChar(char.id, 'background', e.target.value)}
                      className="w-full text-[14px] font-medium border border-gray-100 p-3 rounded-xl bg-gray-50 min-h-[80px] outline-none focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-1">兴趣偏好</label>
                    <input 
                      value={char.preferences} 
                      onChange={e => updateChar(char.id, 'preferences', e.target.value)}
                      className="w-full text-[14px] font-medium border border-gray-100 p-3 rounded-xl bg-gray-50 outline-none focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest">世界观总览</label>
                <i className="fas fa-globe-asia text-blue-500"></i>
              </div>
              <textarea 
                value={world.worldDescription} 
                onChange={e => setWorld(prev => ({ ...prev, worldDescription: e.target.value }))}
                className="w-full text-[14px] font-medium border border-gray-100 p-4 rounded-xl bg-gray-50 min-h-[220px] outline-none focus:ring-1 focus:ring-blue-500/20 leading-relaxed"
                placeholder="描述这个世界的法则、科技水平和社会现状..."
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-sm font-bold text-gray-600">虚构系统时间</span>
              <input 
                value={world.currentDate} 
                onChange={e => setWorld(prev => ({ ...prev, currentDate: e.target.value }))}
                className="bg-transparent text-right text-sm font-bold text-blue-600 outline-none"
              />
            </div>
            <div className="p-4 bg-blue-50 rounded-xl flex gap-3 items-start">
              <i className="fas fa-info-circle text-blue-500 mt-1"></i>
              <p className="text-[11px] text-blue-700 font-medium leading-normal">
                世界观设定将直接影响 Gemini 的回复风格和生成的新闻动态。修改后建议点击“新闻”页面的“更新快讯”以同步最新设定。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsApp;

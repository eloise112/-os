
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
    <div className="h-full flex flex-col bg-gray-50">
      <div className="p-4 bg-white border-b flex items-center justify-between">
        <button onClick={onBack} className="text-blue-500 font-medium">完成</button>
        <span className="font-bold">系统设置</span>
        <div className="w-10"></div>
      </div>

      <div className="flex bg-white p-2 gap-2 border-b">
        <button 
          onClick={() => setActiveTab('chars')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === 'chars' ? 'bg-blue-500 text-white' : 'text-gray-500'}`}
        >角色卡</button>
        <button 
          onClick={() => setActiveTab('world')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === 'world' ? 'bg-blue-500 text-white' : 'text-gray-500'}`}
        >世界观</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'chars' ? (
          <div className="space-y-6">
            {characters.map(char => (
              <div key={char.id} className="bg-white p-4 rounded-xl shadow-sm space-y-3">
                <div className="flex items-center gap-3 border-b pb-3 mb-3">
                  <img src={char.avatar} className="w-10 h-10 rounded-full" alt="avatar" />
                  <input 
                    value={char.name} 
                    onChange={e => updateChar(char.id, 'name', e.target.value)}
                    className="font-bold text-lg outline-none w-full"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block uppercase font-bold">背景设定</label>
                  <textarea 
                    value={char.background} 
                    onChange={e => updateChar(char.id, 'background', e.target.value)}
                    className="w-full text-sm border p-2 rounded mt-1 bg-gray-50 min-h-[60px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block uppercase font-bold">性格偏好</label>
                  <input 
                    value={char.preferences} 
                    onChange={e => updateChar(char.id, 'preferences', e.target.value)}
                    className="w-full text-sm border p-2 rounded mt-1 bg-gray-50"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
            <div>
              <label className="text-[10px] text-gray-400 block uppercase font-bold">世界观描述</label>
              <textarea 
                value={world.worldDescription} 
                onChange={e => setWorld(prev => ({ ...prev, worldDescription: e.target.value }))}
                className="w-full text-sm border p-2 rounded mt-1 bg-gray-50 min-h-[200px]"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block uppercase font-bold">虚拟日期</label>
              <input 
                value={world.currentDate} 
                onChange={e => setWorld(prev => ({ ...prev, currentDate: e.target.value }))}
                className="w-full text-sm border p-2 rounded mt-1 bg-gray-50"
              />
            </div>
            <p className="text-[10px] text-gray-400 italic">设置将实时保存到本地浏览器缓存。</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsApp;

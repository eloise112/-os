
import React, { useState } from 'react';
import { Character, WorldState, ApiConfig } from '../types';

interface SettingsAppProps {
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  world: WorldState;
  setWorld: React.Dispatch<React.SetStateAction<WorldState>>;
  apiConfig: ApiConfig;
  setApiConfig: React.Dispatch<React.SetStateAction<ApiConfig>>;
  onBack: () => void;
}

const ToggleSwitch: React.FC<{ 
  isOn: boolean, 
  onToggle: () => void, 
  label: string, 
  icon: string 
}> = ({ isOn, onToggle, label, icon }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isOn ? 'bg-blue-50 text-blue-500' : 'bg-gray-50 text-gray-400'}`}>
        <i className={icon}></i>
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </div>
    <button 
      onClick={onToggle}
      className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${isOn ? 'bg-[#34c759]' : 'bg-[#e9e9ea]'}`}
    >
      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${isOn ? 'translate-x-5' : 'translate-x-0'}`}></div>
    </button>
  </div>
);

const SettingsApp: React.FC<SettingsAppProps> = ({ 
  characters, 
  setCharacters, 
  world, 
  setWorld, 
  apiConfig, 
  setApiConfig, 
  onBack 
}) => {
  const [activeTab, setActiveTab] = useState<'chars' | 'world' | 'api'>('chars');
  const [localApiConfig, setLocalApiConfig] = useState<ApiConfig>(apiConfig);

  const updateChar = (id: string, field: keyof Character, value: any) => {
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSaveApi = () => {
    setApiConfig(localApiConfig);
    alert('API 配置已保存');
  };

  const models = [
    { label: 'Gemini 3 Pro (推荐)', value: 'gemini-3-pro-preview' },
    { label: 'Gemini 3 Flash (极速)', value: 'gemini-3-flash-preview' },
    { label: 'GLM-4-Flash (智谱)', value: 'glm-4-flash' },
    { label: 'DeepSeek-R1-0528', value: 'deepseek-r1-0528' }
  ];

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
          <button 
            onClick={() => setActiveTab('api')}
            className={`flex-1 py-1.5 rounded-md text-[13px] font-bold transition-all ${activeTab === 'api' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}
          >API配置</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTab === 'chars' && (
          <div className="space-y-6">
            {characters.map(char => (
              <div key={char.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={char.avatar} className="w-14 h-14 rounded-full border-2 border-gray-50 shadow-sm object-cover" alt="avatar" />
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
                </div>

                <div className="pt-2 border-t border-gray-50">
                   <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-2">感知设置 (Perception)</label>
                   <div className="space-y-1">
                      <ToggleSwitch 
                        isOn={!!char.perceiveWorldNews} 
                        onToggle={() => updateChar(char.id, 'perceiveWorldNews', !char.perceiveWorldNews)}
                        label="知晓世界动态"
                        icon="fas fa-globe-asia"
                      />
                      <ToggleSwitch 
                        isOn={!!char.perceiveSocialMedia} 
                        onToggle={() => updateChar(char.id, 'perceiveSocialMedia', !char.perceiveSocialMedia)}
                        label="知晓朋友圈动态"
                        icon="fas fa-camera-retro"
                      />
                      <ToggleSwitch 
                        isOn={!!char.perceiveUserPersona} 
                        onToggle={() => updateChar(char.id, 'perceiveUserPersona', !char.perceiveUserPersona)}
                        label="知晓我的背景设定"
                        icon="fas fa-user-secret"
                      />
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'world' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-5">
              <div>
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-2">世界观总览</label>
                <textarea 
                  value={world.worldDescription} 
                  onChange={e => setWorld(prev => ({ ...prev, worldDescription: e.target.value }))}
                  className="w-full text-[14px] font-medium border border-gray-100 p-4 rounded-xl bg-gray-50 min-h-[180px] outline-none focus:ring-1 focus:ring-blue-500/20 leading-relaxed"
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
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-2">互动设置 (Interaction)</label>
              <ToggleSwitch 
                isOn={world.enableMomentsInteraction} 
                onToggle={() => setWorld(prev => ({ ...prev, enableMomentsInteraction: !prev.enableMomentsInteraction }))}
                label="开启朋友圈 AI 互动"
                icon="fas fa-comments"
              />
              <div className="flex items-center justify-between py-2 border-t border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
                    <i className="fas fa-reply-all"></i>
                  </div>
                  <span className="text-sm font-medium text-gray-700">单帖回复上限</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={world.maxMomentReplies} 
                    onChange={e => setWorld(prev => ({ ...prev, maxMomentReplies: parseInt(e.target.value) || 1 }))}
                    className="w-12 bg-gray-100 text-center rounded py-1 text-sm font-bold outline-none"
                  />
                  <span className="text-xs text-gray-400">条</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-6 pb-20">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <i className="fas fa-comment-dots text-green-500"></i>
                <h3 className="font-bold text-[15px]">聊天 API 配置</h3>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-1">切换模型</label>
                <select 
                  value={localApiConfig.chat.model}
                  onChange={e => setLocalApiConfig(prev => ({ ...prev, chat: { ...prev.chat, model: e.target.value } }))}
                  className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm font-medium outline-none focus:ring-1 focus:ring-green-500/20"
                >
                  {models.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <i className="fas fa-globe text-blue-500"></i>
                <h3 className="font-bold text-[15px]">世界线 API 配置</h3>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-1">切换模型</label>
                <select 
                  value={localApiConfig.world.model}
                  onChange={e => setLocalApiConfig(prev => ({ ...prev, world: { ...prev.world, model: e.target.value } }))}
                  className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm font-medium outline-none focus:ring-1 focus:ring-blue-500/20"
                >
                  {models.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>

            <button 
              onClick={handleSaveApi}
              className="w-full bg-[#007aff] text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all"
            >
              保存 API 配置
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsApp;

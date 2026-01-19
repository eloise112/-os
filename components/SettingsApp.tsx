
import React, { useState } from 'react';
import { Character, WorldState, ApiConfig, ApiSettings } from '../types';

interface SettingsAppProps {
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  world: WorldState;
  setWorld: React.Dispatch<React.SetStateAction<WorldState>>;
  apiConfig: ApiConfig;
  setApiConfig: React.Dispatch<React.SetStateAction<ApiConfig>>;
  onRefreshNews: () => Promise<void>;
  onRefreshHot: () => Promise<void>;
  onRefreshMoments: () => Promise<void>;
  onRefreshWeibo: () => Promise<void>;
  onBack: () => void;
}

const SUPPORTED_MODELS = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (推荐对话)', provider: 'Google' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (推荐世界)', provider: 'Google' },
  { id: 'glm-4-flash', name: 'GLM-4 Flash', provider: 'Zhipu AI' },
  { id: 'deepseek-r1-0528', name: 'DeepSeek R1', provider: 'DeepSeek' },
];

const SettingsApp: React.FC<SettingsAppProps> = ({ 
  characters, setCharacters, world, setWorld, apiConfig, setApiConfig, 
  onRefreshNews, onRefreshHot, onRefreshMoments, onRefreshWeibo, onBack 
}) => {
  const [activeTab, setActiveTab] = useState<'chars' | 'world' | 'api'>('chars');
  const [loading, setLoading] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const handleRefresh = async (type: string, fn: () => Promise<void>) => {
    setLoading(type);
    try { await fn(); } catch (e) { alert("更新失败，请检查网络或API配置"); }
    setLoading(null);
  };

  const updateApiSetting = (category: 'chat' | 'world', field: keyof ApiSettings, value: string) => {
    setApiConfig(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const updateProviderKey = (provider: keyof ApiConfig['providerKeys'], value: string) => {
    setApiConfig(prev => ({
      ...prev,
      providerKeys: {
        ...prev.providerKeys,
        [provider]: value
      }
    }));
  };

  const toggleKeyVisibility = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="h-full flex flex-col bg-[#f2f2f7] animate-in slide-in-from-right duration-300">
      <div className="p-4 pt-11 bg-white border-b flex items-center justify-between shrink-0">
        <button onClick={onBack} className="text-[#007aff] font-medium">返回</button>
        <span className="font-bold text-[17px]">系统设置</span>
        <button onClick={onBack} className="text-[#007aff] font-bold">完成</button>
      </div>

      <div className="px-4 py-3 bg-white border-b">
        <div className="bg-[#e3e3e8] p-1 rounded-lg flex gap-1">
          <button onClick={() => setActiveTab('chars')} className={`flex-1 py-1.5 rounded-md text-[13px] font-bold transition-all ${activeTab === 'chars' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}>角色卡</button>
          <button onClick={() => setActiveTab('world')} className={`flex-1 py-1.5 rounded-md text-[13px] font-bold transition-all ${activeTab === 'world' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}>世界核心</button>
          <button onClick={() => setActiveTab('api')} className={`flex-1 py-1.5 rounded-md text-[13px] font-bold transition-all ${activeTab === 'api' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}>API设置</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTab === 'world' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
              <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest block">手动触发更新</label>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleRefresh('news', onRefreshNews)} disabled={!!loading} className="bg-gray-50 p-4 rounded-xl flex flex-col items-center gap-2 active:scale-95 transition-all disabled:opacity-50">
                   <i className={`fas fa-newspaper text-red-500 ${loading === 'news' ? 'animate-pulse' : ''}`}></i>
                   <span className="text-[11px] font-bold text-gray-600">刷新新闻</span>
                </button>
                <button onClick={() => handleRefresh('hot', onRefreshHot)} disabled={!!loading} className="bg-gray-50 p-4 rounded-xl flex flex-col items-center gap-2 active:scale-95 transition-all disabled:opacity-50">
                   <i className={`fas fa-fire text-orange-500 ${loading === 'hot' ? 'animate-pulse' : ''}`}></i>
                   <span className="text-[11px] font-bold text-gray-600">刷新热搜</span>
                </button>
                <button onClick={() => handleRefresh('moments', onRefreshMoments)} disabled={!!loading} className="bg-gray-50 p-4 rounded-xl flex flex-col items-center gap-2 active:scale-95 transition-all disabled:opacity-50">
                   <i className={`fas fa-camera text-green-500 ${loading === 'moments' ? 'animate-pulse' : ''}`}></i>
                   <span className="text-[11px] font-bold text-gray-600">刷新朋友圈</span>
                </button>
                <button onClick={() => handleRefresh('weibo', onRefreshWeibo)} disabled={!!loading} className="bg-gray-50 p-4 rounded-xl flex flex-col items-center gap-2 active:scale-95 transition-all disabled:opacity-50">
                   <i className={`fab fa-weibo text-blue-500 ${loading === 'weibo' ? 'animate-pulse' : ''}`}></i>
                   <span className="text-[11px] font-bold text-gray-600">刷新微博</span>
                </button>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
              <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest block">基础世界观描述</label>
              <textarea 
                value={world.worldDescription} 
                onChange={e => setWorld(prev => ({ ...prev, worldDescription: e.target.value }))}
                placeholder="在此输入世界设定，影响所有生成的动态..."
                className="w-full text-[14px] border p-3 rounded-xl bg-gray-50 min-h-[150px] outline-none leading-relaxed focus:border-blue-300 transition-colors"
              />
            </div>
          </div>
        )}

        {activeTab === 'chars' && (
          <div className="space-y-4">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest block ml-1">当前存活角色</label>
            {characters.map(char => (
              <div key={char.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 active:bg-gray-50 transition-colors">
                 <img src={char.avatar} className="w-12 h-12 rounded-full object-cover border border-gray-100" />
                 <div className="flex-1">
                    <div className="font-bold text-[15px]">{char.name}</div>
                    <div className="text-[11px] text-gray-400 truncate max-w-[200px]">{char.background}</div>
                 </div>
                 <i className="fas fa-chevron-right text-gray-300"></i>
              </div>
            ))}
            <button className="w-full bg-white p-4 rounded-xl shadow-sm text-blue-500 font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
              <i className="fas fa-plus-circle"></i> 创建新角色
            </button>
          </div>
        )}

        {activeTab === 'api' && (
           <div className="space-y-6">
              {/* Central Key Vault Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                    <i className="fas fa-key"></i>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-[14px]">API 密钥库</h3>
                    <p className="text-white/60 text-[10px] uppercase tracking-wider font-bold">密钥集中管理</p>
                  </div>
                </div>
                <div className="p-5 space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-gray-500">Zhipu AI (GLM)</label>
                      <button onClick={() => toggleKeyVisibility('zhipu')} className="text-[10px] text-blue-500 font-bold">
                        {showKeys['zhipu'] ? '隐藏' : '显示'}
                      </button>
                    </div>
                    <input 
                      type={showKeys['zhipu'] ? 'text' : 'password'}
                      value={apiConfig.providerKeys.zhipu || ''}
                      onChange={e => updateProviderKey('zhipu', e.target.value)}
                      placeholder="输入智谱 AI API Key"
                      className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm outline-none focus:border-blue-300 transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-gray-500">DeepSeek</label>
                      <button onClick={() => toggleKeyVisibility('deepseek')} className="text-[10px] text-blue-500 font-bold">
                        {showKeys['deepseek'] ? '隐藏' : '显示'}
                      </button>
                    </div>
                    <input 
                      type={showKeys['deepseek'] ? 'text' : 'password'}
                      value={apiConfig.providerKeys.deepseek || ''}
                      onChange={e => updateProviderKey('deepseek', e.target.value)}
                      placeholder="输入 DeepSeek API Key"
                      className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm outline-none focus:border-blue-300 transition-all font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 italic bg-gray-50 p-2 rounded-lg border border-dashed border-gray-200">
                    * 在此填入密钥后，选用对应模型时将自动应用。
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm space-y-5 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fas fa-robot text-blue-500"></i>
                  <label className="text-[12px] font-black text-gray-800 uppercase tracking-wide">对话模型配置</label>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] text-gray-400 mb-1 block">选择模型</label>
                    <select 
                      value={apiConfig.chat.model}
                      onChange={e => updateApiSetting('chat', 'model', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm outline-none focus:border-blue-300"
                    >
                      {SUPPORTED_MODELS.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm space-y-5 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fas fa-globe-asia text-green-500"></i>
                  <label className="text-[12px] font-black text-gray-800 uppercase tracking-wide">世界生成配置</label>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] text-gray-400 mb-1 block">选择模型</label>
                    <select 
                      value={apiConfig.world.model}
                      onChange={e => updateApiSetting('world', 'model', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm outline-none focus:border-blue-300"
                    >
                      {SUPPORTED_MODELS.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-2">
                <p className="text-[10px] text-gray-400 leading-relaxed italic">
                  * Gemini 模型将自动使用系统内置 API Key。<br/>
                  * 密钥库中的密钥优先级低于单项配置（如有）。<br/>
                  * 建议：对话使用 Pro 模型，日常生成使用 Flash 模型。
                </p>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default SettingsApp;

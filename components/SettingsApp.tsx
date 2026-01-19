
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
  onRefreshTickets: () => Promise<void>;
  loadingStep: string;
  onBack: () => void;
}

const SUPPORTED_MODELS = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (推荐对话)', provider: 'Google' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (推荐世界)', provider: 'Google' },
  { id: 'glm-4-flash', name: 'GLM-4 Flash', provider: 'Zhipu AI' },
  { id: 'deepseek-r1-0528', name: 'DeepSeek R1', provider: 'DeepSeek' },
];

const ToggleSwitch: React.FC<{ isOn: boolean, onToggle: () => void, label: string, icon: string, color?: string }> = ({ isOn, onToggle, label, icon, color = 'bg-blue-500' }) => (
  <div className="flex items-center justify-between py-2 px-1">
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isOn ? 'bg-opacity-10 ' + color.replace('bg-', 'text-') : 'bg-gray-50 text-gray-400'}`}>
        <i className={icon}></i>
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </div>
    <button onClick={onToggle} className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${isOn ? color : 'bg-[#e9e9ea]'}`}>
      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${isOn ? 'translate-x-5' : 'translate-x-0'}`}></div>
    </button>
  </div>
);

const FrequencySelector: React.FC<{ value: Character['momentsFrequency'], onChange: (v: Character['momentsFrequency']) => void, label: string }> = ({ value = 'none', onChange, label }) => {
  const options: { id: Character['momentsFrequency'], label: string }[] = [
    { id: 'none', label: '永不' },
    { id: 'low', label: '偶尔' },
    { id: 'medium', label: '经常' },
    { id: 'high', label: '话痨' }
  ];

  return (
    <div className="py-2">
      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-2">{label}</label>
      <div className="flex bg-gray-100 p-1 rounded-xl">
        {options.map(opt => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${value === opt.id ? 'bg-white shadow-sm text-blue-500' : 'text-gray-500'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const SettingsApp: React.FC<SettingsAppProps> = ({ 
  characters, setCharacters, world, setWorld, apiConfig, setApiConfig, 
  onRefreshNews, onRefreshHot, onRefreshMoments, onRefreshWeibo, onRefreshTickets, loadingStep, onBack 
}) => {
  const [activeTab, setActiveTab] = useState<'chars' | 'world' | 'api'>('chars');
  const [internalLoading, setInternalLoading] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [editingChar, setEditingChar] = useState<Partial<Character> | null>(null);

  const handleRefreshAction = async (type: string, fn: () => Promise<void>) => {
    setInternalLoading(type);
    try { await fn(); } catch (e) { alert("更新失败，请检查网络或API配置"); }
    setInternalLoading(null);
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

  const handleStartEdit = (char: Character) => {
    setEditingChar({ ...char });
  };

  const handleStartCreate = () => {
    setEditingChar({
      id: `char-${Date.now()}`,
      name: '',
      avatar: `https://picsum.photos/seed/${Date.now()}/200/200`,
      background: '',
      preferences: '',
      storyline: '',
      perceiveWorldNews: true,
      perceiveSocialMedia: true,
      perceiveUserPersona: true,
      momentsFrequency: 'medium',
      weiboFrequency: 'low',
      proactiveTicketing: false
    });
  };

  const handleSaveChar = () => {
    if (!editingChar || !editingChar.name) return;
    
    setCharacters(prev => {
      const exists = prev.find(c => c.id === editingChar.id);
      if (exists) {
        return prev.map(c => c.id === editingChar.id ? (editingChar as Character) : c);
      } else {
        return [...prev, editingChar as Character];
      }
    });
    setEditingChar(null);
  };

  const handleDeleteChar = (id: string) => {
    if (confirm('确定要删除这个角色吗？相关的聊天记录将无法找回。')) {
      setCharacters(prev => prev.filter(c => c.id !== id));
      setEditingChar(null);
    }
  };

  if (editingChar) {
    return (
      <div className="h-full flex flex-col bg-[#f2f2f7] animate-in slide-in-from-bottom duration-300">
        <div className="p-4 pt-11 bg-white border-b flex items-center justify-between shrink-0">
          <button onClick={() => setEditingChar(null)} className="text-[#007aff] font-medium">取消</button>
          <span className="font-bold text-[17px]">{characters.find(c => c.id === editingChar.id) ? '编辑角色' : '创建角色'}</span>
          <button onClick={handleSaveChar} className="text-[#007aff] font-bold disabled:opacity-30" disabled={!editingChar.name}>保存</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col items-center gap-4">
            <div className="relative group">
              <img src={editingChar.avatar} className="w-24 h-24 rounded-2xl object-cover shadow-md border-2 border-white" alt="avatar" />
              <button 
                onClick={() => setEditingChar({ ...editingChar, avatar: `https://picsum.photos/seed/${Date.now()}/200/200` })}
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
              >
                <i className="fas fa-sync-alt text-xs"></i>
              </button>
            </div>
            <div className="w-full space-y-2">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block ml-1">头像 URL</label>
              <input 
                type="text" 
                value={editingChar.avatar} 
                onChange={e => setEditingChar({ ...editingChar, avatar: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs outline-none focus:border-blue-300 font-mono"
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block ml-1">角色姓名</label>
              <input 
                type="text" 
                value={editingChar.name} 
                onChange={e => setEditingChar({ ...editingChar, name: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm font-bold outline-none focus:border-blue-300"
                placeholder="例如: 沈逸"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block ml-1">身份背景</label>
              <textarea 
                value={editingChar.background} 
                onChange={e => setEditingChar({ ...editingChar, background: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm outline-none focus:border-blue-300 min-h-[80px]"
                placeholder="描述角色的社会地位、性格、往事..."
              />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block ml-1">行为偏好 (Behavior)</label>
            <FrequencySelector 
              label="朋友圈发布频率" 
              value={editingChar.momentsFrequency} 
              onChange={v => setEditingChar({ ...editingChar, momentsFrequency: v })} 
            />
            <FrequencySelector 
              label="微博发布频率" 
              value={editingChar.weiboFrequency} 
              onChange={v => setEditingChar({ ...editingChar, weiboFrequency: v })} 
            />
          </div>
        </div>
      </div>
    );
  }

  const isLoading = !!internalLoading || !!loadingStep;

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
              <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest block">分步手动触发更新</label>
              
              {isLoading && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                  <i className="fas fa-circle-notch animate-spin text-blue-500"></i>
                  <div className="text-xs font-bold text-blue-700">{loadingStep || '正在处理中...'}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleRefreshAction('news', onRefreshNews)} disabled={isLoading} className="bg-gray-50 p-4 rounded-xl flex flex-col items-center gap-2 active:scale-95 transition-all disabled:opacity-50">
                   <i className={`fas fa-newspaper text-red-500`}></i>
                   <span className="text-[11px] font-bold text-gray-600">分步刷新新闻</span>
                </button>
                <button onClick={() => handleRefreshAction('tickets', onRefreshTickets)} disabled={isLoading} className="bg-gray-50 p-4 rounded-xl flex flex-col items-center gap-2 active:scale-95 transition-all disabled:opacity-50">
                   <i className={`fas fa-ticket-alt text-pink-500`}></i>
                   <span className="text-[11px] font-bold text-gray-600">分步刷新票务</span>
                </button>
                <button onClick={() => handleRefreshAction('weibo', onRefreshWeibo)} disabled={isLoading} className="bg-gray-50 p-4 rounded-xl flex flex-col items-center gap-2 active:scale-95 transition-all disabled:opacity-50 col-span-2">
                   <i className={`fab fa-weibo text-orange-500`}></i>
                   <span className="text-[11px] font-bold text-gray-600">全面刷新微博 (3阶段)</span>
                </button>
                <button onClick={() => handleRefreshAction('moments', onRefreshMoments)} disabled={isLoading} className="bg-gray-50 p-4 rounded-xl flex flex-col items-center gap-2 active:scale-95 transition-all disabled:opacity-50 col-span-2">
                   <i className={`fas fa-camera text-green-500`}></i>
                   <span className="text-[11px] font-bold text-gray-600">刷新朋友圈</span>
                </button>
              </div>
              <p className="text-[9px] text-gray-400 px-1 leading-relaxed italic">* 为了模拟真实更新感，每阶段更新后会停顿 15 秒，请耐心等待。</p>
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
            <div className="flex justify-between items-center ml-1">
              <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest block">当前存活角色</label>
              <span className="text-[10px] text-gray-300 font-bold">{characters.length} 个角色</span>
            </div>
            {characters.map(char => (
              <div 
                key={char.id} 
                onClick={() => handleStartEdit(char)}
                className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 active:bg-gray-100 transition-colors cursor-pointer group"
              >
                 <img src={char.avatar} className="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-sm" alt={char.name} />
                 <div className="flex-1">
                    <div className="font-bold text-[15px] group-hover:text-[#007aff] transition-colors">{char.name}</div>
                    <div className="text-[11px] text-gray-400 truncate max-w-[200px]">{char.background || '暂无背景描述'}</div>
                 </div>
                 <i className="fas fa-chevron-right text-gray-300 text-xs"></i>
              </div>
            ))}
            <button 
              onClick={handleStartCreate}
              className="w-full bg-white p-4 rounded-xl shadow-sm text-[#007aff] font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all border border-dashed border-blue-100 mt-2"
            >
              <i className="fas fa-plus-circle"></i> 创建新角色卡
            </button>
          </div>
        )}

        {activeTab === 'api' && (
           <div className="space-y-6">
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
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm space-y-5 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fas fa-robot text-blue-500"></i>
                  <label className="text-[12px] font-black text-gray-800 uppercase tracking-wide">对话模型配置</label>
                </div>
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

              <div className="bg-white p-5 rounded-2xl shadow-sm space-y-5 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fas fa-globe-asia text-green-500"></i>
                  <label className="text-[12px] font-black text-gray-800 uppercase tracking-wide">世界生成配置</label>
                </div>
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
        )}
      </div>
    </div>
  );
};

export default SettingsApp;

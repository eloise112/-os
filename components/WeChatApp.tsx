
import React, { useState } from 'react';
import { Character, ChatSession, Message } from '../types';

interface WeChatAppProps {
  chats: Record<string, ChatSession>;
  characters: Character[];
  balance: number;
  onSendMessage: (charId: string, text: string, type?: Message['type'], amount?: number) => void;
  onBack: () => void;
}

const WeChatApp: React.FC<WeChatAppProps> = ({ chats, characters, onSendMessage, onBack, balance }) => {
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferAmount, setTransferAmount] = useState('100');

  const selectedChar = characters.find(c => c.id === selectedCharId);
  const session = selectedCharId ? chats[selectedCharId] : null;

  if (selectedCharId && selectedChar) {
    return (
      <div className="h-full flex flex-col bg-[#ededed]">
        <div className="p-4 bg-[#ededed] border-b flex items-center">
          <button onClick={() => setSelectedCharId(null)} className="mr-4 text-xl">
            <i className="fas fa-chevron-left text-gray-600"></i>
          </button>
          <span className="font-bold flex-1 text-center">{selectedChar.name}</span>
          <i className="fas fa-ellipsis-h text-gray-500"></i>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {session?.messages.map(m => {
            const isUser = m.senderId === 'user';
            return (
              <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <img src={isUser ? 'https://picsum.photos/seed/user/50/50' : selectedChar.avatar} className="w-10 h-10 rounded shadow-sm" alt="avatar" />
                  <div className={`mx-2 p-2.5 rounded-lg text-sm shadow-sm ${isUser ? 'bg-[#95ec69] text-black' : 'bg-white text-black'} relative`}>
                    {m.type === 'transfer' ? (
                      <div className="bg-orange-500 text-white p-3 rounded-md w-48">
                        <div className="flex items-center gap-3">
                          <i className="fas fa-hand-holding-usd text-2xl"></i>
                          <div>
                            <div className="font-bold">¥{m.amount}</div>
                            <div className="text-xs opacity-80">转账给{selectedChar.name}</div>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/20 text-[10px]">微信转账</div>
                      </div>
                    ) : (
                      m.text
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 bg-[#f7f7f7] border-t flex items-center gap-2">
          <button onClick={() => setShowTransfer(!showTransfer)} className="text-2xl text-gray-600">
            <i className="far fa-plus-square"></i>
          </button>
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && (onSendMessage(selectedCharId, input), setInput(''))}
            className="flex-1 bg-white rounded-md p-2 outline-none text-sm border"
            placeholder="发送消息..."
          />
          <button onClick={() => (onSendMessage(selectedCharId, input), setInput(''))} className="bg-[#07c160] text-white px-4 py-1.5 rounded text-sm font-medium">发送</button>
        </div>

        {showTransfer && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-6 z-[100]">
            <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl">
              <h3 className="text-center font-bold mb-4">虚拟转账</h3>
              <p className="text-xs text-gray-500 mb-2">当前余额: ¥{balance}</p>
              <input 
                type="number"
                value={transferAmount}
                onChange={e => setTransferAmount(e.target.value)}
                className="w-full border p-3 rounded-lg mb-4 text-center text-2xl font-bold"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowTransfer(false)} className="flex-1 bg-gray-200 p-2 rounded-lg">取消</button>
                <button 
                  onClick={() => {
                    onSendMessage(selectedCharId, '转账', 'transfer', Number(transferAmount));
                    setShowTransfer(false);
                  }}
                  className="flex-1 bg-orange-500 text-white p-2 rounded-lg font-bold"
                >确认转账</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 flex justify-between items-center border-b">
        <button onClick={onBack} className="text-green-500 font-medium">关闭</button>
        <span className="font-bold">微信</span>
        <i className="fas fa-plus text-lg"></i>
      </div>
      <div className="flex-1 overflow-y-auto">
        {characters.map(char => {
          const lastMsg = chats[char.id]?.messages.slice(-1)[0];
          return (
            <button 
              key={char.id} 
              onClick={() => setSelectedCharId(char.id)}
              className="w-full flex items-center p-4 gap-3 active:bg-gray-50 border-b border-gray-100"
            >
              <img src={char.avatar} className="w-12 h-12 rounded-lg shadow-sm" alt="avatar" />
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900">{char.name}</div>
                <div className="text-xs text-gray-500 truncate max-w-[200px]">
                  {lastMsg ? lastMsg.text : char.background}
                </div>
              </div>
              {chats[char.id]?.lastMessageAt && (
                <div className="text-[10px] text-gray-400">
                  {new Date(chats[char.id].lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WeChatApp;

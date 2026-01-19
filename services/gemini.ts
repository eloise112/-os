
import { GoogleGenAI, Type } from "@google/genai";
import { Character, Message, UserProfile, ApiSettings, SocialPost, ApiConfig } from "../types";

export interface ResponseSegment {
  type: 'speech' | 'action';
  text: string;
}

// Generic request handler for non-Gemini models (OpenAI compatible)
const callExternalProvider = async (settings: ApiSettings, providerKeys: ApiConfig['providerKeys'], systemPrompt: string, userPrompt: string) => {
  const urlMap: Record<string, string> = {
    'glm-4-flash': 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    'deepseek-r1-0528': 'https://api.deepseek.com/chat/completions'
  };

  const endpoint = urlMap[settings.model];
  if (!endpoint) throw new Error("Unsupported provider");

  let apiKey = settings.apiKey;
  if (!apiKey) {
    if (settings.model.includes('glm')) apiKey = providerKeys.zhipu || '';
    if (settings.model.includes('deepseek')) apiKey = providerKeys.deepseek || '';
  }

  if (!apiKey) throw new Error("API Key is missing for " + settings.model);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: settings.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' }
    })
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content;
};

// Character Chat Logic
export const generateCharacterResponse = async (
  character: Character,
  history: Message[],
  worldPrompt: string,
  userMessage: string,
  userProfile: UserProfile,
  apiSettings: ApiSettings,
  providerKeys: ApiConfig['providerKeys']
): Promise<ResponseSegment[]> => {
  const contextHistory = history.slice(-20).map(m => 
    `${m.senderId === 'user' ? userProfile.name : character.name}: ${m.text}`
  ).join('\n');

  const worldAwareness = character.perceiveWorldNews 
    ? `世界观设定: ${worldPrompt}` 
    : `世界观设定: (角色对宏观世界局势知之甚少)`;

  const personaAwareness = character.perceiveUserPersona 
    ? `你正在与之对话的用户信息:
    姓名: ${userProfile.name}
    用户人设/背景: ${userProfile.persona}`
    : `你正在与之对话的用户信息:
    姓名: ${userProfile.name}
    (你对该用户的详细背景和秘密身份一无所知，仅知道对方的名字)`;

  const systemPrompt = `
    你现在扮演一名角色。
    角色名: ${character.name}
    角色背景: ${character.background}
    角色偏好: ${character.preferences}
    当前剧情: ${character.storyline}
    ${worldAwareness}
    ${personaAwareness}
    你的回复应该是口语化的、符合角色性格的。
    不要以AI的身份说话。保持人设。

    **结构化输出指令**:
    输出必须是一个 JSON 对象，包含一个名为 "segments" 的数组。
    每个元素包含 "type" ("speech" 或 "action") 和 "text"。
  `;

  const userPrompt = `${userProfile.name}说: ${userMessage}\n\n请以JSON格式回复。`;

  if (apiSettings.model.startsWith('gemini')) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: apiSettings.model,
        contents: `对话历史:\n${contextHistory}\n\n${userPrompt}`,
        config: { 
          systemInstruction: systemPrompt, 
          temperature: 0.8,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              segments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, enum: ["speech", "action"] },
                    text: { type: Type.STRING }
                  },
                  required: ["type", "text"]
                }
              }
            },
            required: ["segments"]
          }
        }
      });
      const parsed = JSON.parse(response.text || '{"segments": []}');
      return parsed.segments || [{ type: 'speech', text: '……' }];
    } catch (error) {
      console.error("Gemini Error:", error);
      return [{ type: 'speech', text: '系统错误：无法连接到角色的心。' }];
    }
  } else {
    try {
      const result = await callExternalProvider(apiSettings, providerKeys, systemPrompt, `对话历史:\n${contextHistory}\n\n${userPrompt}`);
      const parsed = JSON.parse(result || '{"segments": []}');
      return parsed.segments || [{ type: 'speech', text: '……' }];
    } catch (error) {
      return [{ type: 'speech', text: '网络连接失败。' }];
    }
  }
};

export const generateWorldNewsItems = async (worldDescription: string, apiSettings: ApiSettings, providerKeys: ApiConfig['providerKeys']) => {
  const systemPrompt = "你是一个世界观生成引擎，专门生成基于设定背景的新闻报道。";
  const userPrompt = `基于以下世界观，生成3条今日头条新闻。\n世界观: ${worldDescription}\n输出要求为 JSON 数组。`;

  if (apiSettings.model.startsWith('gemini')) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: apiSettings.model,
      contents: userPrompt,
      config: { 
        systemInstruction: systemPrompt, 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ["title", "content", "category"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } else {
    try {
      const result = await callExternalProvider(apiSettings, providerKeys, systemPrompt, userPrompt);
      return JSON.parse(result || "[]");
    } catch (e) {
      return [];
    }
  }
};

export const generateWorldHotSearches = async (worldDescription: string, apiSettings: ApiSettings, providerKeys: ApiConfig['providerKeys']) => {
  const systemPrompt = "你是一个世界观生成引擎，专门生成微博风格的热搜榜单。";
  const userPrompt = `基于以下世界观，生成5条当前最火的热搜话题。\n世界观: ${worldDescription}\n输出要求为 JSON 数组。`;

  if (apiSettings.model.startsWith('gemini')) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: apiSettings.model,
      contents: userPrompt,
      config: { 
        systemInstruction: systemPrompt, 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              hotness: { type: Type.STRING },
              tag: { type: Type.STRING }
            },
            required: ["title", "hotness"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } else {
    try {
      const result = await callExternalProvider(apiSettings, providerKeys, systemPrompt, userPrompt);
      return JSON.parse(result || "[]");
    } catch (e) {
      return [];
    }
  }
};

export const generateWorldSocialPosts = async (platform: 'weibo' | 'moments', worldDescription: string, characters: Character[], apiSettings: ApiSettings, providerKeys: ApiConfig['providerKeys']) => {
  const isWeibo = platform === 'weibo';
  const charContexts = characters.map(c => `- ${c.name}: ${c.background}`).join('\n');
  const validNames = characters.map(c => c.name).join(', ');
  
  const systemPrompt = `
    你是一个社交媒体生成引擎。
    **严禁生成任何不在角色列表中的角色**。
    **禁止生成名为“未知角色”或“路人”的内容**。
    世界观: ${worldDescription}
    
    你必须且只能从以下角色列表中随机挑选角色来发布${isWeibo ? '微博' : '朋友圈'}动态：
    ${charContexts}
    
    输出要求：
    1. 只能使用列表中的名字: [${validNames}]。
    2. 动态内容必须符合该角色的性格和背景。
    3. 每次生成2条不同的动态。
    
    动态风格: ${isWeibo ? '公开、面向大众、可能带标签' : '私人、生活化、随性'}
  `;
  
  const userPrompt = `请为当前角色列表中的角色生成2条新的${platform}动态。输出为 JSON 数组。`;

  if (apiSettings.model.startsWith('gemini')) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: apiSettings.model,
      contents: userPrompt,
      config: { 
        systemInstruction: systemPrompt, 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              authorName: { type: Type.STRING },
              content: { type: Type.STRING }
            },
            required: ["authorName", "content"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } else {
    try {
      const result = await callExternalProvider(apiSettings, providerKeys, systemPrompt, userPrompt);
      return JSON.parse(result || "[]");
    } catch (e) {
      return [];
    }
  }
};

export const generateInteractionForPost = async (
  post: SocialPost,
  characters: Character[],
  worldDescription: string,
  userProfile: UserProfile,
  maxReplies: number,
  apiSettings: ApiSettings,
  providerKeys: ApiConfig['providerKeys']
) => {
  const authorName = post.authorId === 'user' ? userProfile.name : (characters.find(c => c.id === post.authorId)?.name || "未知用户");
  const charContexts = characters.map(c => `${c.name}: ${c.background}`).join('\n');
  const validNames = characters.map(c => c.name).join(', ');
  
  const systemPrompt = `
    你是一个社交互动引擎。模拟角色在社交媒体下的评论。
    **你必须且只能使用以下名单中的角色进行互动**：
    ${charContexts}
    
    **严禁使用不在名单中的名字。严禁出现“未知角色”、“网友”、“路人”等名字**。
    
    作者: ${authorName}
    正文: ${post.content}
    平台: ${post.platform}
    
    规则: 生成最多 ${maxReplies} 条评论。角色之间可以根据性格互相回复。
  `;

  const userPrompt = `请生成互动评论 JSON。只能从 [${validNames}] 中挑选角色。`;

  if (apiSettings.model.startsWith('gemini')) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: apiSettings.model,
      contents: userPrompt,
      config: { 
        systemInstruction: systemPrompt, 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            interactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  authorName: { type: Type.STRING },
                  content: { type: Type.STRING },
                  replyToName: { type: Type.STRING }
                },
                required: ["authorName", "content"]
              }
            }
          },
          required: ["interactions"]
        }
      }
    });
    return JSON.parse(response.text || "{\"interactions\": []}");
  } else {
    try {
      const result = await callExternalProvider(apiSettings, providerKeys, systemPrompt, userPrompt);
      return JSON.parse(result || "{\"interactions\": []}");
    } catch (e) {
      return { interactions: [] };
    }
  }
};

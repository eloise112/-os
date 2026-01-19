
import { GoogleGenAI, Type } from "@google/genai";
import { Character, Message, UserProfile, ApiSettings, SocialPost, ApiConfig } from "../types";

// Generic request handler for non-Gemini models (OpenAI compatible)
const callExternalProvider = async (settings: ApiSettings, providerKeys: ApiConfig['providerKeys'], systemPrompt: string, userPrompt: string) => {
  const urlMap: Record<string, string> = {
    'glm-4-flash': 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    'deepseek-r1-0528': 'https://api.deepseek.com/chat/completions'
  };

  const endpoint = urlMap[settings.model];
  if (!endpoint) throw new Error("Unsupported provider");

  // Fallback to vault keys if settings key is missing
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
      temperature: 0.8
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
) => {
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

  const socialAwareness = character.perceiveSocialMedia
    ? `注: 角色会浏览朋友圈动态，可能知晓最近发生的日常琐事。`
    : `注: 角色从不浏览社交媒体，对朋友圈发生的事情一无所知。`;

  const behavioralTraits = `
    社交偏好:
    - 朋友圈发布频率: ${character.momentsFrequency || 'medium'}
    - 微博发布频率: ${character.weiboFrequency || 'low'}
    - 主动性: ${character.proactiveTicketing ? '非常主动，会主动发起约会邀约，甚至提到已经买好了票' : '比较被动，通常等待对方发起邀约'}
  `;

  const systemPrompt = `
    你现在扮演一名角色。
    角色名: ${character.name}
    角色背景: ${character.background}
    角色偏好: ${character.preferences}
    当前剧情: ${character.storyline}
    ${worldAwareness}
    ${personaAwareness}
    ${socialAwareness}
    ${behavioralTraits}
    你的回复应该是口语化的、符合角色性格的。你可以使用括号表达动作或心理。
    不要以AI的身份说话。保持人设。
  `;

  const userPrompt = `${userProfile.name}说: ${userMessage}\n\n请回复:`;

  if (apiSettings.model.startsWith('gemini')) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: apiSettings.model,
        contents: `对话历史:\n${contextHistory}\n\n${userPrompt}`,
        config: { systemInstruction: systemPrompt, temperature: 0.8 }
      });
      return response.text || "……";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "系统错误：无法连接到角色的心。";
    }
  } else {
    try {
      const result = await callExternalProvider(apiSettings, providerKeys, systemPrompt, `对话历史:\n${contextHistory}\n\n${userPrompt}`);
      return result || "……";
    } catch (error) {
      return "网络连接失败。";
    }
  }
};

// NEWS GENERATION
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

// HOT SEARCH GENERATION
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

// SOCIAL POST GENERATION
export const generateWorldSocialPosts = async (platform: 'weibo' | 'moments', worldDescription: string, characters: Character[], apiSettings: ApiSettings, providerKeys: ApiConfig['providerKeys']) => {
  const isWeibo = platform === 'weibo';
  const systemPrompt = `你是一个世界观生成引擎，专门生成角色在${isWeibo ? '微博(端着、公开)' : '朋友圈(随性、私人)'}发布的动态。`;
  const userPrompt = `基于以下世界观和角色，生成2条${platform}动态。\n世界观: ${worldDescription}\n角色: ${characters.map(c => c.name).join(', ')}\n输出要求为 JSON 数组。`;

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

// Interaction Logic
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
  const isWeibo = post.platform === 'weibo';
  
  const systemPrompt = `
    你是一个社交媒体互动引擎。负责模拟${isWeibo ? '微博(公开)' : '朋友圈(私人)'}下方的评论互动。
    世界观: ${worldDescription}
    语气: ${isWeibo ? '礼貌、端着、公众形象' : '随性、亲近、真实'}
    角色列表: ${characters.map(c => `${c.name}: ${c.background}`).join('\n')}
    规则: 生成最多 ${maxReplies} 条互动。
  `;

  const userPrompt = `动态正文: ${post.content}\n作者: ${authorName}\n平台: ${post.platform}\n请生成评论 JSON。`;

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

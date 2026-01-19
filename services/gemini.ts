import { GoogleGenAI, Type } from "@google/genai";
import { Character, Message, UserProfile, ApiSettings, SocialPost, ApiConfig, Ticket } from "../types";

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
      // Correctly access .text property (not a method)
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

export const generateWorldNewsItems = async (worldDescription: string, apiSettings: ApiSettings, providerKeys: ApiConfig['providerKeys'], categoryFilter?: string) => {
  const systemPrompt = "你是一个世界观生成引擎，专门生成基于设定背景的新闻报道。";
  const categoryContext = categoryFilter ? `重点关注以下类别的新闻：${categoryFilter}。` : "";
  const userPrompt = `基于以下世界观，生成2-3条今日头条新闻。\n${categoryContext}\n世界观: ${worldDescription}\n输出要求为 JSON 数组。`;

  if (apiSettings.model.startsWith('gemini')) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
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
      // Correctly access .text property
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("News Generation Error:", e);
      return [];
    }
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
    try {
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
      // Correctly access .text property
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Hot Search Generation Error:", e);
      return [];
    }
  } else {
    try {
      const result = await callExternalProvider(apiSettings, providerKeys, systemPrompt, userPrompt);
      return JSON.parse(result || "[]");
    } catch (e) {
      return [];
    }
  }
};

export const generateWorldTickets = async (worldDescription: string, apiSettings: ApiSettings, providerKeys: ApiConfig['providerKeys'], categoryFilter?: string): Promise<Omit<Ticket, 'id' | 'isPurchased'>[]> => {
  const systemPrompt = "你是一个世界观生成引擎，专门生成基于设定背景的大麦票务信息。";
  const categoryContext = categoryFilter ? `你现在只需要生成“${categoryFilter}”类别的票务。` : "";
  const userPrompt = `基于以下世界观，生成2个新的演出或活动票务信息。
  ${categoryContext}
  世界观: ${worldDescription}
  
  输出要求：
  1. 返回 JSON 数组。
  2. 每个对象包含 title, date (YYYY-MM-DD), price (数字), category ('concert', 'movie', 'theater', 'sports', 'exhibition'), image (随机 unsplash 链接)。
  `;

  if (apiSettings.model.startsWith('gemini')) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
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
                date: { type: Type.STRING },
                price: { type: Type.NUMBER },
                category: { type: Type.STRING, enum: ['concert', 'movie', 'theater', 'sports', 'exhibition'] },
                image: { type: Type.STRING }
              },
              required: ["title", "date", "price", "category", "image"]
            }
          }
        }
      });
      // Correctly access .text property
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Ticket Generation Error:", e);
      return [];
    }
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
    try {
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
      // Correctly access .text property
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Social Post Generation Error:", e);
      return [];
    }
  } else {
    try {
      const result = await callExternalProvider(apiSettings, providerKeys, systemPrompt, userPrompt);
      return JSON.parse(result || "[]");
    } catch (e) {
      return [];
    }
  }
};

export const generateRecommendedSocialPosts = async (worldDescription: string, apiSettings: ApiSettings, providerKeys: ApiConfig['providerKeys']) => {
  const systemPrompt = `
    你是一个社交媒体生成引擎，专门模拟一个真实、充满活力的微博“推荐”流。
    你需要生成由随机虚拟用户（非角色卡中的固定角色）发布的帖子。
    
    内容指导：
    - 生活碎碎念、职场吐槽、社会热议、萌宠摄影、科技前瞻、美食分享等。
    - 结合当前世界观：${worldDescription}。
    - 风格多样：有的幽默，有的严肃，有的感性，有的愤青。
    - 偶尔包含热门话题标签（如 #今日份快乐# #世界能源危机# 等）。
    
    输出要求：
    1. 每次生成3条不同的动态。
    2. 每条包含 authorName (富有个性的虚拟网名，如“深夜搬砖工”、“代码诗人”、“吃货喵喵”), authorAvatar (unsplash 头像链接), content (正文内容)。
    3. 返回标准 JSON 数组。
  `;
  
  const userPrompt = `基于当前世界背景，生成3条随机的大众微博推荐帖子。`;

  if (apiSettings.model.startsWith('gemini')) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
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
                authorAvatar: { type: Type.STRING },
                content: { type: Type.STRING }
              },
              required: ["authorName", "authorAvatar", "content"]
            }
          }
        }
      });
      // Correctly access .text property
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Recommended Posts Error:", e);
      return [];
    }
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
  const authorName = post.authorId === 'user' ? userProfile.name : (post.authorName || characters.find(c => c.id === post.authorId)?.name || "匿名用户");
  const charContexts = characters.map(c => `${c.name}: ${c.background}`).join('\n');
  const validNames = characters.map(c => c.name).join(', ');
  
  const systemPrompt = `
    你是一个社交互动引擎。模拟指定角色在社交媒体下的评论 and 互动。
    **你必须且只能使用以下名单中的角色进行回复**：
    ${charContexts}
    
    **严禁使用名单外的名字，严禁出现“路人”、“网友”等模糊身份。**
    
    当前帖子情境：
    - 作者: ${authorName}
    - 内容: ${post.content}
    - 平台: ${post.platform}
    
    互动规则：
    1. 根据角色的性格和背景，生成最多 ${maxReplies} 条评论。
    2. 角色可以对作者的内容点赞或评论，也可以在评论区互相回复。
    3. 评论内容要真实自然，符合角色在该社交平台上的活跃度设定。
  `;

  const userPrompt = `请为角色 [${validNames}] 生成对该帖子的互动评论 JSON。`;

  if (apiSettings.model.startsWith('gemini')) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      // FIX: Corrected model assignment; avoid using ai.models.get with string as it expects an object.
      // Use the model provided in the settings as the primary choice.
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
      // Correctly access .text property
      return JSON.parse(response.text || "{\"interactions\": []}");
    } catch (e) {
      console.error("Gemini Interaction Error:", e);
      return { interactions: [] };
    }
  } else {
    try {
      const result = await callExternalProvider(apiSettings, providerKeys, systemPrompt, userPrompt);
      return JSON.parse(result || "{\"interactions\": []}");
    } catch (e) {
      return { interactions: [] };
    }
  }
};
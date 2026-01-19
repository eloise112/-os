
import { GoogleGenAI, Type } from "@google/genai";
import { Character, Message, UserProfile, ApiSettings } from "../types";

// Generic request handler for non-Gemini models (OpenAI compatible)
const callExternalProvider = async (settings: ApiSettings, systemPrompt: string, userPrompt: string) => {
  const urlMap: Record<string, string> = {
    'glm-4-flash': 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    'deepseek-r1-0528': 'https://api.deepseek.com/chat/completions'
  };

  const endpoint = urlMap[settings.model];
  if (!endpoint) throw new Error("Unsupported provider");

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.apiKey}`
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
  apiSettings: ApiSettings
) => {
  const contextHistory = history.slice(-20).map(m => 
    `${m.senderId === 'user' ? userProfile.name : character.name}: ${m.text}`
  ).join('\n');

  // Build dynamic context based on perception flags
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
    : `注: 角色从不浏览社交媒体，对朋友圈发生的事情毫不知情。`;

  const systemPrompt = `
    你现在扮演一名角色。
    角色名: ${character.name}
    角色背景: ${character.background}
    角色偏好: ${character.preferences}
    当前剧情: ${character.storyline}
    ${worldAwareness}
    
    ${personaAwareness}
    
    ${socialAwareness}
    
    你的回复应该是口语化的、符合角色性格的。你可以使用括号表达动作或心理[例如: (微笑着看向你)]。
    你必须时刻意识到对面的人是谁，并根据对方的姓名和人设表现出相应的态度和认知。
    不要以AI的身份说话。保持人设。
  `;

  const userPrompt = `
    对话历史:
    ${contextHistory}
    
    ${userProfile.name}说: ${userMessage}
    
    请回复:
  `;

  // Check if we use Gemini SDK or generic Fetch
  if (apiSettings.model.startsWith('gemini')) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: apiSettings.model,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.8,
          maxOutputTokens: 500,
        }
      });
      return response.text || "…… (由于信号不好，他似乎沉默了)";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "系统错误：无法连接到角色的心。";
    }
  } else {
    try {
      if (!apiSettings.apiKey) return "请在设置中配置对应的 API KEY 以使用此模型。";
      const result = await callExternalProvider(apiSettings, systemPrompt, userPrompt);
      return result || "…… (对方似乎没有回应)";
    } catch (error) {
      console.error("External Provider Error:", error);
      return "网络连接失败，请检查 API 配置。";
    }
  }
};

// World Building Logic
export const generateDailyNewsAndSocial = async (
  worldDescription: string,
  characters: Character[],
  apiSettings: ApiSettings
) => {
  const systemPrompt = "你是一个世界观生成引擎，专门基于设定生成新闻动态。";
  const userPrompt = `
    基于以下世界观，生成今日的3条新闻和2条角色动态。
    世界观: ${worldDescription}
    角色列表: ${characters.map(c => c.name).join(', ')}
    
    输出要求为严格的 JSON 格式，包含字段: news (Array), socialPosts (Array)。
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
            type: Type.OBJECT,
            properties: {
              news: {
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
              },
              socialPosts: {
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
            },
            required: ["news", "socialPosts"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("World Generation Error:", error);
      return null;
    }
  } else {
    try {
      if (!apiSettings.apiKey) return null;
      const result = await callExternalProvider(apiSettings, systemPrompt, userPrompt + "\n请务必只输出 JSON 代码块。");
      const jsonStr = result.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("External World Generation Error:", error);
      return null;
    }
  }
};

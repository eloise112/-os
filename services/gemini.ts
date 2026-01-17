
import { GoogleGenAI, Type } from "@google/genai";
import { Character, Message, NewsItem, Ticket } from "../types";

const API_KEY = process.env.API_KEY || "";

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: API_KEY });
};

// Character Chat Logic (using gemini-3-pro-preview for logic/personality)
export const generateCharacterResponse = async (
  character: Character,
  history: Message[],
  worldPrompt: string,
  userMessage: string
) => {
  const ai = getGeminiClient();
  
  // Format history for context (last 20)
  const contextHistory = history.slice(-20).map(m => 
    `${m.senderId === 'user' ? '用户' : character.name}: ${m.text}`
  ).join('\n');

  const systemPrompt = `
    你现在扮演一名角色。
    角色名: ${character.name}
    背景: ${character.background}
    偏好: ${character.preferences}
    当前剧情: ${character.storyline}
    世界观设定: ${worldPrompt}
    
    你的回复应该是口语化的、符合角色性格的。你可以使用括号表达动作或心理[例如: (微笑着看向你)]。
    不要以AI的身份说话。保持人设。
  `;

  const prompt = `
    对话历史:
    ${contextHistory}
    
    用户说: ${userMessage}
    
    请回复:
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.8,
        maxOutputTokens: 500,
        thinkingConfig: { thinkingBudget: 0 } // Low latency
      }
    });

    return response.text || "…… (由于信号不好，他似乎沉默了)";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "系统错误：无法连接到角色的心。";
  }
};

// World Building Logic (using gemini-3-flash-preview for fast automation)
export const generateDailyNewsAndSocial = async (
  worldDescription: string,
  characters: Character[]
) => {
  const ai = getGeminiClient();
  
  const prompt = `
    基于以下世界观，生成今日的3条新闻和2条角色动态。
    世界观: ${worldDescription}
    角色列表: ${characters.map(c => c.name).join(', ')}
    
    输出要求为 JSON 格式。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
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

    return JSON.parse(response.text);
  } catch (error) {
    console.error("World Generation Error:", error);
    return null;
  }
};

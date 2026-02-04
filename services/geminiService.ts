
import { GoogleGenAI, Type } from "@google/genai";
import { AIExpandMode, AIResponse } from "../types";

export const generateExpandedNodes = async (
  parentText: string,
  mode: AIExpandMode,
  customUserInstruction: string = ""
): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const baseInstruction = mode === 'why' 
    ? "You are a logical analyst specializing in '5 Whys' root cause analysis. Given a statement, provide 3 brief, distinct, and logical causes or reasons for it. Keep each point under 10 words."
    : "You are a strategic consultant specializing in decomposition and structural thinking. Given an idea or task, provide 3 brief, distinct components, sub-tasks, or 'What/How' elements that make it up. Keep each point under 10 words.";

  const systemInstruction = `${baseInstruction}\n\nAdditional User Preferences:\n${customUserInstruction || "Output should be in the same language as the input."}`;

  const prompt = `Expand on this idea: "${parentText}". Provide 3 distinct points.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ideas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of exactly 3 expanded ideas"
            }
          },
          required: ["ideas"]
        }
      },
    });

    if (!response.text) {
      throw new Error("Empty response from Gemini API");
    }

    const result = JSON.parse(response.text) as AIResponse;
    return result.ideas || [];
  } catch (error) {
    console.error("Gemini API Error details:", error);
    throw error;
  }
};

export const refineNodeText = async (
  text: string,
  customUserInstruction: string = ""
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const systemInstruction = `You are an expert editor. Rewrite the given short phrase to be more natural, grammatically correct, and professional while strictly preserving its original meaning.
Example: "事務手順煩雑" -> "事務の手順が煩雑である"
Example: "コスト高い" -> "運用コストが高騰している"
Keep it concise (ideally under 15 words). 
${customUserInstruction ? `Additional Instruction: ${customUserInstruction}` : "Output in the same language as input."}
Return ONLY the refined text string.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Refine this phrase: "${text}"`,
      config: {
        systemInstruction,
      },
    });

    return response.text?.trim() || text;
  } catch (error) {
    console.error("Refine API Error:", error);
    return text;
  }
};

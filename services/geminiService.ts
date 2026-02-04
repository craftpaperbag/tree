
import { GoogleGenAI, Type } from "@google/genai";
import { AIExpandMode, AIResponse } from "../types";

export const generateExpandedNodes = async (
  parentText: string,
  mode: AIExpandMode,
  context: string[] = [],
  customUserInstruction: string = ""
): Promise<{ ideas: string[], fullPrompt: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const baseInstruction = mode === 'why' 
    ? "You are a logical analyst specializing in '5 Whys' root cause analysis. Your task is to identify deep, underlying causes and reasons. STRICT RULE: Focus only on 'why' the issue exists. DO NOT provide solutions, actions, or countermeasures. Provide 3 brief, distinct, and logical causes or reasons for it. Keep each point under 10 words."
    : "You are a strategic consultant specializing in decomposition and structural thinking. Given an idea or task and its broader context, provide 3 brief, distinct components, sub-tasks, or 'What/How' elements that make it up. Keep each point under 10 words.";

  const systemInstruction = `${baseInstruction}\n\nAdditional User Preferences:\n${customUserInstruction || "Output should be in the same language as the input."}`;

  const contextString = context.length > 0 ? `Context path: ${context.join(" -> ")}` : "";
  const prompt = `${contextString ? contextString + "\n\n" : ""}Expand on this specific idea: "${parentText}". Provide 3 distinct points.`;
  
  const fullPromptForLog = `[System Instruction]\n${systemInstruction}\n\n[Prompt]\n${prompt}`;

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
    return { ideas: result.ideas || [], fullPrompt: fullPromptForLog };
  } catch (error) {
    console.error("Gemini API Error details:", error);
    throw error;
  }
};

export const refineNodeText = async (
  text: string,
  customUserInstruction: string = ""
): Promise<{ refined: string, fullPrompt: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const systemInstruction = `You are an expert editor. Rewrite the given short phrase to be more natural, grammatically correct, and professional while strictly preserving its original meaning.
For Japanese output, always use "である" style (da/de-aru) instead of "です/ます" style.
Example: "事務手順煩雑" -> "事務の手順が煩雑である"
Example: "コスト高い" -> "運用コストが高騰している"
Keep it concise (ideally under 15 words). 
${customUserInstruction ? `Additional Instruction: ${customUserInstruction}` : "Output in the same language as input."}
Return ONLY the refined text string.`;

  const prompt = `Refine this phrase: "${text}"`;
  const fullPromptForLog = `[System Instruction]\n${systemInstruction}\n\n[Prompt]\n${prompt}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    const refined = response.text?.trim() || text;
    return { refined, fullPrompt: fullPromptForLog };
  } catch (error) {
    console.error("Refine API Error:", error);
    return { refined: text, fullPrompt: fullPromptForLog };
  }
};

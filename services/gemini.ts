
import { GoogleGenAI, Type } from "@google/genai";
import { Language } from "../types";

// The app will run fine if process.env.API_KEY is missing, only AI features will be disabled.
const getAiClient = () => {
  if (!process.env.API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export async function getTafsir(surahNumber: number, ayahNumber: number, arabic: string, originalTranslation: string, language: Language) {
  const cacheKey = `tafsir_${language}_${surahNumber}_${ayahNumber}`;
  
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;
  } catch (e) {}

  const ai = getAiClient();
  if (!ai) return "AI Tafsir requires an active service connection. Please check your internet or settings.";

  const langMap = { bn: "Bangla", en: "English", hi: "Hindi", ar: "Arabic" };
  const targetLang = langMap[language];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a short, easy-to-understand ${targetLang} Tafsir for: Surah ${surahNumber}, Ayah ${ayahNumber}. Arabic: ${arabic}. Translation: ${originalTranslation}. Focus on spiritual lessons.`,
      config: { temperature: 0.7, topP: 0.95 },
    });

    const result = response.text || "Explanation not found.";
    try { localStorage.setItem(cacheKey, result); } catch (e) {}
    return result;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "This feature is currently unavailable. You can still read the translation above.";
  }
}

export async function searchQuranAI(query: string, language: Language) {
  const ai = getAiClient();
  if (!ai) return [];

  const langMap = { bn: "Bangla", en: "English", hi: "Hindi", ar: "Arabic" };
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for Quranic verses related to: "${query}". Return as JSON array of objects with 'surah', 'ayah', 'text_arabic', 'text_target_lang', and 'reason'. Language: ${langMap[language]}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              surah: { type: Type.NUMBER },
              ayah: { type: Type.NUMBER },
              text_arabic: { type: Type.STRING },
              text_target_lang: { type: Type.STRING },
              reason: { type: Type.STRING },
            },
            required: ["surah", "ayah", "text_arabic", "text_target_lang", "reason"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return [];
  }
}

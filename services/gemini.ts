
import { GoogleGenAI, Type } from "@google/genai";
import { Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getTafsir(surahNumber: number, ayahNumber: number, arabic: string, originalTranslation: string, language: Language) {
  const cacheKey = `tafsir_${language}_${surahNumber}_${ayahNumber}`;
  
  // Try to get from local cache first
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (e) {
    console.warn("Local storage not available for caching", e);
  }

  const langMap = {
    bn: "Bangla",
    en: "English",
    hi: "Hindi",
    ar: "Arabic"
  };

  const targetLang = langMap[language];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a short, easy-to-understand ${targetLang} Tafsir (explanation) for the following Quranic verse. 
      Surah: ${surahNumber}, Ayah: ${ayahNumber}
      Arabic: ${arabic}
      Existing Translation Reference: ${originalTranslation}
      Please focus on context, spiritual lesson, and practical guidance. Format it in clean Markdown. The output MUST be in ${targetLang}.`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      },
    });

    const result = response.text || "Explanation not found. Please try again.";
    
    // Save to cache if response is valid
    if (response.text) {
      try {
        localStorage.setItem(cacheKey, result);
      } catch (e) {
        console.warn("Failed to save Tafsir to cache", e);
      }
    }

    return result;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error loading Tafsir. Please check your internet connection.";
  }
}

export async function searchQuranAI(query: string, language: Language) {
  const langMap = {
    bn: "Bangla",
    en: "English",
    hi: "Hindi",
    ar: "Arabic"
  };
  const targetLang = langMap[language];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for Quranic verses related to: "${query}". Return the result as a JSON array of objects with 'surah', 'ayah', 'text_arabic', 'text_target_lang' (translation in ${targetLang}), and 'reason' (why this verse is relevant in ${targetLang}). Answer completely in ${targetLang}.`,
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
    console.error("Gemini Search Error:", error);
    return [];
  }
}

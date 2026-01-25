
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Language } from '../types';

interface HadithViewProps {
  t: any;
  language: Language;
}

const HadithView: React.FC<HadithViewProps> = ({ t, language }) => {
  const [loading, setLoading] = useState(false);
  const [hadiths, setHadiths] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchHadiths = async (query: string = "Prophetic Character and Kindness") => {
    setLoading(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langMap = { bn: "Bangla", en: "English", hi: "Hindi" };
    const targetLang = langMap[language];

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Provide 5 authentic Hadiths related to "${query}". Return the result as a JSON array of objects with 'text', 'source', and 'lesson' (spiritual takeaway). Answer completely in ${targetLang}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                source: { type: Type.STRING },
                lesson: { type: Type.STRING },
              },
              required: ["text", "source", "lesson"]
            }
          }
        }
      });
      setHadiths(JSON.parse(response.text));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHadiths();
  }, [language]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      fetchHadiths(searchTerm);
    }
  };

  return (
    <div className="p-6 space-y-8 pb-32">
      <div className="space-y-2 text-center max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-black dark:text-white">{t.hadith_title}</h2>
        <p className="text-sm md:text-base text-gray-500">{t.hadith_category_title}</p>
      </div>

      <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto w-full">
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t.hadith_search_placeholder} 
          className="w-full p-4 pl-12 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-3xl shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
        />
        <svg className="w-5 h-5 absolute left-4 top-4.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
      </form>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-emerald-600 font-bold italic">{t.hadith_loading}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hadiths.map((h, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 p-7 rounded-[2.5rem] border border-gray-100 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all flex flex-col">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017V14H15.017C13.9124 14 13.017 13.1046 13.017 12V9C13.017 7.89543 13.9124 7 15.017 7H19.017C20.1216 7 21.017 7.89543 21.017 9V19C21.017 20.1046 20.1216 21 19.017 21H14.017ZM3.01705 21L3.01705 18C3.01705 16.8954 3.91248 16 5.01705 16H8.01705V14H4.01705C2.91248 14 2.01705 13.1046 2.01705 12V9C2.01705 7.89543 2.91248 7 4.01705 7H8.01705C9.12162 7 10.017 7.89543 10.017 9V19C10.017 20.1046 9.12162 21 8.01705 21H3.01705Z"/></svg>
              </div>
              
              <div className="mb-4">
                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 px-3 py-1 rounded-full">{t.hadith_ref}: {h.source}</span>
              </div>
              
              <p className="text-gray-800 dark:text-gray-100 font-medium leading-relaxed mb-6 text-lg flex-grow">
                {h.text}
              </p>
              
              <div className="pt-5 border-t border-gray-50 dark:border-slate-700 flex gap-3 mt-auto">
                 <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 shrink-0"></div>
                 <p className="text-sm text-gray-500 italic dark:text-gray-400 leading-snug">
                   {h.lesson}
                 </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HadithView;

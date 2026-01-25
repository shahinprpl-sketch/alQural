
import React, { useState } from 'react';
import { searchQuranAI } from '../services/gemini';
import { AppSettings, Surah } from '../types';

interface SearchViewProps {
  settings: AppSettings;
  onSurahSelect: (surah: Surah) => void;
  t: any;
}

const SearchView: React.FC<SearchViewProps> = ({ settings, onSurahSelect, t }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    const aiResults = await searchQuranAI(query, settings.language);
    setResults(aiResults);
    setLoading(false);
  };

  return (
    <div className="p-4 md:p-8 space-y-10 pb-32">
      <div className="space-y-3 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight">{t.search_ai_title}</h2>
        <p className="text-sm md:text-base text-slate-500 font-medium">{t.search_ai_subtitle}</p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 max-w-3xl mx-auto w-full">
        <div className="relative flex-1">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={settings.language === 'en' ? 'Type in English...' : settings.language === 'hi' ? 'हिंदी में लिखें...' : 'বাংলায় লিখুন...'} 
            className="w-full p-5 bg-white dark:bg-slate-800 dark:text-white rounded-[2rem] border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-emerald-500/10 outline-none shadow-sm transition-all"
          />
          <svg className="w-5 h-5 absolute right-5 top-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
        <button 
          disabled={loading}
          className="bg-emerald-600 dark:bg-emerald-500 text-white px-10 py-5 rounded-[2rem] font-black shadow-xl shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 active:scale-95 disabled:opacity-50 transition-all text-base tracking-widest uppercase"
        >
          {loading ? (
             <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : t.search_ai_btn}
        </button>
      </form>

      {loading && (
        <div className="flex flex-col items-center py-24 gap-6">
          <div className="w-14 h-14 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-base text-emerald-600 font-black italic uppercase tracking-[0.2em]">{t.search_ai_loading}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {results.map((res, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-8 rounded-[2.75rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col hover:shadow-xl hover:border-emerald-100 transition-all group">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-black rounded-xl uppercase tracking-[0.2em] border border-emerald-100/50">
                {t.nav_surah} {res.surah} • {t.nav_surah === 'সূরা' ? 'আয়াত' : 'Ayah'} {res.ayah}
              </span>
            </div>
            <p className="arabic-text text-right mb-8 text-3xl text-slate-900 dark:text-slate-100 leading-loose">{res.text_arabic}</p>
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-8 flex-grow font-medium">{res.text_target_lang}</p>
            <div className="pt-6 border-t border-slate-50 dark:border-slate-700 mt-auto">
              <div className="flex gap-3">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0"></div>
                 <p className="text-xs md:text-sm italic text-emerald-600 dark:text-emerald-400 font-bold leading-relaxed">{t.search_reason_prefix}{res.reason}</p>
              </div>
            </div>
          </div>
        ))}

        {!loading && query && results.length === 0 && (
          <div className="col-span-full text-center py-32 flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <p className="text-lg text-slate-400 font-black uppercase tracking-widest">{t.search_ai_no_results}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchView;

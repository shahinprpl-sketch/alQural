
import React, { useState, useEffect } from 'react';
import { Surah, AppSettings } from '../types.ts';

interface SurahListProps {
  onSurahClick: (surah: Surah) => void;
  settings: AppSettings;
  t: any;
  favorites: string[];
  onToggleFavorite: (ayahKey: string) => void;
}

export const SurahList: React.FC<SurahListProps> = ({ onSurahClick, settings, t }) => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const res = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await res.json();
        if (data.code === 200) setSurahs(data.data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchSurahs();
  }, []);

  const filtered = surahs.filter(s => 
    s.englishName.toLowerCase().includes(search.toLowerCase()) || 
    s.number.toString() === search
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Surahs...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="relative max-w-2xl mx-auto">
        <input 
          type="text" 
          placeholder={t.search_placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-4 pl-12 bg-white dark:bg-slate-800 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 outline-none shadow-sm focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
        <svg className="w-5 h-5 absolute left-4 top-4.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => (
          <div 
            key={s.number}
            onClick={() => onSurahClick(s)}
            className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-emerald-500/30 transition-all cursor-pointer group active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center font-black text-slate-500 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  {s.number}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight">{s.englishName}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.revelationType} • {s.numberOfAyahs} {t.nav_surah === 'সূরা' ? 'আয়াত' : 'Ayahs'}</p>
                </div>
              </div>
              <div className="arabic-text text-2xl text-slate-900 dark:text-emerald-500 opacity-80 group-hover:opacity-100 transition-all">{s.name}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { Surah, Ayah, AppSettings } from '../types.ts';
import { getTafsir } from '../services/gemini.ts';

interface AyahViewProps {
  surah: Surah;
  settings: AppSettings;
  favorites: string[];
  onToggleFavorite: (ayahKey: string) => void;
  onBack: () => void;
  t: any;
}

export const AyahView: React.FC<AyahViewProps> = ({ surah, settings, favorites, onToggleFavorite, onBack, t }) => {
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTafsir, setActiveTafsir] = useState<{ [key: number]: string }>({});
  const [tafsirLoading, setTafsirLoading] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    const fetchAyahs = async () => {
      setLoading(true);
      const editionMap = { bn: 'bn.bengali', hi: 'hi.hindi', en: 'en.ahmedali', ar: 'ar.jalalayn' };
      const edition = editionMap[settings.language] || 'en.ahmedali';
      try {
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/editions/quran-simple,${edition}`);
        const data = await res.json();
        if (data.code === 200) {
          const formatted = data.data[0].ayahs.map((a: any, i: number) => ({
            ...a,
            translation: data.data[1].ayahs[i].text
          }));
          setAyahs(formatted);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchAyahs();
  }, [surah.number, settings.language]);

  const handleTafsir = async (ayah: Ayah) => {
    if (activeTafsir[ayah.number]) {
      setActiveTafsir(prev => {
        const next = { ...prev };
        delete next[ayah.number];
        return next;
      });
      return;
    }
    setTafsirLoading(prev => ({ ...prev, [ayah.number]: true }));
    const result = await getTafsir(surah.number, ayah.numberInSurah, ayah.text, ayah.translation, settings.language);
    setActiveTafsir(prev => ({ ...prev, [ayah.number]: result }));
    setTafsirLoading(prev => ({ ...prev, [ayah.number]: false }));
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.ayah_loading}</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 p-4 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-between">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
          <svg className="w-6 h-6 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div className="text-center">
          <h2 className="font-black dark:text-white">{surah.englishName}</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{surah.englishNameTranslation}</p>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {ayahs.map(ayah => {
          const ayahKey = `${surah.number}:${ayah.numberInSurah}`;
          const isFav = favorites.includes(ayahKey);
          return (
            <div key={ayah.number} className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
              <div className="flex justify-between items-start">
                <span className="w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center font-black text-xs text-slate-400">{ayah.numberInSurah}</span>
                <div className="flex gap-2">
                  <button onClick={() => onToggleFavorite(ayahKey)} className={`p-2.5 rounded-xl transition-all ${isFav ? 'bg-emerald-50 text-emerald-600' : 'text-slate-300'}`}>
                    <svg className="w-5 h-5" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                  </button>
                  <button onClick={() => handleTafsir(ayah)} className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl font-black text-[10px] uppercase tracking-widest">{t.ayah_tafsir_btn}</button>
                </div>
              </div>
              <p className="arabic-text text-right text-3xl leading-loose dark:text-white" style={{ fontSize: `${settings.arabicFontSize}px` }}>{ayah.text}</p>
              <p className="font-medium leading-relaxed dark:text-slate-300 border-t border-slate-50 dark:border-slate-700 pt-4" style={{ fontSize: `${settings.banglaFontSize}px` }}>{ayah.translation}</p>
              
              {tafsirLoading[ayah.number] && (
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl animate-pulse text-[10px] font-black text-emerald-600 uppercase tracking-widest text-center">{t.ayah_tafsir_loading}</div>
              )}
              {activeTafsir[ayah.number] && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800 text-sm leading-relaxed dark:text-emerald-50">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">{t.ayah_tafsir_title}</h4>
                   {activeTafsir[ayah.number]}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { AppSettings, Ayah } from '../types';

interface FavoritesViewProps {
  settings: AppSettings;
  favorites: string[];
  onToggleFavorite: (ayahKey: string) => void;
  t: any;
}

const FavoritesView: React.FC<FavoritesViewProps> = ({ settings, favorites, onToggleFavorite, t }) => {
  const [favAyahs, setFavAyahs] = useState<{key: string, ayah: Ayah, surahName: string}[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFavs = async () => {
      if (favorites.length === 0) return;
      setLoading(true);
      const results = [];
      const editionMap = {
        bn: 'bn.bengali',
        hi: 'hi.hindi',
        en: 'en.ahmedali',
        ar: 'ar.jalalayn'
      };
      const edition = editionMap[settings.language] || 'en.ahmedali';

      for (const favKey of favorites) {
        try {
          const [sId, aId] = favKey.split(':');
          const res = await fetch(`https://api.alquran.cloud/v1/ayah/${sId}:${aId}/editions/quran-simple,${edition}`);
          const data = await res.json();
          results.push({
            key: favKey,
            ayah: {
              ...data.data[0],
              translation: data.data[1].text
            },
            surahName: settings.language === 'ar' ? data.data[0].surah.name : data.data[0].surah.englishName
          });
        } catch (e) { console.error(e); }
      }
      setFavAyahs(results);
      setLoading(false);
    };
    fetchFavs();
  }, [favorites, settings.language]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-20">
      <div className="w-14 h-14 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Accessing Favorites...</p>
    </div>
  );

  if (favorites.length === 0) return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-slate-400 p-8 text-center gap-8">
      <div className="p-12 bg-white dark:bg-slate-800 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800">
        <svg className="w-24 h-24 text-slate-200 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
      </div>
      <div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{t.fav_empty}</h3>
        <p className="text-xs font-medium max-w-[240px] leading-relaxed mx-auto text-slate-400 uppercase tracking-widest">Mark ayahs you love to see them here.</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-10 pb-32">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2">{t.fav_title}</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">{favorites.length} {t.nav_fav === 'প্রিয়' ? 'আয়াত' : t.nav_fav === 'المفضلة' ? 'آية' : 'Ayahs'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {favAyahs.map((item) => (
          <div key={item.key} className="bg-white dark:bg-slate-800 rounded-[3rem] p-10 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col hover:shadow-xl hover:border-emerald-100 transition-all group">
            <div className="flex justify-between items-center mb-8">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-5 py-2.5 rounded-xl border border-emerald-100/50">
                {t.nav_surah} {item.surahName} • {item.ayah.numberInSurah}
              </span>
              <button 
                onClick={() => onToggleFavorite(item.key)}
                className="text-red-500 p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-90"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
              </button>
            </div>
            <p 
              className="arabic-text text-right mb-8 text-slate-900 dark:text-slate-100 leading-[2.2]" 
              style={{ fontSize: `${settings.arabicFontSize * 0.9}px` }}
            >
              {item.ayah.text}
            </p>
            <div className="pt-8 border-t border-slate-50 dark:border-slate-700 mt-auto">
              <p 
                className="text-slate-700 dark:text-slate-300 leading-relaxed font-bold md:text-xl"
                style={{ fontSize: `${settings.banglaFontSize}px` }}
              >
                {item.ayah.translation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FavoritesView;

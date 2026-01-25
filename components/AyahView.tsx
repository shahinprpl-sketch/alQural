
import React, { useState, useEffect, useRef } from 'react';
import { Surah, Ayah, AppSettings } from '../types';
import { getTafsir } from '../services/gemini';
import { speakSurahName } from '../services/tts';

interface AyahViewProps {
  surah: Surah;
  settings: AppSettings;
  favorites: string[];
  onToggleFavorite: (ayahKey: string) => void;
  onBack: () => void;
  t: any;
}

const AyahView: React.FC<AyahViewProps> = ({ surah, settings, favorites, onToggleFavorite, onBack, t }) => {
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTafsir, setSelectedTafsir] = useState<{ ayah: number, text: string } | null>(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [isSpeakingName, setIsSpeakingName] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchAyahs = async () => {
      setLoading(true);
      try {
        const editionMap = {
          bn: 'bn.bengali',
          hi: 'hi.hindi',
          en: 'en.ahmedali',
          ar: 'ar.jalalayn'
        };
        const edition = editionMap[settings.language] || 'en.ahmedali';
        
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/editions/quran-simple,${edition}`);
        const data = await res.json();
        const arabic = data.data[0].ayahs;
        const translated = data.data[1].ayahs;
        const combined: Ayah[] = arabic.map((a: any, idx: number) => ({
          ...a,
          translation: translated[idx].text,
          surahId: surah.number
        }));
        setAyahs(combined);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAyahs();
  }, [surah, settings.language]);

  const handleSpeakSurahName = async () => {
    if (isSpeakingName) return;
    setIsSpeakingName(true);
    await speakSurahName(surah.englishName, surah.name, settings.liveVoiceName);
    setIsSpeakingName(false);
  };

  // Subtle interaction feedback sound
  const playInteractionSound = () => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = context.createOscillator();
      const gain = context.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, context.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.05, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.05);
      
      osc.connect(gain);
      gain.connect(context.destination);
      
      osc.start();
      osc.stop(context.currentTime + 0.05);
      
      setTimeout(() => context.close(), 100);
    } catch (e) {}
  };

  const toggleTafsir = async (ayah: Ayah) => {
    playInteractionSound();
    if (selectedTafsir?.ayah === ayah.numberInSurah && !tafsirLoading) {
      setSelectedTafsir(null);
      return;
    }
    setTafsirLoading(true);
    setSelectedTafsir({ ayah: ayah.numberInSurah, text: '' });
    try {
      const explanation = await getTafsir(surah.number, ayah.numberInSurah, ayah.text, ayah.translation, settings.language);
      setSelectedTafsir({ ayah: ayah.numberInSurah, text: explanation });
    } catch (error) {
      console.error(error);
      setSelectedTafsir({ ayah: ayah.numberInSurah, text: "Error loading Tafsir." });
    } finally {
      setTafsirLoading(false);
    }
  };

  const handleFavoriteClick = (key: string) => {
    playInteractionSound();
    onToggleFavorite(key);
  };

  const playAudio = (ayahNum: number) => {
    if (playingAyah === ayahNum) {
      audioRef.current?.pause();
      setPlayingAyah(null);
      return;
    }
    const audioUrl = `https://cdn.islamic.network/quran/audio/128/${settings.reciter}/${ayahNum}.mp3`;
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.playbackRate = settings.playbackSpeed;
      audioRef.current.play();
      setPlayingAyah(ayahNum);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <div className="w-12 h-12 border-4 border-emerald-600 dark:border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">{t.ayah_loading}</p>
    </div>
  );

  return (
    <div className="relative pb-20">
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-6 flex items-center justify-between sticky top-0 z-40 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl shadow-sm active:scale-95 transition-all text-slate-900 dark:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{settings.language === 'ar' ? surah.name : surah.englishName}</h2>
              <button 
                onClick={handleSpeakSurahName}
                className={`p-1.5 rounded-lg transition-all ${isSpeakingName ? 'bg-emerald-600 text-white shadow-lg scale-110' : 'text-emerald-600 hover:bg-emerald-50'}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase">{surah.revelationType} • {surah.numberOfAyahs} {t.nav_surah === 'Surah' ? 'Ayahs' : t.nav_surah === 'سورة' ? 'آية' : 'আয়াত'}</p>
          </div>
        </div>
        <div className="text-right">
           <span className="arabic-text text-3xl text-emerald-600/20 dark:text-emerald-400/20 font-bold select-none">{surah.name}</span>
        </div>
      </div>

      <audio ref={audioRef} onEnded={() => setPlayingAyah(null)} onError={() => setPlayingAyah(null)} />

      <div className="p-4 space-y-8 max-w-4xl mx-auto">
        {ayahs.map((ayah) => {
          const isFavorited = favorites.includes(`${surah.number}:${ayah.numberInSurah}`);
          const isTafsirOpen = selectedTafsir?.ayah === ayah.numberInSurah;
          return (
            <div key={ayah.number} className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm group transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-lg">
                    {ayah.numberInSurah}
                  </span>
                  <button 
                    onClick={() => playAudio(ayah.number)}
                    className={`p-2.5 rounded-xl transition-all ${playingAyah === ayah.number ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-300'}`}
                  >
                    {playingAyah === ayah.number ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleTafsir(ayah)}
                    className={`text-[10px] px-4 py-2 rounded-xl font-black uppercase tracking-widest transition-all ${
                      isTafsirOpen 
                        ? 'bg-emerald-600 text-white shadow-xl' 
                        : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-800'
                    }`}
                  >
                    {t.ayah_tafsir_btn}
                  </button>
                  <button 
                    onClick={() => handleFavoriteClick(`${surah.number}:${ayah.numberInSurah}`)}
                    className={`p-2.5 rounded-xl transition-all ${isFavorited ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-slate-300'}`}
                  >
                    <svg className="w-6 h-6" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                  </button>
                </div>
              </div>

              <p 
                className="arabic-text text-right mb-8 leading-[2.2] text-slate-900 dark:text-white" 
                style={{ fontSize: `${settings.arabicFontSize}px` }}
              >
                {ayah.text}
              </p>
              
              <div className="pt-6 border-t border-slate-50 dark:border-slate-800">
                <p 
                  className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium md:text-xl"
                  style={{ fontSize: `${settings.banglaFontSize}px` }}
                >
                  {ayah.translation}
                </p>
              </div>

              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isTafsirOpen ? 'max-h-[1200px] opacity-100 mt-8' : 'max-h-0 opacity-0'}`}>
                <div className="p-6 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-[2rem] border border-emerald-100 dark:border-emerald-800">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black text-emerald-900 dark:text-emerald-100 uppercase tracking-[0.25em] flex items-center gap-2">
                      {t.ayah_tafsir_title}
                    </h4>
                  </div>
                  {tafsirLoading ? (
                    <div className="flex items-center gap-3 text-emerald-600 text-xs font-black italic py-4">
                      <div className="w-4 h-4 border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                      {t.ayah_tafsir_loading}
                    </div>
                  ) : (
                    <div className="text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line prose dark:prose-invert max-w-none">
                      {selectedTafsir?.text}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AyahView;

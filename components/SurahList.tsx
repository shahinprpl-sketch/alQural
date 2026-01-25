
import React, { useState, useEffect, useRef } from 'react';
import { Surah, AppSettings } from '../types';
import { speakSurahName } from '../services/tts';

interface SurahListProps {
  onSurahClick: (surah: Surah) => void;
  settings: AppSettings;
  t: any;
}

const SurahList: React.FC<SurahListProps> = ({ onSurahClick, settings, t }) => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [activeSurahPlaying, setActiveSurahPlaying] = useState<number | null>(null);
  const [playState, setPlayState] = useState<'idle' | 'naming' | 'reciting'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const res = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await res.json();
        if (data.code === 200) {
          setSurahs(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch surahs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSurahs();
  }, []);

  const handlePlaySequence = async (e: React.MouseEvent, surah: Surah) => {
    e.stopPropagation();

    // If already playing this surah, stop it
    if (activeSurahPlaying === surah.number) {
      audioRef.current?.pause();
      setActiveSurahPlaying(null);
      setPlayState('idle');
      return;
    }

    // Stop existing audio if any
    audioRef.current?.pause();
    
    setActiveSurahPlaying(surah.number);
    setPlayState('naming');

    // 1. Speak Surah Name (AI TTS)
    await speakSurahName(surah.englishName, surah.name, settings.liveVoiceName);

    // Check if user cancelled while AI was speaking
    if (activeSurahPlaying === surah.number || activeSurahPlaying === null) {
       // Proceed to Step 2
       setPlayState('reciting');
       const recitationUrl = `https://cdn.islamic.network/quran/audio-surah/128/${settings.reciter}/${surah.number}.mp3`;
       
       if (audioRef.current) {
         audioRef.current.src = recitationUrl;
         audioRef.current.playbackRate = settings.playbackSpeed;
         audioRef.current.play().catch(error => {
           console.error("Recitation error:", error);
           setPlayState('idle');
           setActiveSurahPlaying(null);
         });
       }
    }
  };

  const filteredSurahs = surahs.filter(s => 
    s.englishName.toLowerCase().includes(filter.toLowerCase()) ||
    s.number.toString().includes(filter)
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading All Surahs...</p>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 space-y-6 pb-32">
      <audio 
        ref={audioRef} 
        onEnded={() => {
          setActiveSurahPlaying(null);
          setPlayState('idle');
        }}
      />

      <div className="relative max-w-2xl mx-auto w-full">
        <input 
          type="text" 
          placeholder={t.search_placeholder} 
          className="w-full p-5 pl-14 bg-white dark:bg-slate-800 dark:text-white rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <svg className="w-6 h-6 absolute left-5 top-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
      </div>

      <div className="flex flex-col gap-4 max-w-3xl mx-auto">
        {filteredSurahs.map(surah => {
          const isCurrent = activeSurahPlaying === surah.number;
          return (
            <button
              key={surah.number}
              onClick={() => onSurahClick(surah)}
              className={`group bg-white dark:bg-slate-800 rounded-[2rem] border flex items-stretch hover:shadow-xl transition-all text-left overflow-hidden shadow-sm ${isCurrent ? 'border-emerald-500 shadow-emerald-100 ring-2 ring-emerald-500/10' : 'border-slate-50 dark:border-slate-800'}`}
            >
              {/* Left Number Column */}
              <div className={`w-16 md:w-20 flex items-center justify-center border-r transition-colors ${isCurrent ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-50/50 dark:bg-slate-900/30 dark:border-slate-800 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20'}`}>
                <span className="font-black text-sm">{surah.number}</span>
              </div>

              {/* Middle Info Section */}
              <div className="flex-1 p-6 md:p-8 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-900 dark:text-white text-lg md:text-xl tracking-tight">
                      {surah.englishName}
                    </h3>
                    <button 
                      onClick={(e) => handlePlaySequence(e, surah)}
                      className={`p-2 rounded-xl transition-all relative ${isCurrent ? 'bg-emerald-600 text-white shadow-lg' : 'text-emerald-600/60 hover:text-emerald-600 hover:bg-emerald-50'}`}
                    >
                      {isCurrent ? (
                        <>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                          </span>
                        </>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                      )}
                    </button>
                    {isCurrent && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 animate-pulse bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded-md">
                        {playState === 'naming' ? 'AI Voice' : 'Reciting'}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] md:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight">
                    {surah.englishNameTranslation} • {surah.numberOfAyahs} {t.nav_surah === 'সূরা' ? 'আয়াত' : 'Ayahs'}
                  </p>
                </div>

                {/* Right Arabic Name */}
                <div className="text-right">
                  <span className={`arabic-text text-3xl md:text-4xl transition-all ${isCurrent ? 'text-emerald-600 dark:text-emerald-400 scale-110 block' : 'text-slate-800 dark:text-slate-100 opacity-80 group-hover:opacity-100'}`}>
                    {surah.name}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Scroll padding for nav */}
      <div className="h-10"></div>
    </div>
  );
};

export default SurahList;


import React, { useState, useEffect, useRef } from 'react';
import { Surah, Ayah, AppSettings } from '../types';
import { speakSurahName, speakText } from '../services/tts';
import { getTafsir } from '../services/gemini';

interface SurahListProps {
  onSurahClick: (surah: Surah) => void;
  settings: AppSettings;
  t: any;
  favorites: string[];
  onToggleFavorite: (ayahKey: string) => void;
}

const SurahList: React.FC<SurahListProps> = ({ onSurahClick, settings, t, favorites, onToggleFavorite }) => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [activeSurahPlaying, setActiveSurahPlaying] = useState<number | null>(null);
  const [playState, setPlayState] = useState<'idle' | 'naming' | 'reciting'>('idle');
  
  // Featured Verse State
  const [featuredAyah, setFeaturedAyah] = useState<any | null>(null);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [featuredPlaying, setFeaturedPlaying] = useState(false);
  const [isSpeakingTranslation, setIsSpeakingTranslation] = useState(false);
  const [featuredTafsir, setFeaturedTafsir] = useState<string | null>(null);
  const [featuredTafsirLoading, setFeaturedTafsirLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const featuredAudioRef = useRef<HTMLAudioElement | null>(null);
  const latestRequestRef = useRef<number | null>(null);

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
    fetchFeaturedVerse();
  }, []);

  const fetchFeaturedVerse = async () => {
    setFeaturedLoading(true);
    setFeaturedTafsir(null);
    try {
      // Get a random Ayah index (1 to 6236)
      const randomAyahIndex = Math.floor(Math.random() * 6236) + 1;
      const edition = settings.language === 'bn' ? 'bn.bengali' : settings.language === 'hi' ? 'hi.hindi' : 'en.ahmedali';
      const res = await fetch(`https://api.alquran.cloud/v1/ayah/${randomAyahIndex}/editions/quran-simple,${edition}`);
      const data = await res.json();
      if (data.code === 200) {
        setFeaturedAyah({
          arabic: data.data[0].text,
          translation: data.data[1].text,
          number: data.data[0].number,
          numberInSurah: data.data[0].numberInSurah,
          surah: data.data[0].surah
        });
      }
    } catch (err) {
      console.error("Failed to fetch featured verse:", err);
    } finally {
      setFeaturedLoading(false);
    }
  };

  const handlePlaySequence = async (e: React.MouseEvent, surah: Surah) => {
    e.stopPropagation();

    if (activeSurahPlaying === surah.number) {
      if (audioRef.current) audioRef.current.pause();
      setActiveSurahPlaying(null);
      setPlayState('idle');
      latestRequestRef.current = null;
      return;
    }

    latestRequestRef.current = surah.number;
    setActiveSurahPlaying(surah.number);
    setPlayState('naming');

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.load();
    }

    try {
      await speakSurahName(surah.englishName, surah.name, settings.liveVoiceName);
    } catch (err) {
      console.warn("AI Naming failed, skipping to recitation");
    }

    if (latestRequestRef.current === surah.number && audioRef.current) {
       setPlayState('reciting');
       const recitationUrl = `https://cdn.islamic.network/quran/audio-surah/128/${settings.reciter}/${surah.number}.mp3`;
       audioRef.current.src = recitationUrl;
       audioRef.current.playbackRate = settings.playbackSpeed;
       audioRef.current.load();
       try {
         await audioRef.current.play();
       } catch (error) {
         console.error("Recitation error:", error);
         if (latestRequestRef.current === surah.number) {
           setPlayState('idle');
           setActiveSurahPlaying(null);
         }
       }
    }
  };

  const toggleFeaturedAudio = () => {
    if (!featuredAyah) return;
    if (featuredPlaying) {
      featuredAudioRef.current?.pause();
      setFeaturedPlaying(false);
    } else {
      const audioUrl = `https://cdn.islamic.network/quran/audio/128/${settings.reciter}/${featuredAyah.number}.mp3`;
      if (featuredAudioRef.current) {
        featuredAudioRef.current.src = audioUrl;
        featuredAudioRef.current.playbackRate = settings.playbackSpeed;
        featuredAudioRef.current.play();
        setFeaturedPlaying(true);
      }
    }
  };

  const handleSpeakTranslation = async () => {
    if (!featuredAyah || isSpeakingTranslation) return;
    setIsSpeakingTranslation(true);
    await speakText(featuredAyah.translation, settings.liveVoiceName);
    setIsSpeakingTranslation(false);
  };

  const handleFeaturedTafsir = async () => {
    if (!featuredAyah) return;
    if (featuredTafsir) {
      setFeaturedTafsir(null);
      return;
    }
    setFeaturedTafsirLoading(true);
    try {
      const result = await getTafsir(
        featuredAyah.surah.number,
        featuredAyah.numberInSurah,
        featuredAyah.arabic,
        featuredAyah.translation,
        settings.language
      );
      setFeaturedTafsir(result);
    } catch (err) {
      console.error(err);
    } finally {
      setFeaturedTafsirLoading(false);
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

  const featuredKey = featuredAyah ? `${featuredAyah.surah.number}:${featuredAyah.numberInSurah}` : '';
  const isFeaturedFavorited = favorites.includes(featuredKey);

  return (
    <div className="p-5 md:p-8 space-y-8 pb-32 max-w-4xl mx-auto">
      <audio 
        ref={audioRef} 
        onEnded={() => {
          setActiveSurahPlaying(null);
          setPlayState('idle');
          latestRequestRef.current = null;
        }}
      />
      <audio 
        ref={featuredAudioRef} 
        onEnded={() => setFeaturedPlaying(false)} 
        onError={() => setFeaturedPlaying(false)}
      />

      {/* Verse of the Day Card */}
      {!featuredLoading && featuredAyah && (
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[3rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden group animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none transition-transform group-hover:scale-110 duration-1000">
             <svg className="w-44 h-44" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
          </div>
          
          <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-100 opacity-80">Verse of the Day</span>
                <h2 className="text-xl md:text-2xl font-black tracking-tight mt-1">{featuredAyah.surah.englishName} : {featuredAyah.numberInSurah}</h2>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={toggleFeaturedAudio}
                  className={`p-3 rounded-2xl backdrop-blur-md transition-all active:scale-95 ${featuredPlaying ? 'bg-white text-emerald-700' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  {featuredPlaying ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </button>
                <button 
                  onClick={() => onToggleFavorite(featuredKey)}
                  className={`p-3 rounded-2xl backdrop-blur-md transition-all active:scale-95 ${isFeaturedFavorited ? 'bg-rose-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  <svg className="w-5 h-5" fill={isFeaturedFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                </button>
              </div>
            </div>

            <p className="arabic-text text-right text-3xl md:text-4xl leading-[2] md:leading-[2.2] text-white">
              {featuredAyah.arabic}
            </p>

            <div className="pt-6 border-t border-white/20 relative">
              <p className="text-emerald-50 text-base md:text-lg font-medium leading-relaxed italic pr-12">
                "{featuredAyah.translation}"
              </p>
              
              {/* Listen Bangla Button Overlay in Translation Area */}
              <button 
                onClick={handleSpeakTranslation}
                className={`absolute bottom-0 right-0 p-2 rounded-xl transition-all active:scale-90 ${isSpeakingTranslation ? 'bg-white text-emerald-700 animate-pulse' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                title="Listen to Translation"
              >
                {isSpeakingTranslation ? (
                  <div className="w-5 h-5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                )}
              </button>
            </div>

            <div className="flex justify-between items-center">
              <button 
                onClick={handleFeaturedTafsir}
                className={`text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-2xl transition-all ${featuredTafsir ? 'bg-white text-emerald-800' : 'bg-emerald-900/40 hover:bg-emerald-900/60 text-white border border-white/10'}`}
              >
                {featuredTafsir ? 'Hide Tafsir' : 'View AI Tafsir'}
              </button>
              <button onClick={fetchFeaturedVerse} className="text-emerald-200/60 hover:text-emerald-200 p-2 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              </button>
            </div>

            {featuredTafsirLoading && (
              <div className="bg-white/5 backdrop-blur-sm rounded-[2rem] p-6 flex items-center gap-4 border border-white/5 animate-pulse">
                <div className="w-5 h-5 border-2 border-emerald-100 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-black uppercase tracking-widest text-emerald-100">Generating spiritual insights...</span>
              </div>
            )}

            {featuredTafsir && !featuredTafsirLoading && (
              <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/10 animate-in zoom-in-95 duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full"></div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100">Deep Insight</h4>
                </div>
                <p className="text-sm md:text-base text-emerald-50 leading-relaxed italic font-medium">
                  {featuredTafsir}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative w-full">
        <input 
          type="text" 
          placeholder={t.search_placeholder} 
          className="w-full p-6 pl-16 bg-white dark:bg-slate-800 dark:text-white rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <svg className="w-6 h-6 absolute left-6 top-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
      </div>

      <div className="flex flex-col gap-4">
        {filteredSurahs.map(surah => {
          const isCurrent = activeSurahPlaying === surah.number;
          return (
            <button
              key={surah.number}
              onClick={() => onSurahClick(surah)}
              className={`group bg-white dark:bg-slate-800 rounded-[2rem] border flex items-stretch hover:shadow-xl transition-all text-left overflow-hidden shadow-sm ${isCurrent ? 'border-emerald-500 shadow-emerald-100 ring-2 ring-emerald-500/10' : 'border-slate-50 dark:border-slate-800'}`}
            >
              <div className={`w-16 md:w-20 flex items-center justify-center border-r transition-colors ${isCurrent ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-50/50 dark:bg-slate-900/30 dark:border-slate-800 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20'}`}>
                <span className="font-black text-sm">{surah.number}</span>
              </div>

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
      
      <div className="h-10"></div>
    </div>
  );
};

export default SurahList;

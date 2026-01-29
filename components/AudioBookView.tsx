
import React, { useState, useRef, useEffect } from 'react';
import { getLocalizedReciters } from '../constants';
import { AppSettings, Surah } from '../types';

interface AudioBookViewProps {
  settings: AppSettings;
  t: any;
}

const AudioBookView: React.FC<AudioBookViewProps> = ({ settings, t }) => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingSurah, setPlayingSurah] = useState<Surah | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const localizedReciters = getLocalizedReciters(settings.language);

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

  useEffect(() => {
    if (playingSurah && isPlaying && audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      const audioUrl = `https://cdn.islamic.network/quran/audio-surah/128/${settings.reciter}/${playingSurah.number}.mp3`;
      audioRef.current.src = audioUrl;
      audioRef.current.playbackRate = settings.playbackSpeed;
      audioRef.current.load();
      audioRef.current.currentTime = currentTime;
      audioRef.current.play().catch(e => {
        console.warn("Autoplay failed after reciter change", e);
        setIsPlaying(false);
      });
    }
  }, [settings.reciter, settings.playbackSpeed]);

  const handlePlaySurah = (surah: Surah) => {
    setAudioError(null);
    if (playingSurah?.number === surah.number) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }

    setPlayingSurah(surah);
    setIsPlaying(true);
    setProgress(0);
    const audioUrl = `https://cdn.islamic.network/quran/audio-surah/128/${settings.reciter}/${surah.number}.mp3`;
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.playbackRate = settings.playbackSpeed;
      audioRef.current.load();
      audioRef.current.play().catch(e => {
        console.error("Playback error", e);
        setAudioError("This Surah is currently unavailable for this Reciter.");
        setIsPlaying(false);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      if (total) {
        setProgress((current / total) * 100);
        setDuration(total);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current && duration) {
      const newTime = (val / 100) * duration;
      audioRef.current.currentTime = newTime;
      setProgress(val);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h, m, s]
      .map(v => v < 10 ? "0" + v : v)
      .filter((v, i) => v !== "00" || i > 0)
      .join(":");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Library...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-10 pb-32">
      <div className="bg-[#1a202c] p-8 md:p-14 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden max-w-4xl mx-auto transition-all duration-500">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-40 -mt-40 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
               <h2 className="text-3xl md:text-4xl font-black mb-2 leading-tight tracking-tight">{t.audio_title}</h2>
               <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">{t.audio_subtitle}</p>
            </div>
            
            <div className="w-full md:w-auto space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block ml-1">{t.settings_reciter}</label>
              <div className="relative">
                <select 
                  value={settings.reciter}
                  onChange={(e) => {
                    const event = new CustomEvent('update_setting', { detail: { key: 'reciter', value: e.target.value } });
                    window.dispatchEvent(event);
                  }}
                  className="w-full md:min-w-[280px] appearance-none bg-[#f8fafc]/5 backdrop-blur-xl text-white px-7 py-5 rounded-[1.75rem] font-black text-[15px] border-none focus:ring-4 focus:ring-emerald-500/20 cursor-pointer transition-all pr-14"
                >
                  {localizedReciters.map(r => (
                    <option key={r.id} value={r.identifier} className="bg-slate-900 text-white py-2 font-bold">{r.name}</option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400/60">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>
          
          {playingSurah ? (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
              {audioError ? (
                <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[2rem] text-center">
                  <p className="text-red-400 text-sm font-bold uppercase tracking-widest">{audioError}</p>
                  <button onClick={() => handlePlaySurah(playingSurah)} className="mt-4 px-6 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/20">Try Reloading</button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-end gap-10">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 block">{t.audio_now_playing}</span>
                      </div>
                      <h3 className="text-4xl md:text-5xl font-black leading-tight mb-3 tracking-tight">{playingSurah.englishName}</h3>
                      <p className="text-base text-slate-400 font-bold">{playingSurah.englishNameTranslation} • {playingSurah.numberOfAyahs} {t.nav_surah === 'সূরা' ? 'আয়াত' : 'Ayahs'}</p>
                    </div>
                    <div className="arabic-text text-6xl md:text-8xl font-bold text-white/5 select-none">{playingSurah.name}</div>
                  </div>
                  
                  <div className="space-y-4">
                    <input 
                      type="range" 
                      min="0" max="100" step="0.1"
                      value={progress}
                      onChange={handleSeek}
                      className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-white hover:accent-emerald-400 transition-all"
                    />
                    <div className="flex justify-between text-[11px] font-black tracking-[0.3em] text-slate-400">
                      <span>{audioRef.current ? formatTime(audioRef.current.currentTime) : "00:00"}</span>
                      <span>{duration ? formatTime(duration) : "00:00"}</span>
                    </div>
                  </div>

                  <div className="flex justify-center items-center gap-8 md:gap-16">
                    <button onClick={() => { if(audioRef.current) audioRef.current.currentTime -= 15 }} className="p-6 bg-white/5 hover:bg-white/10 rounded-[2rem] text-slate-400 hover:text-white transition-all active:scale-90">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>
                    </button>
                    
                    <button onClick={() => handlePlaySurah(playingSurah)} className="w-24 h-24 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-[0_25px_60px_-15px_rgba(255,255,255,0.3)] hover:scale-110 active:scale-95 transition-all">
                      {isPlaying ? (
                        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                      ) : (
                        <svg className="w-12 h-12 translate-x-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      )}
                    </button>

                    <button onClick={() => { if(audioRef.current) audioRef.current.currentTime += 15 }} className="p-6 bg-white/5 hover:bg-white/10 rounded-[2rem] text-slate-400 hover:text-white transition-all active:scale-90">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="py-24 flex items-center justify-center border-2 border-dashed border-white/5 rounded-[3.5rem] text-center px-10">
               <p className="text-slate-500 font-black uppercase tracking-[0.3em] leading-relaxed">Select a Surah to start your spiritual journey</p>
            </div>
          )}
        </div>
      </div>

      <audio 
        ref={audioRef} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => {
          setAudioError("Unable to stream audio. Please check your connection or try another Kari.");
          setIsPlaying(false);
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
        {surahs.map(surah => (
          <div 
            key={surah.number}
            className={`p-7 rounded-[2.75rem] border transition-all flex items-center justify-between group cursor-pointer ${
              playingSurah?.number === surah.number 
                ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800' 
                : 'bg-white border-slate-100 dark:bg-slate-800 dark:border-slate-700 hover:border-emerald-200 shadow-sm'
            }`}
            onClick={() => handlePlaySurah(surah)}
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-500 flex items-center justify-center font-black text-[13px] group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
                {surah.number}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-slate-900 dark:text-white md:text-lg truncate tracking-tight">{surah.englishName}</h4>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5 truncate">{surah.revelationType} • {surah.numberOfAyahs} {t.nav_surah === 'সূরা' ? 'আয়াত' : 'Ayahs'}</p>
              </div>
            </div>
            
            <button 
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shrink-0 ${
                playingSurah?.number === surah.number && isPlaying
                  ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200'
                  : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 dark:bg-slate-900 dark:text-slate-500'
              }`}
            >
              {playingSurah?.number === surah.number && isPlaying ? (
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg className="w-7 h-7 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AudioBookView;

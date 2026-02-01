
import React, { useState, useEffect } from 'react';
import { ViewMode, Surah, AppSettings } from './types';
import { translations } from './translations';
import SurahList from './components/SurahList';
import AyahView from './components/AyahView';
import SearchView from './components/SearchView';
import SettingsView from './components/SettingsView';
import FavoritesView from './components/FavoritesView';
import AudioBookView from './components/AudioBookView';
import DeveloperView from './components/DeveloperView';
import PrayerTimeView from './components/PrayerTimeView';
import HadithView from './components/HadithView';
import LiveVoiceView from './components/LiveVoiceView';
import RamadanSpecialView from './components/RamadanSpecialView';
import Navigation from './components/Navigation';

type NudgeType = 'welcome' | 'wisdom' | 'ai' | 'audio' | 'fonts' | 'donate';

const App: React.FC = () => {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [viewMode, setViewMode] = useState<ViewMode>('surahList');
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [activeNudge, setActiveNudge] = useState<NudgeType | null>(null);
  
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('quran_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('quran_settings');
    return saved ? JSON.parse(saved) : {
      arabicFontSize: 32,
      banglaFontSize: 18,
      isDarkMode: false,
      reciter: 'ar.alafasy',
      playbackSpeed: 1.0,
      language: 'bn',
      liveVoiceName: 'Puck'
    };
  });

  const t = translations[settings.language];

  // Splash Screen Logic
  useEffect(() => {
    const timer = setTimeout(() => setIsAppLoading(false), 2400);
    return () => clearTimeout(timer);
  }, []);

  // Theme Application Logic
  useEffect(() => {
    const root = window.document.documentElement;
    if (settings.isDarkMode) {
      root.classList.add('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#020617');
    } else {
      root.classList.remove('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#ffffff');
    }
    localStorage.setItem('quran_settings', JSON.stringify(settings));
  }, [settings.isDarkMode, settings]);

  // Online/Offline Detection
  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  // Listener for dynamic setting updates
  useEffect(() => {
    const handleSettingUpdate = (e: any) => {
      const { key, value } = e.detail;
      setSettings(prev => ({ ...prev, [key]: value }));
    };
    window.addEventListener('update_setting', handleSettingUpdate);
    return () => window.removeEventListener('update_setting', handleSettingUpdate);
  }, []);

  // Smart Nudge Logic
  useEffect(() => {
    if (isAppLoading) return;
    const nudgeSequence: { type: NudgeType, delay: number }[] = [
      { type: 'welcome' as NudgeType, delay: 1000 },
      { type: 'wisdom', delay: 8000 },
      { type: 'ai', delay: 20000 },
      { type: 'audio', delay: 45000 },
      { type: 'donate', delay: 80000 }
    ];
    const timers: number[] = [];
    nudgeSequence.forEach(nudge => {
      const timer = window.setTimeout(() => {
        const key = `quran_nudge_seen_${nudge.type}`;
        if (nudge.type === 'welcome' || !sessionStorage.getItem(key)) {
          setActiveNudge(nudge.type);
          setTimeout(() => setActiveNudge(null), 8000);
          if (nudge.type !== 'welcome') sessionStorage.setItem(key, 'true');
        }
      }, nudge.delay);
      timers.push(timer);
    });
    return () => timers.forEach(t => clearTimeout(t));
  }, [isAppLoading]);

  const dismissNudge = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveNudge(null);
  };

  const handleNudgeClick = () => {
    if (!activeNudge) return;
    switch (activeNudge) {
      case 'ai': setViewMode('liveVoice'); break;
      case 'audio': setViewMode('audioBook'); break;
      case 'donate': setViewMode('developer'); break;
      default: break;
    }
    dismissNudge();
  };

  useEffect(() => {
    localStorage.setItem('quran_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (ayahKey: string) => {
    setFavorites(prev => 
      prev.includes(ayahKey) ? prev.filter(k => k !== ayahKey) : [...prev, ayahKey]
    );
  };

  const nudgeData = (() => {
    switch (activeNudge) {
      case 'welcome': return { title: t.welcome_greeting, desc: t.welcome_back_msg, icon: '🕌' };
      case 'wisdom': return { title: t.nudge_wisdom_title, desc: t.nudge_wisdom_desc, icon: '📖' };
      case 'ai': return { title: t.nudge_ai_title, desc: t.nudge_ai_desc, icon: '🎙️' };
      case 'audio': return { title: "Listen to Quran", desc: "Soulful recitations are waiting for you.", icon: '🎧' };
      case 'donate': return { title: t.nudge_title, desc: t.nudge_desc, icon: '❤️' };
      default: return null;
    }
  })();

  if (isAppLoading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-10 transition-colors duration-500">
        <div className="relative mb-8 animate-in zoom-in-50 duration-1000">
           <div className="w-24 h-24 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl">
              <svg className="w-14 h-14 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
           </div>
        </div>
        <div className="text-center">
          <p className="arabic-text text-2xl text-emerald-600 mb-2 opacity-80">السلام عليكم</p>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">{t.welcome_greeting}</h2>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Al-Quran AI</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-600/60">{t.app_subtitle}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950 overflow-hidden relative transition-colors duration-500">
      
      {!isOnline && (
        <div className="bg-amber-600 text-white text-[10px] font-black uppercase tracking-[0.3em] py-1 text-center z-[1000]">
          Offline Mode • Reading from cache
        </div>
      )}

      {activeNudge && nudgeData && (
        <div 
          onClick={handleNudgeClick}
          className="fixed top-12 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-[2000] animate-in slide-in-from-top-12 duration-700 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] cursor-pointer"
        >
          <div className={`backdrop-blur-2xl text-white p-5 rounded-[2.5rem] shadow-2xl flex items-center gap-4 border border-white/20 relative overflow-hidden group ${activeNudge === 'donate' ? 'bg-rose-600/90 shadow-rose-900/40' : 'bg-emerald-600/90 dark:bg-emerald-500/90 shadow-emerald-900/40'}`}>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 text-2xl group-hover:scale-110 transition-transform duration-300">
               {nudgeData.icon}
            </div>
            <div className="flex-1">
               <h4 className="text-sm font-black tracking-tight leading-tight mb-0.5">{nudgeData.title}</h4>
               <p className="text-[11px] opacity-90 font-medium leading-relaxed">{nudgeData.desc}</p>
            </div>
            <button onClick={dismissNudge} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <div className="absolute bottom-0 left-0 h-1 bg-white/30 animate-[shrink_8s_linear_forwards] origin-left w-full"></div>
          </div>
        </div>
      )}

      <header className="shrink-0 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/50 z-[60] pt-safe">
        <div className="max-w-5xl mx-auto w-full px-5 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 dark:bg-emerald-500 p-2.5 rounded-xl cursor-pointer active:scale-95 transition-all shadow-lg hover:shadow-emerald-500/30" onClick={() => setViewMode('developer')}>
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
              </div>
              <div onClick={() => setViewMode('surahList')} className="cursor-pointer">
                <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">{t.app_title}</h1>
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.app_subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={() => setViewMode('developer')} className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-3 py-1.5 rounded-full border border-rose-100 dark:border-rose-900/20 active:scale-95 transition-all group">
                 <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                 <span className="text-[9px] font-black uppercase tracking-widest hidden xs:inline">{settings.language === 'bn' ? 'সদকা' : 'Sadaqah'}</span>
              </button>
              <button onClick={() => setViewMode('favorites')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'favorites' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' : 'text-slate-400'}`}>
                <svg className="w-5 h-5" fill={viewMode === 'favorites' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
              </button>
              <button onClick={() => setViewMode('settings')} className="w-9 h-9 rounded-full border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-800 dark:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden relative pb-[max(6rem,calc(6rem+env(safe-area-inset-bottom)))]">
        <div className="page-enter h-full max-w-5xl mx-auto w-full">
          {(() => {
            switch (viewMode) {
              case 'surahList': return <SurahList settings={settings} onSurahClick={(s) => { setSelectedSurah(s); setViewMode('ayahView'); }} t={t} favorites={favorites} onToggleFavorite={toggleFavorite} />;
              case 'audioBook': return <AudioBookView settings={settings} t={t} />;
              case 'prayerTimes': return <PrayerTimeView t={t} />;
              case 'ramadanSpecial': return <RamadanSpecialView settings={settings} t={t} setViewMode={setViewMode} />;
              case 'liveVoice': return <LiveVoiceView t={t} settings={settings} />;
              case 'hadith': return <HadithView t={t} language={settings.language} />;
              case 'ayahView': return selectedSurah && <AyahView surah={selectedSurah} settings={settings} favorites={favorites} onToggleFavorite={toggleFavorite} onBack={() => setViewMode('surahList')} t={t} />;
              case 'search': return <SearchView settings={settings} onSurahSelect={(s) => { setSelectedSurah(s); setViewMode('ayahView'); }} t={t} />;
              case 'favorites': return <FavoritesView settings={settings} favorites={favorites} onToggleFavorite={toggleFavorite} t={t} />;
              case 'settings': return <SettingsView settings={settings} setSettings={setSettings} onNavigateToDeveloper={() => setViewMode('developer')} t={t} />;
              case 'developer': return <DeveloperView onBack={() => setViewMode('settings')} t={t} />;
              default: return <SurahList settings={settings} onSurahClick={(s) => { setSelectedSurah(s); setViewMode('ayahView'); }} t={t} favorites={favorites} onToggleFavorite={toggleFavorite} />;
            }
          })()}
        </div>
      </main>
      <Navigation activeMode={viewMode === 'developer' ? 'settings' : viewMode} setViewMode={setViewMode} t={t} />
      <style>{`
        @keyframes shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }
      `}</style>
    </div>
  );
};

export default App;

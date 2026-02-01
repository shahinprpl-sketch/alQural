
import React from 'react';
import { ViewMode } from '../types';

interface NavigationProps {
  activeMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  t: any;
}

const Navigation: React.FC<NavigationProps> = ({ activeMode, setViewMode, t }) => {
  const navItems = [
    { mode: 'surahList', label: t.nav_surah, icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
    )},
    { mode: 'ramadanSpecial', label: 'Ramadan', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
    )},
    { mode: 'prayerTimes', label: t.nav_prayer, icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    )},
    { mode: 'liveVoice', label: t.nav_voice, icon: (
      <div className="relative">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
        {activeMode === 'liveVoice' && (
           <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
           </span>
        )}
      </div>
    )},
    { mode: 'settings', label: t.nav_settings, icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
    )}
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-slate-100 dark:border-slate-800 shadow-[0_-15px_50px_rgba(0,0,0,0.08)] z-[100] pb-safe">
      <div className="max-w-4xl mx-auto flex justify-around items-center pt-3 pb-3 px-2">
        {navItems.map(item => (
          <button
            key={item.mode}
            onClick={() => setViewMode(item.mode as ViewMode)}
            className={`flex flex-col items-center justify-center w-20 h-20 rounded-full transition-all duration-500 group relative ${
              activeMode === item.mode 
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 shadow-[0_10px_25px_-5px_rgba(16,185,129,0.1)]' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <div className={`transition-all duration-300 ${activeMode === item.mode ? 'scale-110 -translate-y-1' : 'group-hover:scale-105'}`}>
              {item.icon}
            </div>
            <span className={`text-[10px] mt-1 font-black tracking-tight uppercase transition-all duration-300 ${activeMode === item.mode ? 'opacity-100 translate-y-0.5' : 'opacity-60'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;

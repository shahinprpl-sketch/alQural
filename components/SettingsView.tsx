
import React, { useState, useEffect } from 'react';
import { AppSettings, Reciter, ViewMode, Language } from '../types';
import { getLocalizedReciters } from '../constants';

interface SettingsViewProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onNavigateToDeveloper: () => void;
  t: any;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, setSettings, onNavigateToDeveloper, t }) => {
  const [cacheCount, setCacheCount] = useState(0);

  useEffect(() => {
    const count = Object.keys(localStorage).filter(key => key.startsWith('tafsir_')).length;
    setCacheCount(count);
  }, []);

  const updateSetting = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const clearTafsirCache = () => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('tafsir_'));
    keys.forEach(key => localStorage.removeItem(key));
    setCacheCount(0);
    alert('All cached Tafsirs have been cleared.');
  };

  const devEmail = "shahin.Prpl@gmail.com";
  const localizedReciters = getLocalizedReciters(settings.language);

  return (
    <div className="p-6 space-y-10 pb-32 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{t.settings_title}</h2>
      </div>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] px-1">{t.settings_general}</h3>
        
        {/* Language Selection */}
        <div className="space-y-3 p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-500">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">{t.settings_lang_label}</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { code: 'bn', label: 'বাংলা' },
              { code: 'en', label: 'English' },
              { code: 'hi', label: 'हिंदी' },
              { code: 'ar', label: 'العربية' }
            ].map(lang => (
              <button
                key={lang.code}
                onClick={() => updateSetting('language', lang.code as Language)}
                className={`py-4 rounded-2xl text-xs font-black tracking-widest uppercase transition-all border ${
                  settings.language === lang.code
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-900/20'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dark Mode Toggle - Matches screenshot pill style */}
        <div className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
            </div>
            <span className="text-base font-black text-slate-800 dark:text-slate-100">{t.settings_dark_mode}</span>
          </div>
          <button 
            onClick={() => updateSetting('isDarkMode', !settings.isDarkMode)}
            className={`w-16 h-8 rounded-full transition-all relative outline-none shadow-inner border-2 ${settings.isDarkMode ? 'bg-emerald-600 border-emerald-500' : 'bg-slate-200 border-slate-200'}`}
          >
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${settings.isDarkMode ? 'translate-x-8.5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </section>

      {/* Voice Assistant Setting */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] px-1">{t.nav_voice}</h3>
        <div className="space-y-3 p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-500">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">{t.settings_voice_label}</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'Puck', label: t.settings_voice_male, icon: '👨‍💼' },
              { id: 'Kore', label: t.settings_voice_female, icon: '👩‍💼' }
            ].map(voice => (
              <button
                key={voice.id}
                onClick={() => updateSetting('liveVoiceName', voice.id)}
                className={`py-5 rounded-2xl flex flex-col items-center gap-2 transition-all border ${
                  settings.liveVoiceName === voice.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-900/20'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900'
                }`}
              >
                <span className="text-2xl">{voice.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-widest">{voice.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] px-1">{t.settings_font_size}</h3>
        <div className="space-y-10 p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-500">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-sm font-black text-slate-700 dark:text-slate-300">{t.settings_arabic_font}</label>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-md font-black text-slate-600 dark:text-emerald-400">{settings.arabicFontSize}PX</span>
            </div>
            <input 
              type="range" min="20" max="60" 
              value={settings.arabicFontSize} 
              onChange={(e) => updateSetting('arabicFontSize', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-sm font-black text-slate-700 dark:text-slate-300">{t.settings_bangla_font}</label>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-md font-black text-slate-600 dark:text-emerald-400">{settings.banglaFontSize}PX</span>
            </div>
            <input 
              type="range" min="12" max="32" 
              value={settings.banglaFontSize} 
              onChange={(e) => updateSetting('banglaFontSize', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] px-1">{t.settings_audio}</h3>
        <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8 transition-colors duration-500">
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block px-1">{t.settings_reciter}</label>
            <div className="relative">
              <select 
                value={settings.reciter}
                onChange={(e) => updateSetting('reciter', e.target.value)}
                className="w-full p-5 appearance-none rounded-[1.5rem] bg-slate-50 dark:bg-slate-950 dark:text-white border-none focus:ring-4 focus:ring-emerald-500/10 font-black text-slate-900 transition-all pr-12"
              >
                {localizedReciters.map(r => (
                  <option key={r.id} value={r.identifier}>{r.name}</option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">{t.settings_speed}</label>
            <div className="flex gap-2.5">
              {[0.5, 0.75, 1.0, 1.25, 1.5].map(speed => (
                <button
                  key={speed}
                  onClick={() => updateSetting('playbackSpeed', speed)}
                  className={`flex-1 py-3.5 rounded-xl text-[10px] font-black transition-all ${
                    settings.playbackSpeed === speed 
                      ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/20' 
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-800'
                  }`}
                >
                  {speed}X
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] px-1">{t.settings_storage}</h3>
        <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors duration-500">
          <div>
            <p className="text-base font-black text-slate-800 dark:text-slate-100 mb-1">{t.settings_cache_desc}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{cacheCount} {t.settings_cache_count}</p>
          </div>
          <button 
            onClick={clearTafsirCache}
            className="px-6 py-3 bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 dark:border-red-900/30 active:scale-95 transition-all"
          >
            {t.settings_cache_clear}
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] px-1">{t.settings_help}</h3>
        
        <div className="grid gap-4">
          <a 
            href={`mailto:${devEmail}?subject=${encodeURIComponent(t.feedback_subject)}`}
            className="w-full p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] flex items-center justify-between group hover:shadow-xl transition-all duration-500"
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z"></path></svg>
              </div>
              <div className="text-left">
                <p className="text-base font-black text-slate-800 dark:text-slate-100 leading-tight">{t.settings_feedback}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest mt-1">{t.settings_feedback_desc}</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-slate-300 dark:text-slate-700 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>
          </a>

          <button 
            onClick={onNavigateToDeveloper}
            className="w-full p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] flex items-center justify-between group hover:shadow-xl transition-all duration-500"
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-slate-900 dark:bg-slate-950 rounded-2xl text-white dark:text-emerald-400 flex items-center justify-center font-black">MS</div>
              <div className="text-left">
                <p className="text-base font-black text-slate-800 dark:text-slate-100 leading-tight">{t.settings_dev_profile}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest mt-1">Md Shahin • Software Engineer</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-slate-300 dark:text-slate-700 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>
          </button>

          <button 
            onClick={onNavigateToDeveloper}
            className="w-full p-6 bg-emerald-600 dark:bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-between group shadow-xl shadow-emerald-900/20 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </div>
              <div className="text-left">
                <p className="text-base font-black text-white leading-tight">{t.settings_donate}</p>
                <p className="text-[10px] text-white/70 uppercase font-black tracking-widest mt-1">{t.settings_donate_desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] bg-white text-emerald-600 px-2.5 py-1 rounded-lg font-black uppercase tracking-widest animate-pulse">Sadaqah</span>
            </div>
          </button>
        </div>
      </section>
      
      <div className="text-center py-10 opacity-30">
        <p className="text-[10px] text-slate-900 dark:text-white uppercase font-black tracking-[0.5em]">{t.settings_version}</p>
      </div>
    </div>
  );
};

export default SettingsView;


import React, { useState, useEffect } from 'react';
import { AppSettings, ViewMode, Language } from '../types';
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
    const count = Object.keys(localStorage).filter(key => key.startsWith('tafsir_') || key.startsWith('ayah_')).length;
    setCacheCount(count);
  }, []);

  const updateSetting = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const clearCache = () => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('tafsir_') || key.startsWith('ayah_'));
    keys.forEach(key => localStorage.removeItem(key));
    setCacheCount(0);
    alert('Cache cleared.');
  };

  const localizedReciters = getLocalizedReciters(settings.language);

  return (
    <div className="p-6 space-y-10 pb-32 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{t.settings_title}</h2>
      </div>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] px-1">{t.settings_general}</h3>
        
        <div className="space-y-3 p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">{t.settings_lang_label}</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['bn', 'en', 'hi', 'ar'].map(lang => (
              <button
                key={lang}
                onClick={() => updateSetting('language', lang as Language)}
                className={`py-4 rounded-2xl text-xs font-black uppercase transition-all border ${
                  settings.language === lang
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-900/20'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800'
                }`}
              >
                {lang === 'bn' ? 'বাংলা' : lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'العربية'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
            </div>
            <span className="text-base font-black text-slate-800 dark:text-slate-100">{t.settings_dark_mode}</span>
          </div>
          <button 
            onClick={() => updateSetting('isDarkMode', !settings.isDarkMode)}
            className={`w-16 h-8 rounded-full transition-all relative outline-none border-2 ${settings.isDarkMode ? 'bg-emerald-600 border-emerald-500' : 'bg-slate-200 border-slate-200'}`}
          >
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${settings.isDarkMode ? 'translate-x-8.5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </section>

      {/* New AI Assistant Voice Selection Section */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] px-1">Assistant Voice</h3>
        <div className="p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">{t.settings_voice_label}</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => updateSetting('liveVoiceName', 'Puck')}
              className={`flex flex-col items-center py-6 rounded-[2rem] border transition-all ${
                settings.liveVoiceName === 'Puck'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-900/20'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800'
              }`}
            >
              <svg className="w-8 h-8 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
              <span className="text-[11px] font-black uppercase tracking-widest">{t.settings_voice_male || 'Male'}</span>
            </button>
            <button
              onClick={() => updateSetting('liveVoiceName', 'Kore')}
              className={`flex flex-col items-center py-6 rounded-[2rem] border transition-all ${
                settings.liveVoiceName === 'Kore'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-900/20'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800'
              }`}
            >
              <svg className="w-8 h-8 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
              <span className="text-[11px] font-black uppercase tracking-widest">{t.settings_voice_female || 'Female'}</span>
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] px-1">{t.settings_font_size}</h3>
        <div className="space-y-10 p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-sm font-black text-slate-700 dark:text-slate-300">{t.settings_arabic_font}</label>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-md font-black text-slate-600 dark:text-emerald-400">{settings.arabicFontSize}PX</span>
            </div>
            <input type="range" min="20" max="60" value={settings.arabicFontSize} onChange={(e) => updateSetting('arabicFontSize', parseInt(e.target.value))} className="w-full" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-sm font-black text-slate-700 dark:text-slate-300">{t.settings_bangla_font}</label>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-md font-black text-slate-600 dark:text-emerald-400">{settings.banglaFontSize}PX</span>
            </div>
            <input type="range" min="12" max="32" value={settings.banglaFontSize} onChange={(e) => updateSetting('banglaFontSize', parseInt(e.target.value))} className="w-full" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] px-1">{t.settings_audio}</h3>
        <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block px-1">{t.settings_reciter}</label>
            <div className="relative">
              <select value={settings.reciter} onChange={(e) => updateSetting('reciter', e.target.value)} className="w-full p-5 appearance-none rounded-[1.5rem] bg-slate-50 dark:bg-slate-950 dark:text-white border-none font-black text-slate-900 transition-all pr-12">
                {localizedReciters.map(r => ( <option key={r.id} value={r.identifier}>{r.name}</option> ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] px-1">{t.settings_storage}</h3>
        <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-base font-black text-slate-800 dark:text-slate-100 mb-1">{t.settings_cache_desc}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{cacheCount} {t.settings_cache_count}</p>
          </div>
          <button onClick={clearCache} className="px-6 py-3 bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 dark:border-red-900/30">
            {t.settings_cache_clear}
          </button>
        </div>
      </section>

      <button onClick={() => onNavigateToDeveloper()} className="w-full p-6 bg-emerald-600 dark:bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-between shadow-xl shadow-emerald-900/20 active:scale-[0.98] transition-all">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </div>
          <div className="text-left">
            <p className="text-base font-black text-white leading-tight">{t.settings_donate}</p>
            <p className="text-[10px] text-white/70 uppercase font-black tracking-widest mt-1">Sadaqah Jariyah</p>
          </div>
        </div>
      </button>
      
      <div className="text-center py-10 opacity-30">
        <p className="text-[10px] text-slate-900 dark:text-white uppercase font-black tracking-[0.5em]">{t.settings_version}</p>
      </div>
    </div>
  );
};

export default SettingsView;

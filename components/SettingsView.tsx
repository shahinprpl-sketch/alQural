
import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, ViewMode, Language } from '../types';
import { getLocalizedReciters } from '../constants';
import { speakText } from '../services/tts';

interface SettingsViewProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onNavigateToDeveloper: () => void;
  t: any;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, setSettings, onNavigateToDeveloper, t }) => {
  const [cacheCount, setCacheCount] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState<{current: number, total: number} | null>(null);
  const [isFullyCached, setIsFullyCached] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState<'privacy' | 'terms' | null>(null);
  const hasSpokenPrompt = useRef(false);

  useEffect(() => {
    const count = Object.keys(localStorage).filter(key => key.startsWith('tafsir_') || key.startsWith('ayah_')).length;
    setCacheCount(count);
    
    if ('caches' in window) {
      caches.open('al-quran-v2.1-offline').then(cache => {
        cache.match('https://api.alquran.cloud/v1/surah').then(res => {
          if (res) {
            cache.match(`https://api.alquran.cloud/v1/surah/1/editions/quran-simple,bn.bengali`).then(sRes => {
              if (sRes) setIsFullyCached(true);
            });
          }
        });
      });
    }

    if (!isFullyCached && !hasSpokenPrompt.current) {
      const triggerPrompt = async () => {
        setIsAiSpeaking(true);
        try {
          await speakText(t.offline_voice_prompt, settings.liveVoiceName || 'Kore');
        } catch (e) {}
        setIsAiSpeaking(false);
        hasSpokenPrompt.current = true;
      };
      
      const timer = setTimeout(triggerPrompt, 1200);
      return () => clearTimeout(timer);
    }
  }, [isFullyCached, t.offline_voice_prompt, settings.liveVoiceName]);

  const updateSetting = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const clearCache = () => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('tafsir_') || key.startsWith('ayah_'));
    keys.forEach(key => localStorage.removeItem(key));
    setCacheCount(0);
    if ('caches' in window) {
      caches.delete('al-quran-v2.1-offline');
      setIsFullyCached(false);
    }
    alert('Cache cleared.');
  };

  const handleDownloadAll = async () => {
    if (downloadProgress) return;
    if (!navigator.onLine) {
      alert("Please connect to the internet to download for offline use.");
      return;
    }
    
    setDownloadProgress({ current: 0, total: 114 });
    const editionMap = { bn: 'bn.bengali', hi: 'hi.hindi', en: 'en.ahmedali', ar: 'ar.jalalayn' };
    const edition = editionMap[settings.language] || 'en.ahmedali';

    try {
      await fetch('https://api.alquran.cloud/v1/surah');
      for (let i = 1; i <= 114; i++) {
        try {
          await fetch(`https://api.alquran.cloud/v1/surah/${i}/editions/quran-simple,${edition}`);
        } catch (e) {
          console.warn(`Failed to fetch Surah ${i}, skipping...`);
        }
        setDownloadProgress({ current: i, total: 114 });
        if (i % 5 === 0) await new Promise(r => setTimeout(r, 100));
      }
      setIsFullyCached(true);
      setDownloadProgress(null);
    } catch (e) {
      console.error("Bulk download failed:", e);
      setDownloadProgress(null);
      alert("Offline download failed. Please check your internet connection.");
    }
  };

  const localizedReciters = getLocalizedReciters(settings.language);

  return (
    <div className="p-6 space-y-10 pb-32 max-w-3xl mx-auto transition-all duration-500">
      <div className="flex items-center gap-4">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{t.settings_title}</h2>
      </div>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] px-1">{t.settings_offline_title}</h3>
        <div className={`p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border shadow-sm space-y-6 transition-all duration-500 ${isAiSpeaking ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-slate-100 dark:border-slate-800'}`}>
          <div className="flex justify-between items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-base font-black text-slate-800 dark:text-slate-100">{t.settings_offline_desc}</p>
                {isAiSpeaking && (
                   <div className="flex gap-0.5 items-end h-4 pb-1">
                      <div className="w-0.5 h-1.5 bg-emerald-500 animate-[bounce_0.6s_infinite_0s]"></div>
                      <div className="w-0.5 h-3 bg-emerald-500 animate-[bounce_0.6s_infinite_0.1s]"></div>
                      <div className="w-0.5 h-2 bg-emerald-500 animate-[bounce_0.6s_infinite_0.2s]"></div>
                   </div>
                )}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Approx. 15MB Storage</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isAiSpeaking ? 'bg-emerald-600 text-white animate-pulse' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            </div>
          </div>
          
          {downloadProgress ? (
            <div className="space-y-3">
               <div className="flex justify-between items-end px-1">
                 <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{t.settings_offline_downloading}</span>
                 <span className="text-[11px] font-black text-slate-400">{downloadProgress.current} / {downloadProgress.total}</span>
               </div>
               <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}></div>
               </div>
            </div>
          ) : isFullyCached ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800 flex items-center gap-3">
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">{t.settings_offline_ready}</span>
            </div>
          ) : (
            <button 
              onClick={handleDownloadAll}
              className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg hover:bg-emerald-700"
            >
              {t.settings_offline_btn}
            </button>
          )}
        </div>
      </section>

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

      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] px-1">{t.settings_legal}</h3>
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <button 
            onClick={() => setShowLegalModal('privacy')}
            className="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border-b border-slate-100 dark:border-slate-800"
          >
            <div className="flex items-center gap-4">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              <span className="text-base font-black text-slate-800 dark:text-slate-100">{t.settings_privacy}</span>
            </div>
            <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>
          </button>
          <button 
            onClick={() => setShowLegalModal('terms')}
            className="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
          >
            <div className="flex items-center gap-4">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
              <span className="text-base font-black text-slate-800 dark:text-slate-100">{t.settings_terms}</span>
            </div>
            <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
      </section>

      {/* Existing Settings Sections Below... */}
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

      {/* Legal Modal */}
      {showLegalModal && (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowLegalModal(null)}></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl relative z-10 animate-in slide-in-from-bottom-10 duration-500 flex flex-col max-h-[90vh]">
            <div className="p-8 pb-4 shrink-0 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {showLegalModal === 'privacy' ? t.settings_privacy : t.settings_terms}
              </h3>
              <button onClick={() => setShowLegalModal(null)} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-8 overflow-y-auto space-y-6 text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed scrollbar-hide">
              {showLegalModal === 'privacy' ? (
                <>
                  <p><strong>Privacy Policy for Al-Quran AI</strong></p>
                  <p>At Al-Quran AI, we respect your privacy. This application is designed to be highly private by default.</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Data Storage:</strong> All your favorites, settings, and progress are stored locally on your device using Browser Storage. We do not host your personal reading data on our servers.</li>
                    <li><strong>AI Features:</strong> When you use AI Search or Tafsir, your query is processed by Google Gemini. No personally identifiable information (PII) is sent with these requests.</li>
                    <li><strong>Location:</strong> Prayer times require location access. This data is used only to fetch timings from Aladhan API and is not stored or shared.</li>
                    <li><strong>Microphone:</strong> Voice chat uses the microphone strictly while active. Audio streams are processed in real-time and not recorded.</li>
                  </ul>
                </>
              ) : (
                <>
                  <p><strong>Terms of Service</strong></p>
                  <p>By using Al-Quran AI, you agree to the following:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Usage:</strong> This app is for educational and spiritual purposes. We strive for accuracy but recommend consulting qualified scholars for definitive Islamic rulings.</li>
                    <li><strong>AI Content:</strong> AI-generated Tafsir and responses are provided for guidance and should be verified against authentic classical sources.</li>
                    <li><strong>Donations:</strong> Contributions are voluntary Sadaqah Jariyah and are used to keep the platform ad-free and maintained.</li>
                    <li><strong>Modifications:</strong> We reserve the right to update features to improve the user experience.</li>
                  </ul>
                </>
              )}
            </div>
            <div className="p-8 pt-4 bg-slate-50 dark:bg-slate-950/50 shrink-0">
              <button onClick={() => setShowLegalModal(null)} className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] active:scale-95 transition-all shadow-xl">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;

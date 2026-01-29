
import React, { useState, useEffect, useRef } from 'react';
import { speakText } from '../services/tts';

interface PrayerTimeViewProps {
  t: any;
}

interface PrayerGuidance {
  rakats: { type: string, count: number }[];
  duas: { title: string, arabic: string, translation: string }[];
}

const PrayerGuidanceModal: React.FC<{ 
  prayer: any; 
  onClose: () => void; 
  t: any;
  language: string;
}> = ({ prayer, onClose, t, language }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const PRAYER_GUIDE: Record<string, PrayerGuidance> = {
    Fajr: {
      rakats: [
        { type: language === 'bn' ? 'সুন্নাত' : 'Sunnah', count: 2 },
        { type: language === 'bn' ? 'ফরজ' : 'Farz', count: 2 }
      ],
      duas: [
        {
          title: language === 'bn' ? 'সকাল ও সন্ধ্যার দোয়া' : 'Morning Adhkar',
          arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ',
          translation: language === 'bn' ? 'হে আল্লাহ! আপনার রহমতেই আমরা সকালে উপনীত হয়েছি, আপনার রহমতেই সন্ধ্যায় উপনীত হয়েছি...' : 'O Allah, by You we enter the morning and by You we enter the evening...'
        }
      ]
    },
    Dhuhr: {
      rakats: [
        { type: language === 'bn' ? 'সুন্নাত' : 'Sunnah', count: 4 },
        { type: language === 'bn' ? 'ফরজ' : 'Farz', count: 4 },
        { type: language === 'bn' ? 'সুন্নাত' : 'Sunnah', count: 2 },
        { type: language === 'bn' ? 'নফল' : 'Nafl', count: 2 }
      ],
      duas: [
        {
          title: language === 'bn' ? 'সালাত শেষে দোয়া' : 'After Prayer',
          arabic: 'أَسْتَغْفِرُ اللَّهَ ، أَسْتَغْفِرُ اللَّهَ ، أَسْتَغْفِرُ اللَّهَ',
          translation: language === 'bn' ? 'আমি আল্লাহর কাছে ক্ষমা চাই (৩ বার)' : 'I ask Allah for forgiveness (3 times)'
        }
      ]
    },
    Asr: {
      rakats: [
        { type: language === 'bn' ? 'সুন্নাত' : 'Sunnah', count: 4 },
        { type: language === 'bn' ? 'ফরজ' : 'Farz', count: 4 }
      ],
      duas: [
        {
          title: language === 'bn' ? 'কুরআন থেকে দোয়া' : 'Quranic Dua',
          arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
          translation: language === 'bn' ? 'হে আমাদের পালনকর্তা! আমাদের দুনিয়ায় কল্যাণ দিন এবং আখেরাতেও কল্যাণ দিন...' : 'Our Lord, give us in this world that which is good and in the Hereafter that which is good...'
        }
      ]
    },
    Maghrib: {
      rakats: [
        { type: language === 'bn' ? 'ফরজ' : 'Farz', count: 3 },
        { type: language === 'bn' ? 'সুন্নাত' : 'Sunnah', count: 2 },
        { type: language === 'bn' ? 'নফল' : 'Nafl', count: 2 }
      ],
      duas: [
        {
          title: language === 'bn' ? 'ইফতারের দোয়া' : 'Iftar Dua',
          arabic: 'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّهُ',
          translation: language === 'bn' ? 'তৃষ্ণা দূর হলো, শিরাগুলো সিক্ত হলো এবং আল্লাহর ইচ্ছায় পুরস্কার নির্ধারিত হলো।' : 'The thirst is gone, the veins are moistened and the reward is confirmed, if Allah wills.'
        }
      ]
    },
    Isha: {
      rakats: [
        { type: language === 'bn' ? 'সুন্নাত' : 'Sunnah', count: 4 },
        { type: language === 'bn' ? 'ফরজ' : 'Farz', count: 4 },
        { type: language === 'bn' ? 'সুন্নাত' : 'Sunnah', count: 2 },
        { type: language === 'bn' ? 'নফল' : 'Nafl', count: 2 },
        { type: language === 'bn' ? 'বিতর' : 'Witr', count: 3 }
      ],
      duas: [
        {
          title: language === 'bn' ? 'দোয়া কুনুত (বিতর)' : 'Dua Qunut (Witr)',
          arabic: 'اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ وَعَافِنِي فِيمَنْ عَافَيْتَ وَتَوَلَّنِي فِيمَنْ تَوَلَّيْتَ',
          translation: language === 'bn' ? 'হে আল্লাহ! আপনি যাদের হেদায়াত করেছেন তাদের মধ্যে আমাকেও হেদায়াত করুন...' : 'O Allah, guide me among those You have guided, pardon me among those You have pardoned...'
        }
      ]
    }
  };

  const info = PRAYER_GUIDE[prayer.id];
  if (!info) return null;

  const handleReadAloud = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    const rakatText = info.rakats.map(r => `${r.count} Rakats ${r.type}`).join(', ');
    const firstDua = info.duas[0];
    const speechText = language === 'bn' 
      ? `${prayer.label} এর নামাজের নির্দেশিকা। রাকাআত সংখ্যা: ${rakatText}। গুরুত্বপূর্ণ দোয়া: ${firstDua.title}। ${firstDua.translation}`
      : `Instructions for ${prayer.label}. Rakats: ${rakatText}. Important Dua: ${firstDua.title}. ${firstDua.translation}`;
    
    await speakText(speechText);
    setIsSpeaking(false);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl relative z-10 animate-in slide-in-from-bottom-10 duration-500 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 pb-4 shrink-0 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d={prayer.icon}/></svg>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{prayer.label}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.nav_prayer} {language === 'bn' ? 'নির্দেশিকা' : 'Guide'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-8 pt-4 overflow-y-auto space-y-8 flex-1 scrollbar-hide">
          <button 
            onClick={handleReadAloud}
            className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all ${isSpeaking ? 'bg-emerald-600 text-white shadow-lg animate-pulse' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
            <span className="text-[10px] font-black uppercase tracking-widest">{isSpeaking ? 'Reading...' : 'Read Aloud'}</span>
          </button>

          <section className="space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400 border-b border-emerald-100 dark:border-emerald-800/50 pb-2">{language === 'bn' ? 'রাকাত সংখ্যা' : 'Rakat Breakdown'}</h4>
            <div className="grid grid-cols-2 gap-3">
              {info.rakats.map((rakat, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex justify-between items-center border border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{rakat.type}</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">{rakat.count}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400 border-b border-emerald-100 dark:border-emerald-800/50 pb-2">{language === 'bn' ? 'গুরুত্বপূর্ণ দোয়া' : 'Important Supplications'}</h4>
            <div className="space-y-4">
              {info.duas.map((dua, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{dua.title}</p>
                  </div>
                  <p className="arabic-text text-3xl text-right leading-[1.8] text-slate-900 dark:text-slate-100">{dua.arabic}</p>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-50 dark:border-slate-800 pt-4">{dua.translation}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="p-8 pt-4 bg-slate-50 dark:bg-slate-950/50 shrink-0">
          <button onClick={onClose} className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] active:scale-95 transition-all shadow-xl">{language === 'bn' ? 'বন্ধ করুন' : 'Close'}</button>
        </div>
      </div>
    </div>
  );
};

const RamadanCountdown: React.FC<{ t: any; isRamadan: boolean }> = ({ t, isRamadan }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTarget = () => {
      const r25 = new Date('2025-03-01T00:00:00').getTime();
      const r26 = new Date('2026-02-18T00:00:00').getTime();
      const now = new Date().getTime();
      return now < r25 ? r25 : r26;
    };
    const targetDate = calculateTarget();
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const dist = targetDate - now;
      if (dist < 0) { clearInterval(timer); return; }
      setTimeLeft({
        days: Math.floor(dist / (1000 * 60 * 60 * 24)),
        hours: Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((dist % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (isRamadan) {
    return (
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden mb-6">
        <div className="relative z-10 text-center">
          <span className="text-4xl mb-4 block animate-bounce">🌙</span>
          <h3 className="text-2xl font-black uppercase tracking-widest">{t.ramadan_kareem}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0f172a] rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden mb-6 border border-white/5">
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-8 px-2">
          <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500">{t.ramadan_countdown}</h3>
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
        </div>
        <div className="flex justify-between gap-3">
          {[
            { label: t.ramadan_days, value: timeLeft.days },
            { label: t.ramadan_hours, value: timeLeft.hours },
            { label: t.ramadan_minutes, value: timeLeft.minutes },
            { label: t.ramadan_seconds, value: timeLeft.seconds },
          ].map((item, idx) => (
            <div key={idx} className="flex-1 bg-slate-800/40 backdrop-blur-md rounded-[1.5rem] p-4 text-center border border-white/5">
              <div className="text-2xl font-black tabular-nums">{item.value.toString().padStart(2, '0')}</div>
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PrayerTimeView: React.FC<PrayerTimeViewProps> = ({ t }) => {
  const [timings, setTimings] = useState<any>(null);
  const [dateInfo, setDateInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [manualCity, setManualCity] = useState<string>(() => localStorage.getItem('quran_manual_city') || '');
  const [detectingGps, setDetectingGps] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<any | null>(null);

  const fetchByAddress = async (address: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://api.aladhan.com/v1/timingsByAddress?address=${encodeURIComponent(address)}&method=2`);
      const data = await res.json();
      if (data.code === 200) {
        setTimings(data.data.timings);
        setDateInfo(data.data.date);
        setLocationName(address);
        localStorage.setItem('quran_manual_city', address);
      } else {
        setError("Location not found.");
      }
    } catch (err) {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) return;
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`);
          const data = await res.json();
          setTimings(data.data.timings);
          setDateInfo(data.data.date);
          setLocationName(data.data.meta.timezone || "Current Location");
        } catch (err) {} finally { setDetectingGps(false); }
      },
      () => { setDetectingGps(false); },
      { timeout: 10000 }
    );
  };

  useEffect(() => {
    if (manualCity) fetchByAddress(manualCity);
    else {
      handleDetectLocation();
      setTimeout(() => { if (!timings) fetchByAddress("Dhaka"); }, 3000);
    }
  }, []);

  const prayers = [
    { id: 'Fajr', label: t.prayer_fajr, key: 'Fajr', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
    { id: 'Dhuhr', label: t.prayer_dhuhr, key: 'Dhuhr', icon: 'M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z' },
    { id: 'Asr', label: t.prayer_asr, key: 'Asr', icon: 'M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5' },
    { id: 'Maghrib', label: t.prayer_maghrib, key: 'Maghrib', icon: 'M12 3v1m8 8h1M3 12h1' },
    { id: 'Isha', label: t.prayer_isha, key: 'Isha', icon: 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto pb-32">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{t.prayer_title}</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">{locationName || "Locating..."}</p>
        </div>
      </div>

      <RamadanCountdown t={t} isRamadan={dateInfo?.hijri?.month?.number === 9} />

      <form onSubmit={(e) => { e.preventDefault(); if(manualCity) fetchByAddress(manualCity); }} className="relative flex gap-2">
        <input 
          type="text" 
          value={manualCity}
          onChange={(e) => setManualCity(e.target.value)}
          placeholder="City"
          className="w-full p-5 pl-12 bg-white dark:bg-slate-800 dark:text-white rounded-[2rem] border border-slate-200 outline-none"
        />
        <button type="submit" className="px-6 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Set</button>
      </form>

      {loading ? (
        <div className="py-24 text-center text-slate-400 font-black uppercase text-[10px]">Syncing...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {prayers.map((p) => (
            <button key={p.id} onClick={() => setSelectedPrayer(p)} className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] flex items-center justify-between group active:scale-95 transition-all text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d={p.icon}/></svg></div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white">{p.label}</h3>
                  <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Tap for Info</p>
                </div>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 tabular-nums">{timings ? timings[p.key] : '--:--'}</div>
            </button>
          ))}
        </div>
      )}

      {selectedPrayer && <PrayerGuidanceModal prayer={selectedPrayer} onClose={() => setSelectedPrayer(null)} t={t} language="bn" />}
    </div>
  );
};

export default PrayerTimeView;

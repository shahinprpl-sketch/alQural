
import React, { useState, useEffect } from 'react';

interface PrayerTimeViewProps {
  t: any;
}

const PrayerTimeView: React.FC<PrayerTimeViewProps> = ({ t }) => {
  const [timings, setTimings] = useState<any>(null);
  const [dateInfo, setDateInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [manualCity, setManualCity] = useState<string>(() => localStorage.getItem('quran_manual_city') || '');
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

  const getNextRamadanDate = () => {
    return new Date('2026-02-18T00:00:00');
  };

  useEffect(() => {
    const target = getNextRamadanDate();
    const interval = setInterval(() => {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft(null);
        clearInterval(interval);
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
        setError("Location not found. Please try a different city name.");
      }
    } catch (err) {
      setError("Failed to fetch timings. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const getPrayerTimes = () => {
    if (manualCity) {
      fetchByAddress(manualCity);
      return;
    }

    if (!navigator.geolocation) {
      setError("Geolocation not supported. Please enter your city manually.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`);
          const data = await res.json();
          setTimings(data.data.timings);
          setDateInfo(data.data.date);
          setLocationName(data.data.meta.timezone);
          setLoading(false);
        } catch (err) {
          setError("Failed to fetch timings. Please enter city manually.");
          setLoading(false);
        }
      },
      () => {
        setError("Location access denied. Please enter your city manually.");
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    getPrayerTimes();
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCity.trim()) {
      fetchByAddress(manualCity);
    }
  };

  const prayers = [
    { id: 'Fajr', label: t.prayer_fajr, key: 'Fajr', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
    { id: 'Sunrise', label: t.prayer_sunrise, key: 'Sunrise', icon: 'M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zM4 10.5H1v2h3v-2zm9-9.5h-2v3h2V1z' },
    { id: 'Dhuhr', label: t.prayer_dhuhr, key: 'Dhuhr', icon: 'M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z' },
    { id: 'Asr', label: t.prayer_asr, key: 'Asr', icon: 'M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5' },
    { id: 'Maghrib', label: t.prayer_maghrib, key: 'Maghrib', icon: 'M12 3v1m8 8h1M3 12h1' },
    { id: 'Isha', label: t.prayer_isha, key: 'Isha', icon: 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto pb-32">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-1 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{t.prayer_title}</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1">{locationName || "Location not set"}</p>
        </div>
        
        {dateInfo && (
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 px-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {dateInfo.hijri.day} {dateInfo.hijri.month.en} {dateInfo.hijri.year}
                </span>
                <span className="text-lg">🌙</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manual Location Input */}
      <form onSubmit={handleManualSubmit} className="relative group">
        <input 
          type="text" 
          value={manualCity}
          onChange={(e) => setManualCity(e.target.value)}
          placeholder="Enter City Name (e.g. Dhaka, London)"
          className="w-full p-5 pl-14 bg-white dark:bg-slate-800 dark:text-white rounded-[2rem] border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-emerald-500/10 outline-none shadow-sm transition-all"
        />
        <svg className="w-6 h-6 absolute left-5 top-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        <button type="submit" className="absolute right-3 top-3 bottom-3 px-6 bg-emerald-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-emerald-900/20">Set</button>
      </form>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading Timings...</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-[2.5rem] text-center">
           <p className="text-amber-700 dark:text-amber-400 font-bold text-sm mb-4">{error}</p>
        </div>
      ) : (
        <>
          <div className="bg-[#1a202c] rounded-[3rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-50 mb-8 text-center">{t.fasting_title}</h3>
              <div className="grid grid-cols-2 gap-8 divide-x divide-white/5">
                 <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-3">{t.prayer_sehri}</p>
                    <div className="text-5xl md:text-7xl font-black">{timings?.Fajr || '--:--'}</div>
                 </div>
                 <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-3">{t.prayer_iftar}</p>
                    <div className="text-5xl md:text-7xl font-black text-emerald-400">{timings?.Maghrib || '--:--'}</div>
                 </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {prayers.map((p) => (
              <div key={p.id} className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center group transition-all">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900/50 text-slate-400 rounded-[1.75rem] flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d={p.icon}/></svg>
                </div>
                <div className="ml-5 md:ml-8 flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{p.id}</p>
                  <h3 className="text-base font-black text-slate-800 dark:text-white">{p.label}</h3>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 md:text-4xl">{timings ? timings[p.key] : '--:--'}</div>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="h-12"></div>
    </div>
  );
};

export default PrayerTimeView;

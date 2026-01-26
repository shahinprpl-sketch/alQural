
import React, { useState, useEffect, useRef } from 'react';

interface PrayerTimeViewProps {
  t: any;
}

const RamadanCountdown: React.FC<{ t: any; isRamadan: boolean }> = ({ t, isRamadan }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Dynamically calculate the target date for the next Ramadan.
    // Based on the user's current context (1447 AH), the next Ramadan is approx Feb 18, 2026.
    const calculateTarget = () => {
      const ramadan2025 = new Date('2025-03-01T00:00:00').getTime();
      const ramadan2026 = new Date('2026-02-18T00:00:00').getTime();
      const now = new Date().getTime();
      
      // If 2025 has passed, target 2026
      return now < ramadan2025 ? ramadan2025 : ramadan2026;
    };

    const targetDate = calculateTarget();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (isRamadan) {
    return (
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden group mb-6">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 text-center">
          <span className="text-4xl mb-4 block animate-bounce">🌙</span>
          <h3 className="text-2xl font-black uppercase tracking-widest">{t.ramadan_kareem || "Ramadan Kareem"}</h3>
          <p className="text-xs font-bold opacity-80 mt-2 uppercase tracking-[0.3em]">{t.fasting_title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0f172a] dark:bg-[#020617] rounded-[3rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden group mb-6 border border-white/5">
      <div className="absolute inset-0 bg-emerald-500/5 opacity-50 group-hover:opacity-100 transition-opacity"></div>
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-8 px-2">
          <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500">{t.ramadan_countdown}</h3>
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]"></span>
        </div>
        
        <div className="flex justify-between gap-3">
          {[
            { label: t.ramadan_days, value: timeLeft.days },
            { label: t.ramadan_hours, value: timeLeft.hours },
            { label: t.ramadan_minutes, value: timeLeft.minutes },
            { label: t.ramadan_seconds, value: timeLeft.seconds },
          ].map((item, idx) => (
            <div key={idx} className="flex-1 bg-slate-800/40 backdrop-blur-md rounded-[1.5rem] p-4 md:p-6 text-center border border-white/5 transition-transform hover:scale-105 duration-300">
              <div className="text-2xl md:text-4xl font-black tabular-nums text-white mb-1">{item.value.toString().padStart(2, '0')}</div>
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
        setError("Location not found. Please try another city.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`);
          const data = await res.json();
          setTimings(data.data.timings);
          setDateInfo(data.data.date);
          setLocationName(data.data.meta.timezone || "Current Location");
          setError(null);
        } catch (err) {
          setError("Failed to fetch timings for your location.");
        } finally {
          setDetectingGps(false);
        }
      },
      () => {
        setError("Location access denied. Please enter city manually.");
        setDetectingGps(false);
      },
      { timeout: 10000 }
    );
  };

  useEffect(() => {
    if (manualCity) {
      fetchByAddress(manualCity);
    } else {
      handleDetectLocation();
      setTimeout(() => {
        if (!timings && !loading) fetchByAddress("Dhaka");
      }, 3000);
    }
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

  const isRamadan = dateInfo?.hijri?.month?.number === 9;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto pb-32">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-1 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{t.prayer_title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">{locationName || "Locating..."}</p>
            {detectingGps && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>}
          </div>
        </div>
        
        {dateInfo && (
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 px-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
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

      <RamadanCountdown t={t} isRamadan={isRamadan} />

      <div className="space-y-3">
        <form onSubmit={handleManualSubmit} className="relative group flex gap-2">
          <div className="relative flex-1">
            <input 
              type="text" 
              value={manualCity}
              onChange={(e) => setManualCity(e.target.value)}
              placeholder="Search City (e.g. Dhaka, London)"
              className="w-full p-5 pl-14 bg-white dark:bg-slate-800 dark:text-white rounded-[2rem] border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-emerald-500/10 outline-none shadow-sm transition-all"
            />
            <svg className="w-6 h-6 absolute left-5 top-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <button type="submit" className="absolute right-3 top-3 bottom-3 px-6 bg-emerald-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-emerald-900/20">Set</button>
          </div>
          <button 
            type="button"
            onClick={handleDetectLocation}
            className={`p-5 rounded-[2rem] border transition-all ${detectingGps ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}
          >
            <svg className={`w-6 h-6 ${detectingGps ? 'animate-spin text-emerald-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </button>
        </form>
        {error && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-5 px-1">{error}</p>}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 border-4 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Syncing Timings...</p>
        </div>
      ) : (
        <>
          <div className="bg-[#1a202c] rounded-[3rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
            <div className="relative z-10">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-50 mb-8 text-center">{t.fasting_title}</h3>
              <div className="grid grid-cols-2 gap-8 divide-x divide-white/5">
                 <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-3">{t.prayer_sehri}</p>
                    <div className="text-5xl md:text-7xl font-black tabular-nums">{timings?.Fajr || '--:--'}</div>
                 </div>
                 <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-3">{t.prayer_iftar}</p>
                    <div className="text-5xl md:text-7xl font-black text-emerald-400 tabular-nums">{timings?.Maghrib || '--:--'}</div>
                 </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prayers.map((p) => (
              <div key={p.id} className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900/50 text-slate-400 rounded-[1.25rem] flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d={p.icon}/></svg>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{p.id}</p>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white leading-tight">{p.label}</h3>
                  </div>
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-slate-100 tabular-nums">{timings ? timings[p.key] : '--:--'}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PrayerTimeView;

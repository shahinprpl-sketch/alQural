
import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, ViewMode } from '../types';
import { speakText } from '../services/tts';

interface RamadanSpecialViewProps {
  settings: AppSettings;
  t: any;
  setViewMode: (mode: ViewMode) => void;
}

const RamadanSpecialView: React.FC<RamadanSpecialViewProps> = ({ settings, t, setViewMode }) => {
  const [timings, setTimings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasPlayedSuccessSound = useRef(false);

  // Gamification states
  const [ramadanDay, setRamadanDay] = useState<number>(1);
  const [history, setHistory] = useState<Record<number, number>>(() => {
    const saved = localStorage.getItem('ramadan_history');
    return saved ? JSON.parse(saved) : {};
  });

  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('ramadan_checklist_today');
    const date = new Date().toDateString();
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === date) return parsed.items;
    }
    return {
      namaz: false,
      quran: false,
      sadaqah: false,
      zikr: false,
      tarawih: false,
      support: false
    };
  });

  const checklistItems = [
    { id: 'namaz', label: settings.language === 'bn' ? "৫ ওয়াক্ত নামাজ" : "5 Daily Prayers", icon: "🕌" },
    { id: 'quran', label: settings.language === 'bn' ? "কুরআন তিলাওয়াত" : "Quran Recitation", icon: "📖" },
    { id: 'tarawih', label: settings.language === 'bn' ? "তারাবীহ নামাজ" : "Tarawih Prayers", icon: "🌙" },
    { id: 'zikr', label: settings.language === 'bn' ? "সকাল-সন্ধ্যার যিকির" : "Adhkar (Zikr)", icon: "📿" },
    { id: 'sadaqah', label: settings.language === 'bn' ? "আজকের দান-সদকা" : "Today's Charity", icon: "💰" },
    { id: 'support', label: settings.language === 'bn' ? "সদকায়ে জারিয়া (এপ সাপোর্ট)" : "Sadaqah Jariyah (App Support)", icon: "❤️" },
  ];

  const totalItems = checklistItems.length;
  const completedItems = Object.values(checklist).filter(Boolean).length;
  const completionPercentage = Math.round((completedItems / totalItems) * 100);

  // Determine Current Ramadan Day
  useEffect(() => {
    const startOfRamadan = new Date('2025-03-01').getTime();
    const today = new Date().getTime();
    const diff = Math.floor((today - startOfRamadan) / (1000 * 60 * 60 * 24)) + 1;
    setRamadanDay(Math.min(30, Math.max(1, diff)));
  }, []);

  // Sync completion to history
  useEffect(() => {
    const newHistory = { ...history, [ramadanDay]: completionPercentage };
    setHistory(newHistory);
    localStorage.setItem('ramadan_history', JSON.stringify(newHistory));
  }, [completionPercentage, ramadanDay]);

  // Success Sound and Confetti Effect
  useEffect(() => {
    if (completionPercentage === 100 && !hasPlayedSuccessSound.current) {
      setShowConfetti(true);
      hasPlayedSuccessSound.current = true;
      
      const playCelebrationSound = async () => {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); 
          oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.5); 
          gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.5);
        } catch (e) {}
        await speakText("Masha Allah! You've reached a perfect score for today. Keep progressing in your journey.", settings.liveVoiceName || 'Kore');
      };

      playCelebrationSound();
      const timer = setTimeout(() => setShowConfetti(false), 8000);
      return () => clearTimeout(timer);
    } else if (completionPercentage < 100) {
      hasPlayedSuccessSound.current = false;
    }
  }, [completionPercentage, settings.liveVoiceName]);

  useEffect(() => {
    localStorage.setItem('ramadan_checklist_today', JSON.stringify({
      date: new Date().toDateString(),
      items: checklist
    }));
  }, [checklist]);

  useEffect(() => {
    const fetchTimings = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://api.aladhan.com/v1/timingsByAddress?address=Dhaka&method=2`);
        const data = await res.json();
        if (data.code === 200) setTimings(data.data.timings);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimings();
  }, []);

  const handleRecite = async (text: string, id: string) => {
    if (isSpeaking) return;
    setIsSpeaking(id);
    await speakText(text, settings.liveVoiceName);
    setIsSpeaking(null);
  };

  const toggleCheck = (id: string) => {
    setChecklist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const currentRank = (() => {
    if (ramadanDay <= 10) return t.ramadan_rank_1;
    if (ramadanDay <= 20) return t.ramadan_rank_2;
    return t.ramadan_rank_3;
  })();

  const streak = Object.values(history).filter(p => p === 100).length;

  const generateSuccessCard = async () => {
    setIsGeneratingCard(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 1080;
    canvas.height = 1080;
    const grd = ctx.createLinearGradient(0, 0, 0, 1080);
    grd.addColorStop(0, "#065f46"); 
    grd.addColorStop(1, "#064e3b"); 
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 1080, 1080);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 40px 'Hind Siliguri', sans-serif";
    ctx.fillText(settings.language === 'bn' ? "আল-কুরআন এআই অ্যাপ" : "AL-QURAN AI APP", 540, 120);
    ctx.strokeStyle = "#10b981"; 
    ctx.lineWidth = 45;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(540, 420, 200, -Math.PI / 2, Math.PI * 1.5); 
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "black 140px sans-serif";
    ctx.fillText("100%", 540, 430);
    ctx.font = "bold 35px 'Hind Siliguri', sans-serif";
    ctx.fillText(`${t.ramadan_day_label} ${ramadanDay} ${t.ramadan_level}`, 540, 480);
    
    ctx.fillStyle = "#ffffff"; 
    ctx.font = "bold 55px 'Hind Siliguri', sans-serif";
    ctx.fillText(currentRank, 540, 680);
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "500 32px 'Hind Siliguri', sans-serif";
    ctx.fillText(settings.language === 'bn' ? "আমি আমার আজকের লক্ষ্য পূরণ করেছি।" : "I have fulfilled my spiritual goals for today.", 540, 750);
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement('a');
    link.download = `Ramadan_Journey_Day_${ramadanDay}.png`;
    link.href = dataUrl;
    link.click();
    setIsGeneratingCard(false);
  };

  const ashraData = [
    { 
      title: settings.language === 'bn' ? "১ম দশক: রহমত" : "1st Ashra: Mercy",
      dua: "رَبِّ اغْفِرْ وَارْحَمْ وَأَنْتَ خَيْرُ الرَّاحِمِينَ",
      translation: settings.language === 'bn' ? "হে আমার পালনকর্তা! ক্ষমা করুন ও দয়া করুন এবং আপনিই শ্রেষ্ঠ দয়ালু।" : "My Lord! Forgive and have mercy, for You are the best of those who show mercy."
    },
    { 
      title: settings.language === 'bn' ? "২য় দশক: মাগফিরাত" : "2nd Ashra: Forgiveness",
      dua: "أَسْتَغْفِرُ اللهَ رَبِّي مِنْ كُلِّ ذَنْبٍ وَأَتُوبُ إِلَيْهِ",
      translation: settings.language === 'bn' ? "আমি আমার পালনকর্তার কাছে আমার সব পাপের জন্য ক্ষমা প্রার্থনা করছি এবং তাঁর কাছেই ফিরে আসছি।" : "I ask forgiveness of my Lord for all my sins and turn to Him in repentance."
    },
    { 
      title: settings.language === 'bn' ? "৩য় দশক: নাজাত" : "3rd Ashra: Protection",
      dua: "اَللَّهُمَّ أَجِرْنِي مِنَ النَّارِ",
      translation: settings.language === 'bn' ? "হে আল্লাহ! আমাকে জাহান্নামের আগুন থেকে রক্ষা করুন।" : "O Allah! Protect me from the Hellfire."
    }
  ];

  return (
    <div className="p-6 space-y-8 pb-32 max-w-4xl mx-auto bg-slate-50 dark:bg-slate-950 min-h-full transition-colors duration-500">
      <canvas ref={canvasRef} className="hidden" />
      
      {/* 30 Day Roadmap Component */}
      <section className="space-y-4">
        <div className="flex justify-between items-end px-2">
           <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
            {t.ramadan_journey}
          </h4>
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-800">
            {t.ramadan_day_label} {ramadanDay} / 30
          </span>
        </div>

        {/* Updated roadmap scroller with end gaps */}
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-6">
          <div className="shrink-0 w-6" /> {/* Start gap */}
          {Array.from({ length: 30 }).map((_, i) => {
            const day = i + 1;
            const isCompleted = (history[day] || 0) === 100;
            const isCurrent = day === ramadanDay;
            const isLocked = day > ramadanDay;

            return (
              <div key={day} className="flex flex-col items-center gap-3 shrink-0">
                <div 
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-sm font-black transition-all duration-500 relative border-2 ${
                    isCurrent ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg scale-110' :
                    isCompleted ? 'bg-amber-400 text-amber-900 border-amber-200 shadow-md' :
                    isLocked ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 border-transparent opacity-50' :
                    'bg-white dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-800'
                  }`}
                >
                  {isCompleted ? '★' : day}
                  {isCurrent && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest ${isCurrent ? 'text-emerald-600' : 'text-slate-400 opacity-60'}`}>
                  {t.ramadan_day_label} {day}
                </span>
              </div>
            );
          })}
          <div className="shrink-0 w-8" /> {/* End gap */}
        </div>
      </section>

      {/* Rank and Streak Card */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t.ramadan_level}</p>
            <h5 className="text-sm font-black text-slate-900 dark:text-white leading-tight">{currentRank}</h5>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t.ramadan_streak}</p>
            <h5 className="text-sm font-black text-slate-900 dark:text-white leading-tight">{streak} {t.ramadan_days}</h5>
          </div>
        </div>
      </div>

      <div className="text-center space-y-2 py-4 relative">
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[1000]">
             <div className="text-4xl animate-bounce space-x-2">
               <span>🎊</span><span>✨</span><span>🌟</span><span>🕌</span>
             </div>
          </div>
        )}
        <span className="text-4xl animate-bounce inline-block">🌙</span>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">
          Ramadan Kareem
        </h2>
        <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.4em]">{t.app_subtitle}</p>
      </div>

      {/* Progress Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-end px-2">
          <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
            {settings.language === 'bn' ? 'আজকের লক্ষ্য' : 'Today\'s Spiritual Goals'}
          </h4>
          <span className={`text-[11px] font-black px-4 py-1.5 rounded-full transition-all duration-500 shadow-sm ${completionPercentage === 100 ? 'bg-emerald-600 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
            {completionPercentage}% {settings.language === 'bn' ? 'সাফল্য' : 'Success'}
          </span>
        </div>

        <div className="relative pt-2">
           <div className="w-full bg-slate-200 dark:bg-slate-800 h-4 rounded-full overflow-hidden shadow-inner p-1">
             <div 
               className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000 ease-out relative"
               style={{ width: `${completionPercentage}%` }}
             >
                <div className="absolute top-0 right-0 h-full w-2 bg-white/20 blur-[1px]"></div>
             </div>
           </div>
        </div>

        {completionPercentage === 100 && (
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-8 rounded-[3rem] text-white text-center shadow-2xl animate-in zoom-in-95 duration-700 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 transition-transform group-hover:scale-125">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
             </div>
             <div className="relative z-10 space-y-4">
               <span className="text-5xl mb-2 block animate-bounce">🏆</span>
               <h5 className="font-black text-2xl uppercase tracking-tighter">
                 {settings.language === 'bn' ? 'মাশাআল্লাহ!' : 'SubhanAllah!'}
               </h5>
               <p className="text-sm text-emerald-50 leading-relaxed font-bold">
                 {settings.language === 'bn' 
                   ? 'আপনি আজকের সব আধ্যাত্মিক লক্ষ্য পূরণ করেছেন। আপনার এই নেক আমল কবুল হোক।' 
                   : 'You have completed all your spiritual goals for today. May Allah accept your efforts.'}
               </p>
               <div className="pt-6 border-t border-white/20 mt-6 space-y-3">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Celebrate your growth</p>
                 <div className="flex flex-col gap-3">
                    <button 
                      onClick={generateSuccessCard}
                      disabled={isGeneratingCard}
                      className="w-full bg-amber-400 text-emerald-950 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isGeneratingCard ? (
                          <div className="w-5 h-5 border-2 border-emerald-950 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        )}
                        {settings.language === 'bn' ? 'সাফল্যের কার্ড ডাউনলোড করুন' : 'Download Success Card'}
                    </button>
                    <button 
                      onClick={() => setViewMode('developer')}
                      className="w-full bg-white/20 backdrop-blur-md text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/30"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        {settings.language === 'bn' ? 'সদকায়ে জারিয়া দান করুন' : 'Donate Sadaqah Jariyah'}
                    </button>
                 </div>
               </div>
             </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800 transition-all duration-500">
          {checklistItems.map(item => (
            <div key={item.id} onClick={() => toggleCheck(item.id)} className="py-6 flex items-center justify-between cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-2 px-4 rounded-2xl transition-all">
              <div className="flex items-center gap-4">
                <span className={`text-xl transition-all duration-300 ${checklist[item.id] ? 'opacity-40 grayscale' : 'opacity-100'}`}>{item.icon}</span>
                <span className={`text-sm font-bold transition-all duration-300 ${checklist[item.id] ? 'text-slate-300 line-through scale-95 opacity-50' : 'text-slate-700 dark:text-slate-200'}`}>
                  {item.label}
                </span>
              </div>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 transform ${checklist[item.id] ? 'bg-emerald-500 text-white rotate-0 scale-110 shadow-lg shadow-emerald-500/20' : 'bg-slate-50 dark:bg-slate-800 text-transparent rotate-12 scale-100 border border-slate-100 dark:border-slate-700'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Prayer and Dhikr Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden group transition-all duration-500">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
          <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">{t.prayer_sehri}</h3>
                <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{loading ? '--:--' : timings?.Imsak || '--:--'}</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl flex items-center justify-center"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v1m8 8h1M3 12h1"/></svg></div>
            </div>
            <div className="pt-6 border-t border-slate-50 dark:border-slate-800 space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">{settings.language === 'bn' ? 'সেহরির দোয়া' : 'Dua for Sehri'}</p>
                <button 
                  onClick={() => handleRecite("نَوَيْتُ اَنْ اَصُوْمَ غَدًا مِّনْ شَهْرِ রَمْضَانَ الْمُبَارَكِ فَرْضًا لَّكَ يَا اَللهُ فَتَقَبَّলْ مِنِّى اِنَّكَ اَنْتَ السَّমِيْعُ الْعَلِيْمُ", 'sehri')}
                  className={`p-2 rounded-xl transition-all ${isSpeaking === 'sehri' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-emerald-600'}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                </button>
              </div>
              <p className="arabic-text text-xl text-right leading-loose text-slate-900 dark:text-white">نَوَيْتُ اَنْ اَصُوْمَ غَدًا مِّনْ شَهْرِ রَمْضَانَ الْمُبَارَكِ فَرْضًا لَّكَ يَا اَللهُ فَتَقَبَّলْ مِنِّى اِنَّكَ اَنْتَ السَّমِيْعُ الْعَلِيْمُ</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden group transition-all duration-500">
           <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all"></div>
           <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">{t.prayer_iftar}</h3>
                <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{loading ? '--:--' : timings?.Maghrib || '--:--'}</p>
              </div>
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-50 dark:border-slate-800 space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">{settings.language === 'bn' ? 'ইফতারের দোয়া' : 'Dua for Iftar'}</p>
                <button 
                  onClick={() => handleRecite("اَللَّهُمَّ لَكَ صُمْতُ وَعَلَى رِزْقِكَ أَفْطَرْتُ", 'iftar')}
                  className={`p-2 rounded-xl transition-all ${isSpeaking === 'iftar' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-emerald-600'}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                </button>
              </div>
              <p className="arabic-text text-xl text-right leading-loose text-slate-900 dark:text-white">اَللَّهُمَّ لَكَ صُمْতُ وَعَلَى رِزْقِكَ أَفْطَرْتُ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ashra Roadmap */}
      <section className="space-y-4">
        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 px-2">{settings.language === 'bn' ? 'রমজানের তিন দশক' : 'The Three Stages of Ramadan'}</h4>
        <div className="space-y-4">
          {ashraData.map((ashra, idx) => (
            <div key={idx} className={`bg-white dark:bg-slate-900 rounded-[2rem] p-8 border space-y-4 transition-all duration-500 ${
              (idx === 0 && ramadanDay <= 10) || (idx === 1 && ramadanDay > 10 && ramadanDay <= 20) || (idx === 2 && ramadanDay > 20) 
              ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-100 dark:border-slate-800'
            }`}>
              <div className="flex justify-between items-center">
                <h5 className="text-sm font-black text-emerald-600">{ashra.title}</h5>
                <button 
                  onClick={() => handleRecite(ashra.dua, `ashra-${idx}`)}
                  className={`p-2 rounded-xl transition-all ${isSpeaking === `ashra-${idx}` ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-emerald-600'}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                </button>
              </div>
              <p className="arabic-text text-2xl text-right leading-loose text-slate-900 dark:text-white">{ashra.dua}</p>
              <p className="text-xs font-medium text-slate-500 italic border-t border-slate-50 dark:border-slate-800 pt-4 leading-relaxed">{ashra.translation}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Large gap at the end of the app to prevent content from being hidden by the nav bar */}
      <div className="h-40" aria-hidden="true"></div>
    </div>
  );
};

export default RamadanSpecialView;

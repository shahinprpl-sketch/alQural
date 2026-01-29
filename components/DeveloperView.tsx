
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

interface DeveloperViewProps {
  onBack: () => void;
  t: any;
}

const BangladeshFlag = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 10 6" className={className}>
    <rect width="10" height="6" fill="#006a4e" />
    <circle cx="4.5" cy="3" r="2" fill="#f42a41" />
  </svg>
);

const DeveloperView: React.FC<DeveloperViewProps> = ({ onBack, t }) => {
  const [showDonatePopup, setShowDonatePopup] = useState(false);
  const [inspiration, setInspiration] = useState<string>('');
  const [loadingInspiration, setLoadingInspiration] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  useEffect(() => {
    const fetchInspiration = async () => {
      setLoadingInspiration(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const targetLang = t.app_title === 'আল-কুরআন' ? 'Bangla' : t.app_title === 'अल-क़ुरान' ? 'Hindi' : 'English';
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Write a short, heartwarming Islamic inspirational message in ${targetLang} (max 80 words). Focus on peace, hope, and the beauty of Islam. Tone: Professional, supportive.`,
          config: { temperature: 0.8, topP: 0.95 },
        });
        setInspiration(response.text || '');
      } catch (err) { console.error(err); } finally { setLoadingInspiration(false); }
    };
    fetchInspiration();
  }, [t.app_title]);

  const devEmail = "shahin.Prpl@gmail.com";
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  const donationMethods = [
    { name: "bKash", value: "01919462158", sub: t.dev_bkash || "bKash (Personal)" },
    { name: "Nagad", value: "01919462158", sub: t.dev_nagad || "Nagad (Personal)" },
    { name: "Dutch-Bangla Bank", value: "1481030371831", sub: "Md Shahin • Shyamoli branch" },
    { name: "Bank Asia", value: "01034016742", sub: "Md Shahin • Sylhet Main branch" }
  ];

  return (
    <div className="flex flex-col min-h-full pb-32 bg-[#f8fafc] dark:bg-slate-900 overflow-x-hidden">
      <div className="h-44 shrink-0 bg-slate-900 dark:bg-slate-800 relative">
        <button onClick={onBack} className="absolute top-6 left-6 p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white backdrop-blur-md transition-all z-20">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
        </button>
      </div>

      <div className="px-6 -mt-16 relative z-10">
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl p-8 border border-slate-100 dark:border-slate-700">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6">
                <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-emerald-500 to-emerald-200 dark:from-emerald-600 dark:to-emerald-400 shadow-lg">
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-3xl font-black text-white">MS</div>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 p-2 rounded-full shadow-md">
                   <BangladeshFlag className="w-6 h-4 rounded shadow-sm" />
                </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Md Shahin</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1 mb-6">Software Engineer & Dawah Worker</p>
            
            <div className="flex gap-3 w-full">
               <button onClick={() => copyToClipboard(devEmail, "Email")} className="flex-1 px-4 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Copy Email</button>
               <a href={`mailto:${devEmail}`} className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center active:scale-95 transition-all">Message</a>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 flex-1">
        {/* Highlighted Donation Section */}
        <div className="bg-gradient-to-br from-rose-600 to-rose-700 dark:from-rose-800 dark:to-rose-950 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group ring-4 ring-rose-500/30 animate-pulse-subtle">
            {/* Animated Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shine transition-all"></div>
            
            {/* Decorative Heart Icon in the Highlighted Area */}
            <div className="absolute top-8 right-8 text-white/20 group-hover:text-white/40 transition-colors animate-float">
               <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <span className="inline-block bg-white/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">Sadaqah Jariyah</span>
                <span className="inline-block bg-amber-400 text-slate-900 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">Featured</span>
              </div>
              <h4 className="font-black text-2xl mb-4 leading-tight">{t.dev_donate_cta_title}</h4>
              <p className="text-xs text-white/80 leading-relaxed mb-10 font-medium">{t.dev_donate_cta_desc}</p>
              <button onClick={() => setShowDonatePopup(true)} className="w-full bg-white text-rose-700 py-5 rounded-[1.75rem] font-black text-sm shadow-[0_20px_40px_-10px_rgba(255,255,255,0.4)] active:scale-[0.97] transition-all hover:bg-slate-50 flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  {t.dev_donate_btn}
              </button>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 italic">{t.dev_inspiration_title}</p>
            {loadingInspiration ? (
              <div className="w-4 h-4 border-2 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
            ) : (
              <p className="text-slate-700 dark:text-slate-300 text-sm font-bold leading-relaxed italic">"{inspiration}"</p>
            )}
        </div>
      </div>

      <style>{`
        @keyframes shine {
          0% { transform: translateX(-100%) skewX(-15deg); }
          50% { transform: translateX(100%) skewX(-15deg); }
          100% { transform: translateX(100%) skewX(-15deg); }
        }
        .animate-shine {
          animation: shine 3s infinite linear;
        }
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.01); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 4s infinite ease-in-out;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.1); }
        }
        .animate-float {
          animation: float 3s infinite ease-in-out;
        }
      `}</style>

      {showDonatePopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowDonatePopup(false)}></div>
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[3rem] shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-hidden flex flex-col">
             
             <div className="px-8 pt-10 pb-4 shrink-0 flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Select Sadaqah</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Support this project</p>
                </div>
                <button onClick={() => setShowDonatePopup(false)} className="text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-full">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
             </div>
             
             <div className="px-8 pb-10 space-y-4 overflow-y-auto scrollbar-hide flex-1">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-3xl border border-emerald-100/50 dark:border-emerald-800/50 mb-2">
                   <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 leading-relaxed text-center italic">
                     {t.donate_baraka || "Jazakumullahu Khairan! May Allah grant you a great reward."}
                   </p>
                </div>

                {donationMethods.map((method) => (
                  <div key={method.name} onClick={() => copyToClipboard(method.value, method.name)} className="p-5 bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] flex items-center justify-between cursor-pointer active:scale-95 transition-all border border-transparent hover:border-emerald-500/20 group relative overflow-hidden">
                    <div className="flex flex-col relative z-10 pr-4">
                      <p className="font-black text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-widest">{method.name}</p>
                      <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 leading-tight mt-0.5">{method.sub}</p>
                      <span className="text-slate-900 dark:text-slate-200 font-black text-xl mt-1 block tracking-tight">{method.value}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                       <div className={`p-3 rounded-2xl transition-all ${copiedLabel === method.name ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-300'}`}>
                          {copiedLabel === method.name ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                          )}
                       </div>
                    </div>
                  </div>
                ))}
             </div>

             <div className="px-10 pb-10 pt-4 shrink-0 bg-white dark:bg-slate-800 border-t border-slate-50 dark:border-slate-700/50">
                <button onClick={() => setShowDonatePopup(false)} className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl shadow-xl active:scale-95 transition-all">
                  Close
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperView;

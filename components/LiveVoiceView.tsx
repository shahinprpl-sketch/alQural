
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { AppSettings } from '../types';

interface LiveVoiceViewProps {
  t: any;
  settings: AppSettings;
}

// Audio Helpers
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const LiveVoiceView: React.FC<LiveVoiceViewProps> = ({ t, settings }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcription, setTranscription] = useState('');
  
  const isActiveRef = useRef(false);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcription]);

  const stopSession = () => {
    isActiveRef.current = false;
    setIsActive(false);
    if (status !== 'error') setStatus('idle');
    
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    for (const source of sourcesRef.current.values()) {
      try { source.stop(); } catch(e) {}
    }
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    
    if (audioContextInRef.current) audioContextInRef.current.close();
    if (audioContextOutRef.current) audioContextOutRef.current.close();
  };

  const startSession = async () => {
    setTranscription('');
    setErrorMessage(null);
    setStatus('connecting');
    isActiveRef.current = true;
    setIsActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextInRef.current = inCtx;
      audioContextOutRef.current = outCtx;

      await inCtx.resume();
      await outCtx.resume();

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            if (!isActiveRef.current) return;
            setStatus('connected');
            const source = inCtx.createMediaStreamSource(stream);
            const scriptProcessor = inCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              if (!isActiveRef.current) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) { int16[i] = inputData[i] * 32768; }
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => {
                if (isActiveRef.current) session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (!isActiveRef.current) return;
            if (message.serverContent?.outputTranscription) setTranscription(prev => prev + message.serverContent!.outputTranscription!.text);
            const base64Audio = message.serverContent?.modelTurn?.parts?.find(p => p.inlineData)?.inlineData?.data;
            if (base64Audio) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outCtx, 24000, 1);
              const source = outCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outCtx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onclose: () => stopSession(),
          onerror: (e) => { setStatus('error'); setErrorMessage("AI connection error."); stopSession(); },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: settings.liveVoiceName || 'Puck' } } },
          systemInstruction: `Islamic scholar assistant. Use ${settings.language}. Conversational and concise.`,
        },
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      setStatus('error');
      setErrorMessage("Microphone access is required for this feature. Please check your browser settings.");
      stopSession();
    }
  };

  return (
    <div className="h-full flex flex-col p-6 min-h-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="text-center py-4 shrink-0">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-2">{t.voice_title}</h2>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{t.voice_subtitle}</p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-800 relative my-4 overflow-hidden p-8">
        <div className={`w-32 h-32 md:w-44 md:h-44 rounded-full flex items-center justify-center transition-all duration-700 ${
          status === 'connected' ? 'bg-emerald-500 shadow-2xl scale-110' : 
          status === 'error' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600' : 'bg-slate-100 dark:bg-slate-800'
        }`}>
          {status === 'error' ? (
            <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          ) : (
            <svg className={`w-14 h-14 ${status === 'connected' ? 'text-white' : 'text-slate-300 dark:text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
          )}
        </div>

        <div className="mt-8 text-center max-w-xs">
          {status === 'error' ? (
            <p className="text-rose-600 dark:text-rose-400 font-bold text-sm leading-relaxed">{errorMessage}</p>
          ) : (
            <p className="text-slate-600 dark:text-slate-300 font-bold italic">{transcription || t.voice_instruction}</p>
          )}
        </div>
      </div>

      <div className="shrink-0 flex justify-center py-6 pb-12">
        {isActive ? (
          <button onClick={stopSession} className="bg-rose-600 text-white px-12 py-5 rounded-[2.5rem] font-black shadow-xl active:scale-95 transition-all">STOP CHAT</button>
        ) : (
          <button onClick={startSession} className="bg-emerald-600 text-white px-12 py-5 rounded-[2.5rem] font-black shadow-xl active:scale-95 transition-all flex items-center gap-3">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/></svg>
            START VOICE CHAT
          </button>
        )}
      </div>
    </div>
  );
};

export default LiveVoiceView;

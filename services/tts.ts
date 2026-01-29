import { GoogleGenAI, Modality } from "@google/genai";

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

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function speakText(text: string, voice: string = 'Kore'): Promise<void> {
  // Check if an API key is selected in AI Studio environments
  const hasKey = (window as any).aistudio?.hasSelectedApiKey 
    ? await (window as any).aistudio.hasSelectedApiKey() 
    : !!process.env.API_KEY;

  if (!hasKey && (window as any).aistudio?.openSelectKey) {
    await (window as any).aistudio.openSelectKey();
  }

  return new Promise(async (resolve) => {
    let audioContext: AudioContext | null = null;
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
          // Fix typo in responseModalities
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000,
        });
        
        // Ensure context is running - critical for many browsers
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        source.onended = () => {
          if (audioContext && audioContext.state !== 'closed') {
            audioContext.close().catch(() => {});
          }
          resolve();
        };
        source.start();
      } else {
        resolve();
      }
    } catch (error: any) {
      console.error("TTS Error:", error);
      // Reset if key issue
      if (error.message?.includes("Requested entity was not found") && (window as any).aistudio?.openSelectKey) {
        await (window as any).aistudio.openSelectKey();
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
      }
      resolve();
    }
  });
}

export async function speakSurahName(englishName: string, arabicName: string, voice: string = 'Kore'): Promise<void> {
  return speakText(`Pronounce Surah ${englishName}`, voice);
}

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  text: string;
  translation: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean;
}

export interface Reciter {
  id: string;
  name: string;
  identifier: string;
}

export type Language = 'bn' | 'en' | 'hi' | 'ar';

export interface AppSettings {
  arabicFontSize: number;
  banglaFontSize: number;
  isDarkMode: boolean;
  reciter: string;
  playbackSpeed: number;
  language: Language;
  liveVoiceName: string;
}

export type ViewMode = 'surahList' | 'ayahView' | 'favorites' | 'search' | 'settings' | 'audioBook' | 'developer' | 'prayerTimes' | 'hadith' | 'liveVoice';

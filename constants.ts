
import { Surah, Reciter, Language } from './types';

// Surahs are now fetched dynamically from the API in components to ensure all 114 are available.
export const SURAHS: Surah[] = [];

const RECITERS_DATA = [
  { 
    id: '1', 
    identifier: 'ar.alafasy',
    names: {
      en: 'Mishary Rashid Alafasy',
      bn: 'মিশারি রশিদ আলাফাসি',
      hi: 'मिशारी राशिद अल-अफसी',
      ar: 'مشاري راشد العفاسي'
    }
  },
  { 
    id: '2', 
    identifier: 'ar.abdulsamad',
    names: {
      en: 'AbdulBaset AbdulSamad',
      bn: 'আব্দুল বাসেত আব্দুস সামাদ',
      hi: 'अब्दुल बासित अब्दुल समद',
      ar: 'عبد الباسط عبد الصمد'
    }
  },
  { 
    id: '3', 
    identifier: 'ar.minshawi',
    names: {
      en: 'Mohamed Siddiq al-Minshawi',
      bn: 'মুহাম্মদ সিদ্দিক আল-মিনশাবি',
      hi: 'मुहम्मद सिद्दीक अल-मिंशावी',
      ar: 'محمد صديق المنشاوي'
    }
  },
  { 
    id: '4', 
    identifier: 'ar.husary',
    names: {
      en: 'Mahmoud Khalil Al-Husary',
      bn: 'মাহমুদ খলিল আল-হুসারি',
      hi: 'महमूद खलील अल-हुसारी',
      ar: 'محمود خليل الحصري'
    }
  },
  { 
    id: '5', 
    identifier: 'ar.ghamidi',
    names: {
      en: 'Sa\'ad al-Ghamidi',
      bn: 'সাদ আল-গামিদ',
      hi: 'साद अल-गामिदी',
      ar: 'سعد الغامدي'
    }
  },
  { 
    id: '6', 
    identifier: 'ar.ajamy',
    names: {
      en: 'Ahmed ibn Ali al-Ajamy',
      bn: 'আহমেদ ইবনে আলী আল-আজমি',
      hi: 'अहमद इब्न अली अल-अजमी',
      ar: 'أحمد بن علي العجمي'
    }
  },
  { 
    id: '7', 
    identifier: 'ar.mahermuaiqly',
    names: {
      en: 'Maher Al Muaiqly',
      bn: 'মাহের আল মুআইকলি',
      hi: 'माहेर अल मुइक्ली',
      ar: 'ماهر المعيقلي'
    }
  },
  { 
    id: '8', 
    identifier: 'ar.saoodshuraym',
    names: {
      en: 'Saud al-Shuraim',
      bn: 'সাউদ আল-শুরাইম',
      hi: 'सऊद अल-शुरैम',
      ar: 'سعود الشريم'
    }
  },
  { 
    id: '9', 
    identifier: 'ar.hudhaify',
    names: {
      en: 'Ali Hudhaify',
      bn: 'আলী হুজাইফি',
      hi: 'अली हुजैफी',
      ar: 'علي الحذيفي'
    }
  },
  { 
    id: '10', 
    identifier: 'ar.basfar',
    names: {
      en: 'Abdullah Basfar',
      bn: 'আবদুল্লাহ বাসফার',
      hi: 'अब्दुल्ला बसफ़र',
      ar: 'عبد الله بصفر'
    }
  },
  { 
    id: '11', 
    identifier: 'ar.qatami',
    names: {
      en: 'Nasser Al Qatami',
      bn: 'নাসের আল কাতামি',
      hi: 'नासिर अल कतामी',
      ar: 'ناصر القطامي'
    }
  },
  { 
    id: '12', 
    identifier: 'ar.dussary',
    names: {
      en: 'Yasser Ad-Dussary',
      bn: 'ইয়াসির আদ-দুসারি',
      hi: 'यासिर अद-दुसारी',
      ar: 'ياسر الدوسري'
    }
  }
];

export const getLocalizedReciters = (lang: Language): Reciter[] => {
  return RECITERS_DATA.map(r => ({
    id: r.id,
    identifier: r.identifier,
    name: r.names[lang] || r.names.en
  }));
};

export interface LanguageInfo {
  code: string;
  name: string; // Native name
  englishName: string;
  script: 'latin' | 'devanagari' | 'ol-chiki';
  shortLabel: string; // e.g., 'EN', 'हि', 'ᱥᱟᱱ', 'नाग', 'खोर', 'कुड़', 'मुं', 'हो'
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: 'en',
    name: 'English',
    englishName: 'English',
    script: 'latin',
    shortLabel: 'EN'
  },
  {
    code: 'hi',
    name: 'हिन्दी',
    englishName: 'Hindi',
    script: 'devanagari',
    shortLabel: 'हि'
  },
  {
    code: 'sat',
    name: 'ᱥᱟᱱᱛᱟᱲᱤ',
    englishName: 'Santali',
    script: 'ol-chiki',
    shortLabel: 'ᱥᱟᱱ'
  },
  {
    code: 'nag',
    name: 'नागपुरी',
    englishName: 'Nagpuri',
    script: 'devanagari',
    shortLabel: 'नाग'
  },
  {
    code: 'kh',
    name: 'खोरठा',
    englishName: 'Khortha',
    script: 'devanagari',
    shortLabel: 'खोर'
  },
  {
    code: 'kur',
    name: 'कुड़मालि',
    englishName: 'Kurmali',
    script: 'devanagari',
    shortLabel: 'कुड़'
  },
  {
    code: 'unr',
    name: 'मुंडारी',
    englishName: 'Mundari',
    script: 'devanagari',
    shortLabel: 'मुं'
  },
  {
    code: 'hoc',
    name: 'हो',
    englishName: 'Ho',
    script: 'devanagari',
    shortLabel: 'हो'
  }
];

export const DEFAULT_LANGUAGE = 'en';

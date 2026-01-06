import { en } from './en';
import { he } from './he';
import { Locale, TranslationDictionary, LocalizedPayload, LocalizedQuestion } from './types';

export type { Locale, TranslationDictionary, LocalizedPayload, LocalizedQuestion };

export const translations: Record<Locale, TranslationDictionary> = {
  en,
  he,
};

export const defaultLocale: Locale = 'en';

export function getTranslation(locale: Locale): TranslationDictionary {
  return translations[locale] || translations[defaultLocale];
}

export function t(locale: Locale, path: string, replacements?: Record<string, string | number>): string {
  const dict = getTranslation(locale);
  const keys = path.split('.');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = dict;
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      // Fallback to English if key not found
      let fallbackValue: unknown = translations[defaultLocale];
      for (const k of keys) {
        if (fallbackValue && typeof fallbackValue === 'object' && k in (fallbackValue as Record<string, unknown>)) {
          fallbackValue = (fallbackValue as Record<string, unknown>)[k];
        } else {
          fallbackValue = undefined;
          break;
        }
      }
      value = fallbackValue;
      break;
    }
  }

  if (typeof value !== 'string') {
    console.warn(`Translation missing for path: ${path} in locale: ${locale}`);
    return path; // Return path as fallback
  }

  // Replace placeholders like {current}, {total}, {percent}
  if (replacements) {
    return Object.entries(replacements).reduce(
      (str, [key, val]) => str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val)),
      value
    );
  }

  return value;
}

export function getQuestionLabel(locale: Locale, questionId: string): string {
  const dict = getTranslation(locale);
  return dict.questions[questionId]?.question || questionId;
}

export function getAnswerLabel(locale: Locale, questionId: string, answerKey: string): string {
  const dict = getTranslation(locale);
  const options = dict.questions[questionId]?.options;
  if (options && answerKey in options) {
    return options[answerKey];
  }
  // For open questions (q9), return the answer as-is
  return answerKey;
}

export function buildLocalizedPayload(
  locale: Locale,
  answers: Record<string, string>
): LocalizedPayload {
  const questions: LocalizedQuestion[] = [];

  // Add contact
  if (answers.contact) {
    questions.push({
      key: 'contact',
      label: getTranslation(locale).contact.question,
      answerKey: answers.contact,
      answerLabel: answers.contact, // Contact is always shown as-is
    });
  }

  // Add q1-q9
  for (let i = 1; i <= 9; i++) {
    const key = `q${i}`;
    const answer = answers[key];
    if (answer) {
      questions.push({
        key,
        label: getQuestionLabel(locale, key),
        answerKey: answer,
        answerLabel: getAnswerLabel(locale, key, answer),
      });
    }
  }

  return {
    locale,
    questions,
  };
}

export function isRTL(locale: Locale): boolean {
  return getTranslation(locale).direction === 'rtl';
}

// Storage key for persisting locale
const LOCALE_STORAGE_KEY = 'diagnostic_locale';

export function getStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === 'en' || stored === 'he') {
    return stored;
  }
  return null;
}

export function setStoredLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

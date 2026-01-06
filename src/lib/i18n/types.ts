export type Locale = 'en' | 'he';

export interface LocalizedQuestion {
  key: string;
  label: string;
  answerKey: string;
  answerLabel: string;
}

export interface LocalizedPayload {
  locale: Locale;
  questions: LocalizedQuestion[];
}

export interface TranslationDictionary {
  // Meta
  languageName: string;
  languageCode: string;
  direction: 'ltr' | 'rtl';

  // Contact step
  contact: {
    question: string;
    placeholder: string;
    helperText: string;
    validation: {
      required: string;
      invalid: string;
    };
  };

  // Questions
  questions: {
    [key: string]: {
      question: string;
      options: { [key: string]: string };
    };
  };

  // Open question (q9)
  openQuestion: {
    placeholder: string;
    helperText: string;
  };

  // UI elements
  ui: {
    next: string;
    back: string;
    submit: string;
    submitting: string;
    stepOf: string; // e.g., "Step {current} of {total}"
    progress: string;
    required: string;
    optional: string;
    languageToggle: string;
  };

  // Result screen
  result: {
    title: string;
    subtitle: string;
    chaosScore: string;
    riskLevel: string;
    hoursLost: string;
    moneyLeakage: string;
    perMonth: string;
    ctaButton: string;
    ctaDescription: string;
    riskLevels: {
      LOW: string;
      MEDIUM: string;
      HIGH: string;
      CRITICAL: string;
    };
    headlines: {
      LOW: string;
      MEDIUM: string;
      HIGH: string;
      CRITICAL: string;
    };
    descriptions: {
      LOW: string;
      MEDIUM: string;
      HIGH: string;
      CRITICAL: string;
    };
  };

  // Errors
  errors: {
    submissionFailed: string;
    networkError: string;
    tryAgain: string;
  };
}

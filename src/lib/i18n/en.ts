import { TranslationDictionary } from './types';

export const en: TranslationDictionary = {
  languageName: 'English',
  languageCode: 'en',
  direction: 'ltr',

  contact: {
    question: 'Where should we send your personalized diagnostic report?',
    placeholder: 'Enter your email or phone number',
    helperText: 'We\'ll use this to send your results and keep your progress saved.',
    validation: {
      required: 'Email or phone number is required',
      invalid: 'Please enter a valid email address or phone number',
    },
  },

  questions: {
    q1: {
      question: 'How many different places (apps, sheets, systems) do you check daily to understand your business?',
      options: {
        '1-2': '1-2 sources',
        '3-5': '3-5 sources',
        '6-9': '6-9 sources',
        '10+': '10+ sources',
      },
    },
    q2: {
      question: 'How long does it take you to reach a reliable financial number when you need it?',
      options: {
        'less-than-5': 'Less than 5 minutes',
        'up-to-30': 'Up to 30 minutes',
        'more-than-30': 'More than 30 minutes',
        'no-trust': 'I never fully trust the numbers',
      },
    },
    q3: {
      question: 'How many hours per week do you or your team spend "collecting a picture" instead of managing?',
      options: {
        'less-than-2': 'Less than 2 hours',
        '2-5': '2-5 hours',
        '5-10': '5-10 hours',
        '10+': '10+ hours',
      },
    },
    q4: {
      question: 'When an operational issue occurs, how long does it take to understand where it originated?',
      options: {
        'immediately': 'Immediately - we have full visibility',
        'few-hours': 'Within a few hours',
        '1-2-days': '1-2 days',
        'after-damage': 'Often only after the damage is done',
      },
    },
    q5: {
      question: 'How many people in your business are involved in non-revenue producing operations (reporting, data entry, coordination)?',
      options: {
        '0': 'None - it\'s all automated',
        '1-2': '1-2 people',
        '3-5': '3-5 people',
        '6+': '6+ people',
      },
    },
    q6: {
      question: 'How much does your business operations depend on specific employees\' knowledge?',
      options: {
        'almost-not': 'Almost not at all - everything is documented',
        'a-little': 'A little - some key processes depend on people',
        'very-much': 'Very much - several critical processes',
        'paralyzes': 'Completely - if someone leaves, it paralyzes activity',
      },
    },
    q7: {
      question: 'How often are you, as a founder/manager, forced to step in and handle small operational issues?',
      options: {
        'almost-never': 'Almost never',
        '1-3': '1-3 times per week',
        '4-10': '4-10 times per week',
        'every-day': 'Almost every day',
      },
    },
    q8: {
      question: 'What slows down your business growth the most right now?',
      options: {
        'operational-disorder': 'Operational disorder and lack of clarity',
        'people-dependence': 'Over-dependence on specific people',
        'management-overload': 'Daily management overload',
        'time-waste': 'Time wasted on non-profitable tasks',
        'no-control': 'No real-time control over the business',
        'combination': 'Combination of several of these',
      },
    },
    q9: {
      question: 'What systems or tools do you currently use to manage your business information?',
      options: {},
    },
  },

  openQuestion: {
    placeholder: 'e.g., Excel, Google Sheets, Monday, Salesforce, custom software...',
    helperText: 'This helps us understand your current setup (optional)',
  },

  ui: {
    next: 'Next',
    back: 'Back',
    submit: 'Get My Results',
    submitting: 'Analyzing...',
    stepOf: 'Step {current} of {total}',
    progress: '{percent}% complete',
    required: 'Required',
    optional: 'Optional',
    languageToggle: 'Language',
  },

  result: {
    title: 'Your Diagnostic Results',
    subtitle: 'Based on your answers, here\'s what we found:',
    chaosScore: 'Chaos Score',
    riskLevel: 'Risk Level',
    hoursLost: 'Hours Lost',
    moneyLeakage: 'Money Leakage',
    perMonth: 'per month',
    ctaButton: 'Schedule a Free Consultation',
    ctaDescription: 'Let\'s discuss how to reduce your operational chaos',
    riskLevels: {
      LOW: 'Low Risk',
      MEDIUM: 'Medium Risk',
      HIGH: 'High Risk',
      CRITICAL: 'Critical Risk',
    },
    headlines: {
      LOW: 'Your operations show early signs of friction.',
      MEDIUM: 'Your business is losing growth capacity silently.',
      HIGH: 'Your business is running on hidden manual chaos.',
      CRITICAL: 'Your operations are blocking your next scale stage.',
    },
    descriptions: {
      LOW: 'While your business runs reasonably well, small inefficiencies are compounding. Left unchecked, these micro-issues will become growth blockers within 6-12 months.',
      MEDIUM: 'Significant operational overhead is eating into your margins and time. Your team is spending more energy maintaining the status quo than driving growth.',
      HIGH: 'Critical operational gaps are forcing reactive management. Every day without systematic intervention increases the risk of costly errors and missed opportunities.',
      CRITICAL: 'Your business has outgrown its operational foundation. Scaling further without restructuring will multiply current problems exponentially.',
    },
  },

  errors: {
    submissionFailed: 'Failed to submit your diagnostic. Please try again.',
    networkError: 'Network error. Please check your connection.',
    tryAgain: 'Try Again',
  },
};

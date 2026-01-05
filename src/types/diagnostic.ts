export interface DiagnosticQuestion {
  id: string;
  question: string;
  options: DiagnosticOption[];
  type: 'single' | 'open' | 'contact';
}

export interface DiagnosticOption {
  value: string;
  label: string;
  chaosWeight: number;
}

export interface DiagnosticAnswers {
  contact: string; // Email or phone - required for user identification
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
  q6: string;
  q7: string;
  q8: string;
  q9: string;
}

export interface ChaosScoreResult {
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  hoursLostPerMonth: string;
  moneyLeakageRange: string;
  headline: string;
  description: string;
}

export interface SubmissionData {
  timestamp: string;
  answers: DiagnosticAnswers;
  chaosScore: number;
  riskLevel: string;
  ip: string;
  deviceType: string;
  country: string;
  userAgent: string;
}

export interface FormState {
  currentStep: number;
  answers: Partial<DiagnosticAnswers>;
  isSubmitting: boolean;
  isComplete: boolean;
  result: ChaosScoreResult | null;
}

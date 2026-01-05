import { DiagnosticAnswers, ChaosScoreResult } from '@/types/diagnostic';

export type { ChaosScoreResult };
import { diagnosticQuestions } from './questions';

const questionWeights: Record<string, number> = {
  q1: 1.2,  // Data fragmentation
  q2: 1.3,  // Financial visibility
  q3: 1.1,  // Time waste
  q4: 1.2,  // Problem detection
  q5: 1.0,  // Resource allocation
  q6: 1.4,  // People dependency (critical)
  q7: 1.3,  // Founder bottleneck
  q8: 1.0,  // Growth blocker
};

export function calculateChaosScore(answers: DiagnosticAnswers): ChaosScoreResult {
  let totalWeightedScore = 0;
  let totalWeight = 0;

  Object.entries(answers).forEach(([questionId, answerValue]) => {
    if (questionId === 'q9') return; // Skip open question

    const question = diagnosticQuestions.find(q => q.id === questionId);
    if (!question) return;

    const selectedOption = question.options.find(opt => opt.value === answerValue);
    if (!selectedOption) return;

    const weight = questionWeights[questionId] || 1;
    totalWeightedScore += selectedOption.chaosWeight * weight;
    totalWeight += weight * 100; // Max possible weighted score per question
  });

  // Normalize to 0-100 scale
  const rawScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;
  const score = Math.round(Math.min(100, Math.max(0, rawScore)));

  const result = generateResult(score);
  return result;
}

function generateResult(score: number): ChaosScoreResult {
  let riskLevel: ChaosScoreResult['riskLevel'];
  let headline: string;
  let description: string;
  let hoursLostPerMonth: string;
  let moneyLeakageRange: string;

  if (score <= 25) {
    riskLevel = 'LOW';
    headline = 'Your operations show early signs of friction.';
    description = 'While your business runs reasonably well, small inefficiencies are compounding. Left unchecked, these micro-issues will become growth blockers within 6-12 months.';
    hoursLostPerMonth = '8-15';
    moneyLeakageRange = '$2,000 - $5,000';
  } else if (score <= 50) {
    riskLevel = 'MEDIUM';
    headline = 'Your business is losing growth capacity silently.';
    description = 'Significant operational overhead is eating into your margins and time. Your team is spending more energy maintaining the status quo than driving growth.';
    hoursLostPerMonth = '20-40';
    moneyLeakageRange = '$8,000 - $20,000';
  } else if (score <= 75) {
    riskLevel = 'HIGH';
    headline = 'Your business is running on hidden manual chaos.';
    description = 'Critical operational gaps are forcing reactive management. Every day without systematic intervention increases the risk of costly errors and missed opportunities.';
    hoursLostPerMonth = '50-80';
    moneyLeakageRange = '$25,000 - $60,000';
  } else {
    riskLevel = 'CRITICAL';
    headline = 'Your operations are blocking your next scale stage.';
    description = 'Your business has outgrown its operational foundation. Scaling further without restructuring will multiply current problems exponentially.';
    hoursLostPerMonth = '100+';
    moneyLeakageRange = '$75,000+';
  }

  return {
    score,
    riskLevel,
    headline,
    description,
    hoursLostPerMonth,
    moneyLeakageRange,
  };
}

export function getRiskColor(riskLevel: ChaosScoreResult['riskLevel']): string {
  const colors = {
    LOW: '#22c55e',
    MEDIUM: '#eab308',
    HIGH: '#f97316',
    CRITICAL: '#ef4444',
  };
  return colors[riskLevel];
}

export function getRiskGradient(riskLevel: ChaosScoreResult['riskLevel']): string {
  const gradients = {
    LOW: 'from-green-500/20 to-green-500/5',
    MEDIUM: 'from-yellow-500/20 to-yellow-500/5',
    HIGH: 'from-orange-500/20 to-orange-500/5',
    CRITICAL: 'from-red-500/20 to-red-500/5',
  };
  return gradients[riskLevel];
}

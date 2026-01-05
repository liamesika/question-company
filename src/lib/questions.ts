import { DiagnosticQuestion } from '@/types/diagnostic';

export const diagnosticQuestions: DiagnosticQuestion[] = [
  {
    id: 'contact',
    question: 'Where should we send your personalized diagnostic report?',
    type: 'contact',
    options: [],
  },
  {
    id: 'q1',
    question: 'During an average month, how many different places do you check to understand what is really happening in your business?',
    type: 'single',
    options: [
      { value: '1-2', label: '1–2', chaosWeight: 10 },
      { value: '3-5', label: '3–5', chaosWeight: 25 },
      { value: '6-9', label: '6–9', chaosWeight: 50 },
      { value: '10+', label: '10+', chaosWeight: 80 },
    ],
  },
  {
    id: 'q2',
    question: 'When you want to know how much money actually remained in the business this month — how long does it take to reach a reliable number?',
    type: 'single',
    options: [
      { value: 'less-than-5', label: 'Less than 5 minutes', chaosWeight: 5 },
      { value: 'up-to-30', label: 'Up to 30 minutes', chaosWeight: 25 },
      { value: 'more-than-30', label: 'More than 30 minutes', chaosWeight: 50 },
      { value: 'no-trust', label: "I don't have a number I trust", chaosWeight: 90 },
    ],
  },
  {
    id: 'q3',
    question: 'How many hours per week do you or management spend only on "collecting a picture" instead of managing?',
    type: 'single',
    options: [
      { value: 'less-than-2', label: 'Less than 2', chaosWeight: 10 },
      { value: '2-5', label: '2–5', chaosWeight: 30 },
      { value: '5-10', label: '5–10', chaosWeight: 55 },
      { value: '10+', label: '10+', chaosWeight: 85 },
    ],
  },
  {
    id: 'q4',
    question: 'When an operational issue happens (angry client, missing payment, undone task) — how long does it take until you understand where the problem originated?',
    type: 'single',
    options: [
      { value: 'immediately', label: 'Immediately', chaosWeight: 5 },
      { value: 'few-hours', label: 'Within a few hours', chaosWeight: 25 },
      { value: '1-2-days', label: '1–2 days', chaosWeight: 55 },
      { value: 'after-damage', label: 'Only after damage occurred', chaosWeight: 90 },
    ],
  },
  {
    id: 'q5',
    question: 'How many people in your business are currently involved in non-revenue producing daily operations?',
    type: 'single',
    options: [
      { value: '0', label: '0', chaosWeight: 5 },
      { value: '1-2', label: '1–2', chaosWeight: 25 },
      { value: '3-5', label: '3–5', chaosWeight: 55 },
      { value: '6+', label: '6+', chaosWeight: 85 },
    ],
  },
  {
    id: 'q6',
    question: 'When an employee leaves or is absent — how much does it affect your ability to operate normally?',
    type: 'single',
    options: [
      { value: 'almost-not', label: 'Almost not at all', chaosWeight: 5 },
      { value: 'a-little', label: 'A little', chaosWeight: 25 },
      { value: 'very-much', label: 'Very much', chaosWeight: 60 },
      { value: 'paralyzes', label: 'Paralyzes activity', chaosWeight: 95 },
    ],
  },
  {
    id: 'q7',
    question: 'How many times per month are you personally forced to handle small operational issues instead of growth?',
    type: 'single',
    options: [
      { value: 'almost-never', label: 'Almost never', chaosWeight: 5 },
      { value: '1-3', label: '1–3 times', chaosWeight: 25 },
      { value: '4-10', label: '4–10 times', chaosWeight: 55 },
      { value: 'every-day', label: 'Almost every day', chaosWeight: 90 },
    ],
  },
  {
    id: 'q8',
    question: 'What currently slows down your business growth the most?',
    type: 'single',
    options: [
      { value: 'operational-disorder', label: 'Operational disorder', chaosWeight: 70 },
      { value: 'people-dependence', label: 'Over-dependence on people', chaosWeight: 65 },
      { value: 'management-overload', label: 'Daily management overload', chaosWeight: 60 },
      { value: 'time-waste', label: 'Time wasted on non-profitable tasks', chaosWeight: 55 },
      { value: 'no-control', label: 'No real-time control', chaosWeight: 75 },
      { value: 'combination', label: 'Combination of several', chaosWeight: 85 },
    ],
  },
  {
    id: 'q9',
    question: 'Which systems do you currently use and manage information in?',
    type: 'open',
    options: [],
  },
];

export const getQuestionById = (id: string): DiagnosticQuestion | undefined => {
  return diagnosticQuestions.find(q => q.id === id);
};

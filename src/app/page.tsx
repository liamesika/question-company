'use client';

import { useState, useCallback, useRef } from 'react';
import { Hero, DiagnosticForm, ResultScreen } from '@/components';
import { DiagnosticAnswers, ChaosScoreResult } from '@/types/diagnostic';
import { getClientInfo } from '@/lib/utils';

type AppState = 'hero' | 'diagnostic' | 'result';

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>('hero');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ChaosScoreResult | null>(null);
  const diagnosticRef = useRef<HTMLDivElement>(null);

  const handleStartDiagnostic = useCallback(() => {
    setAppState('diagnostic');
    setTimeout(() => {
      diagnosticRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const handleSubmit = useCallback(async (answers: DiagnosticAnswers) => {
    setIsSubmitting(true);

    try {
      const clientInfo = await getClientInfo();

      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers, clientInfo }),
      });

      if (!response.ok) {
        throw new Error('Submission failed');
      }

      const data = await response.json();
      setResult(data.result);
      setAppState('result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Submission error:', error);
      // Still show result locally even if API fails
      const { calculateChaosScore } = await import('@/lib/chaos-calculator');
      const localResult = calculateChaosScore(answers);
      setResult(localResult);
      setAppState('result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return (
    <>
      {appState === 'hero' && (
        <Hero onStartDiagnostic={handleStartDiagnostic} />
      )}

      {appState === 'diagnostic' && (
        <div ref={diagnosticRef}>
          <DiagnosticForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>
      )}

      {appState === 'result' && result && (
        <ResultScreen result={result} />
      )}
    </>
  );
}

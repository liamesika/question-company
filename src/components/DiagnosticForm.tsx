'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button, GlassCard, ProgressBar, RadioOption, TextArea } from '@/components/ui';
import { diagnosticQuestions } from '@/lib/questions';
import { DiagnosticAnswers } from '@/types/diagnostic';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';

interface DiagnosticFormProps {
  onSubmit: (answers: DiagnosticAnswers) => void;
  isSubmitting: boolean;
}

export function DiagnosticForm({ onSubmit, isSubmitting }: DiagnosticFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<DiagnosticAnswers>>({});
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const currentQuestion = diagnosticQuestions[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === diagnosticQuestions.length - 1;
  const currentAnswer = answers[currentQuestion.id as keyof DiagnosticAnswers];

  const handleAnswer = useCallback((value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  }, [currentQuestion.id]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onSubmit(answers as DiagnosticAnswers);
    } else {
      setDirection('forward');
      setCurrentStep(prev => prev + 1);
    }
  }, [isLastStep, answers, onSubmit]);

  const handlePrevious = useCallback(() => {
    if (!isFirstStep) {
      setDirection('backward');
      setCurrentStep(prev => prev - 1);
    }
  }, [isFirstStep]);

  const canProceed = currentQuestion.type === 'open'
    ? true
    : Boolean(currentAnswer);

  return (
    <section
      id="diagnostic"
      className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20"
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-accent-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[350px] h-[350px] bg-accent-secondary/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <ProgressBar
            current={currentStep + 1}
            total={diagnosticQuestions.length}
          />
        </div>

        {/* Question Card */}
        <GlassCard
          variant="elevated"
          className={cn(
            'p-6 sm:p-8 md:p-10',
            'transition-all duration-500',
            direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left'
          )}
          key={currentStep}
        >
          {/* Question */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white mb-8 leading-relaxed">
            {currentQuestion.question}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.type === 'single' ? (
              currentQuestion.options.map((option) => (
                <RadioOption
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  isSelected={currentAnswer === option.value}
                  onSelect={handleAnswer}
                />
              ))
            ) : (
              <TextArea
                placeholder="e.g., Excel, Google Sheets, Monday.com, Slack, WhatsApp groups, CRM..."
                value={(currentAnswer as string) || ''}
                onChange={(e) => handleAnswer(e.target.value)}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/10">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={isFirstStep}
              className={cn(
                'flex items-center gap-2',
                isFirstStep && 'invisible'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            <div className="flex items-center gap-2">
              {diagnosticQuestions.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-300',
                    index === currentStep
                      ? 'bg-accent-primary w-6'
                      : index < currentStep
                        ? 'bg-accent-primary/50'
                        : 'bg-white/20'
                  )}
                />
              ))}
            </div>

            <Button
              variant={isLastStep ? 'primary' : 'secondary'}
              onClick={handleNext}
              disabled={!canProceed || isSubmitting}
              isLoading={isSubmitting}
              className="flex items-center gap-2"
            >
              {isLastStep ? (
                <>
                  <span>Get Results</span>
                  <Send className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </GlassCard>

        {/* Helper text */}
        <p className="text-center text-white/40 text-sm mt-6">
          {currentQuestion.type === 'open'
            ? 'This helps us understand your current tech stack'
            : 'Select the option that best describes your situation'}
        </p>
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.4s ease-out forwards;
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.4s ease-out forwards;
        }
      `}</style>
    </section>
  );
}

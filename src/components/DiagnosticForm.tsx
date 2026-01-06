'use client';

import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button, GlassCard, ProgressBar, RadioOption, TextArea, TextInput, LanguageToggle } from '@/components/ui';
import { diagnosticQuestions } from '@/lib/questions';
import { DiagnosticAnswers } from '@/types/diagnostic';
import { ChevronLeft, ChevronRight, Send, Mail } from 'lucide-react';
import { useLocale, usePreviousLocale } from '@/contexts/LocaleContext';
import { Locale } from '@/lib/i18n';

interface DiagnosticFormProps {
  onSubmit: (answers: DiagnosticAnswers, locale: Locale) => void;
  isSubmitting: boolean;
}

export function DiagnosticForm({ onSubmit, isSubmitting }: DiagnosticFormProps) {
  const { locale, setLocale, t, dict, isRTL, direction: textDirection } = useLocale();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<DiagnosticAnswers>>({});
  const [animDirection, setAnimDirection] = useState<'forward' | 'backward'>('forward');
  const [showLanguageToggle, setShowLanguageToggle] = useState(false);
  const [contactValidated, setContactValidated] = useState(false);

  const currentQuestion = diagnosticQuestions[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === diagnosticQuestions.length - 1;
  const currentAnswer = answers[currentQuestion.id as keyof DiagnosticAnswers];

  // Check for returning user's locale preference
  const previousLocale = usePreviousLocale(
    contactValidated && answers.contact ? (answers.contact as string) : null
  );

  // Apply previous locale if found (only once when contact is validated)
  useEffect(() => {
    if (previousLocale && contactValidated) {
      setLocale(previousLocale);
    }
  }, [previousLocale, contactValidated, setLocale]);

  const handleAnswer = useCallback((value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  }, [currentQuestion.id]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onSubmit(answers as DiagnosticAnswers, locale);
    } else {
      // After contact step, show language toggle and mark contact as validated
      if (currentQuestion.type === 'contact') {
        setShowLanguageToggle(true);
        setContactValidated(true);
      }
      setAnimDirection('forward');
      setCurrentStep(prev => prev + 1);
    }
  }, [isLastStep, answers, onSubmit, locale, currentQuestion.type]);

  const handlePrevious = useCallback(() => {
    if (!isFirstStep) {
      setAnimDirection('backward');
      setCurrentStep(prev => prev - 1);
    }
  }, [isFirstStep]);

  // Validate contact field - must be email or phone
  const isValidContact = (value: string) => {
    if (!value) return false;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^[\d\s+\-().]{7,}$/;
    return emailPattern.test(value) || phonePattern.test(value);
  };

  const canProceed = currentQuestion.type === 'open'
    ? true
    : currentQuestion.type === 'contact'
      ? isValidContact(currentAnswer as string || '')
      : Boolean(currentAnswer);

  // Get translated question text
  const getQuestionText = () => {
    if (currentQuestion.type === 'contact') {
      return dict.contact.question;
    }
    return dict.questions[currentQuestion.id]?.question || currentQuestion.question;
  };

  // Get translated option label
  const getOptionLabel = (optionValue: string) => {
    const options = dict.questions[currentQuestion.id]?.options;
    return options?.[optionValue] || optionValue;
  };

  // Get translated helper text
  const getHelperText = () => {
    if (currentQuestion.type === 'contact') {
      return dict.contact.helperText;
    }
    if (currentQuestion.type === 'open') {
      return dict.openQuestion.helperText;
    }
    return t('ui.required');
  };

  // RTL-aware chevron icons
  const BackIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <section
      id="diagnostic"
      className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20"
      dir={textDirection}
      lang={locale}
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={cn(
          "absolute top-1/3 w-[400px] h-[400px] bg-accent-primary/10 rounded-full blur-[100px]",
          isRTL ? "right-1/4" : "left-1/4"
        )} />
        <div className={cn(
          "absolute bottom-1/3 w-[350px] h-[350px] bg-accent-secondary/10 rounded-full blur-[80px]",
          isRTL ? "left-1/4" : "right-1/4"
        )} />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto">
        {/* Language Toggle - sticky header on mobile */}
        {showLanguageToggle && (
          <div className={cn(
            "flex justify-end mb-4 sticky top-4 z-20",
            isRTL && "justify-start"
          )}>
            <LanguageToggle />
          </div>
        )}

        {/* Progress */}
        <div className="mb-8">
          <ProgressBar
            current={currentStep + 1}
            total={diagnosticQuestions.length}
          />
          <p className={cn(
            "text-center text-white/50 text-sm mt-2",
            isRTL && "font-hebrew"
          )}>
            {t('ui.stepOf', { current: currentStep + 1, total: diagnosticQuestions.length })}
          </p>
        </div>

        {/* Question Card */}
        <GlassCard
          variant="elevated"
          className={cn(
            'p-6 sm:p-8 md:p-10',
            'transition-all duration-500',
            animDirection === 'forward'
              ? isRTL ? 'animate-slide-in-left' : 'animate-slide-in-right'
              : isRTL ? 'animate-slide-in-right' : 'animate-slide-in-left'
          )}
          key={`${currentStep}-${locale}`}
        >
          {/* Question */}
          <h2 className={cn(
            "text-xl sm:text-2xl md:text-3xl font-semibold text-white mb-8 leading-relaxed",
            isRTL && "text-right font-hebrew"
          )}>
            {getQuestionText()}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.type === 'single' ? (
              currentQuestion.options.map((option) => (
                <RadioOption
                  key={option.value}
                  value={option.value}
                  label={getOptionLabel(option.value)}
                  isSelected={currentAnswer === option.value}
                  onSelect={handleAnswer}
                  className={isRTL ? 'text-right' : ''}
                />
              ))
            ) : currentQuestion.type === 'contact' ? (
              <div className="space-y-4">
                <TextInput
                  type="text"
                  placeholder={dict.contact.placeholder}
                  value={(currentAnswer as string) || ''}
                  onChange={(e) => handleAnswer(e.target.value)}
                  icon={<Mail className="w-5 h-5" />}
                  dir="ltr"
                  className="text-left"
                />
                {currentAnswer && !isValidContact(currentAnswer as string) && (
                  <p className={cn(
                    "text-red-400 text-sm",
                    isRTL && "text-right"
                  )}>
                    {dict.contact.validation.invalid}
                  </p>
                )}
              </div>
            ) : (
              <TextArea
                placeholder={dict.openQuestion.placeholder}
                value={(currentAnswer as string) || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                dir="ltr"
                className="text-left"
              />
            )}
          </div>

          {/* Navigation */}
          <div className={cn(
            "flex items-center justify-between mt-10 pt-6 border-t border-white/10",
            isRTL && "flex-row-reverse"
          )}>
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={isFirstStep}
              className={cn(
                'flex items-center gap-2',
                isFirstStep && 'invisible',
                isRTL && 'flex-row-reverse'
              )}
            >
              <BackIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t('ui.back')}</span>
            </Button>

            <div className={cn(
              "flex items-center gap-2",
              isRTL && "flex-row-reverse"
            )}>
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
              className={cn(
                "flex items-center gap-2",
                isRTL && "flex-row-reverse"
              )}
            >
              {isLastStep ? (
                <>
                  <span>{t('ui.submit')}</span>
                  <Send className={cn("w-4 h-4", isRTL && "scale-x-[-1]")} />
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">{t('ui.next')}</span>
                  <NextIcon className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </GlassCard>

        {/* Helper text */}
        <p className={cn(
          "text-center text-white/40 text-sm mt-6",
          isRTL && "font-hebrew"
        )}>
          {getHelperText()}
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
        .font-hebrew {
          font-family: 'Heebo', 'Arial', sans-serif;
        }
      `}</style>
    </section>
  );
}

'use client';

import React from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  className?: string;
  compact?: boolean;
}

export function LanguageToggle({ className, compact = false }: LanguageToggleProps) {
  const { locale, setLocale, isRTL } = useLocale();

  const toggleLocale = (newLocale: Locale) => {
    if (newLocale !== locale) {
      setLocale(newLocale);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 p-1 rounded-xl glass-card',
        className
      )}
      role="group"
      aria-label="Language selection"
    >
      {!compact && (
        <Globe className={cn('w-4 h-4 text-white/50', isRTL ? 'ml-1' : 'mr-1')} />
      )}
      <button
        type="button"
        onClick={() => toggleLocale('en')}
        className={cn(
          'px-2.5 py-1.5 text-sm font-medium rounded-lg transition-all duration-200',
          locale === 'en'
            ? 'bg-accent-primary/20 text-accent-primary'
            : 'text-white/60 hover:text-white hover:bg-white/5'
        )}
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
      <span className="text-white/20">|</span>
      <button
        type="button"
        onClick={() => toggleLocale('he')}
        className={cn(
          'px-2.5 py-1.5 text-sm font-medium rounded-lg transition-all duration-200',
          locale === 'he'
            ? 'bg-accent-primary/20 text-accent-primary'
            : 'text-white/60 hover:text-white hover:bg-white/5'
        )}
        aria-pressed={locale === 'he'}
      >
        עברית
      </button>
    </div>
  );
}

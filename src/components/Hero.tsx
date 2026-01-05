'use client';

import { useInView } from '@/hooks/useInView';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface HeroProps {
  onStartDiagnostic: () => void;
}

export function Hero({ onStartDiagnostic }: HeroProps) {
  const [heroRef, heroInView] = useInView<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-accent-primary/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-accent-secondary/15 rounded-full blur-[100px] animate-float delay-500" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '100px 100px',
          }}
        />

        {/* Noise texture */}
        <div className="absolute inset-0 bg-noise" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8',
            'opacity-0 transition-all duration-700',
            heroInView && 'opacity-100 animate-slide-down'
          )}
        >
          <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
          <span className="text-sm text-white/70">Business Operations Diagnostic</span>
        </div>

        {/* Main headline */}
        <h1
          className={cn(
            'text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6',
            'text-gradient',
            'opacity-0 transition-all duration-700 delay-100',
            heroInView && 'opacity-100 animate-slide-up'
          )}
        >
          Your business is growing —{' '}
          <span className="block mt-2">
            but your operations are{' '}
            <span className="text-gradient-accent">breaking silently.</span>
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className={cn(
            'text-lg sm:text-xl md:text-2xl text-white/60 max-w-2xl mx-auto mb-12',
            'opacity-0 transition-all duration-700 delay-200',
            heroInView && 'opacity-100 animate-slide-up'
          )}
        >
          Answer 9 quick questions and discover your real operational load.
        </p>

        {/* CTA Button */}
        <div
          className={cn(
            'opacity-0 transition-all duration-700 delay-300',
            heroInView && 'opacity-100 animate-slide-up'
          )}
        >
          <Button
            size="lg"
            onClick={onStartDiagnostic}
            className="group text-lg px-10 py-5"
          >
            <span className="relative z-10 flex items-center gap-2">
              Run My Business Diagnostic
              <svg
                className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </span>
          </Button>
        </div>

        {/* Trust indicators */}
        <div
          className={cn(
            'mt-16 flex flex-wrap justify-center gap-8 text-white/40 text-sm',
            'opacity-0 transition-all duration-700 delay-400',
            heroInView && 'opacity-100 animate-fade-in'
          )}
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Takes 2 minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>100% confidential</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Instant results</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className={cn(
          'absolute bottom-8 left-1/2 -translate-x-1/2',
          'opacity-0 transition-all duration-700 delay-500',
          heroInView && 'opacity-100 animate-fade-in'
        )}
      >
        <button
          onClick={onStartDiagnostic}
          className="flex flex-col items-center gap-2 text-white/40 hover:text-white/70 transition-colors duration-300"
          aria-label="Start diagnostic"
        >
          <span className="text-xs uppercase tracking-widest">Begin</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </button>
      </div>
    </section>
  );
}

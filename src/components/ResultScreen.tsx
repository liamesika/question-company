'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button, GlassCard } from '@/components/ui';
import { ChaosScoreResult } from '@/types/diagnostic';
import { getRiskColor, getRiskGradient } from '@/lib/chaos-calculator';
import { useInView } from '@/hooks/useInView';
import { Calendar, TrendingDown, Clock, AlertTriangle, CheckCircle, XCircle, AlertCircle, Flame } from 'lucide-react';

interface ResultScreenProps {
  result: ChaosScoreResult;
}

export function ResultScreen({ result }: ResultScreenProps) {
  const [sectionRef, sectionInView] = useInView<HTMLDivElement>({ threshold: 0.1 });
  const [animatedScore, setAnimatedScore] = useState(0);
  const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL || '#';

  useEffect(() => {
    if (sectionInView) {
      const duration = 2000;
      const steps = 60;
      const increment = result.score / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= result.score) {
          setAnimatedScore(result.score);
          clearInterval(timer);
        } else {
          setAnimatedScore(Math.round(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [sectionInView, result.score]);

  const RiskIcon = {
    LOW: CheckCircle,
    MEDIUM: AlertCircle,
    HIGH: AlertTriangle,
    CRITICAL: Flame,
  }[result.riskLevel];

  const riskColor = getRiskColor(result.riskLevel);
  const riskGradient = getRiskGradient(result.riskLevel);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20"
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px] opacity-30"
          style={{ backgroundColor: riskColor }}
        />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto">
        {/* Header */}
        <div
          className={cn(
            'text-center mb-12',
            'opacity-0 transition-all duration-700',
            sectionInView && 'opacity-100 animate-slide-up'
          )}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
            <span className="text-sm text-white/70">Your Diagnostic Results</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gradient leading-tight mb-4">
            {result.headline}
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            {result.description}
          </p>
        </div>

        {/* Score Card */}
        <GlassCard
          variant="glow"
          className={cn(
            'p-8 md:p-12 mb-8',
            'opacity-0 transition-all duration-700 delay-200',
            sectionInView && 'opacity-100 animate-slide-up'
          )}
        >
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Score Visualization */}
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48 md:w-56 md:h-56">
                {/* Background circle */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    fill="none"
                    stroke={riskColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${animatedScore * 2.83} 283`}
                    className="transition-all duration-500"
                    style={{
                      filter: `drop-shadow(0 0 10px ${riskColor})`,
                    }}
                  />
                </svg>
                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className="text-5xl md:text-6xl font-bold"
                    style={{ color: riskColor }}
                  >
                    {animatedScore}
                  </span>
                  <span className="text-white/50 text-sm uppercase tracking-wider">
                    Chaos Score
                  </span>
                </div>
              </div>

              {/* Risk Level Badge */}
              <div
                className={cn(
                  'mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full',
                  `bg-gradient-to-r ${riskGradient}`
                )}
              >
                <RiskIcon className="w-5 h-5" style={{ color: riskColor }} />
                <span className="font-semibold" style={{ color: riskColor }}>
                  {result.riskLevel} RISK
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-xl glass">
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <Clock className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-white/50 text-sm">Estimated Hours Lost Monthly</p>
                  <p className="text-2xl font-bold text-white">
                    {result.hoursLostPerMonth} hours
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl glass">
                <div className="p-3 rounded-lg bg-red-500/10">
                  <TrendingDown className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="text-white/50 text-sm">Estimated Monthly Leakage</p>
                  <p className="text-2xl font-bold text-white">
                    {result.moneyLeakageRange}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Impact Areas */}
        <div
          className={cn(
            'grid sm:grid-cols-3 gap-4 mb-12',
            'opacity-0 transition-all duration-700 delay-300',
            sectionInView && 'opacity-100 animate-slide-up'
          )}
        >
          {[
            { icon: XCircle, label: 'Growth Blocked', color: 'text-red-400' },
            { icon: AlertTriangle, label: 'Resources Wasted', color: 'text-orange-400' },
            { icon: Clock, label: 'Time Leaking', color: 'text-yellow-400' },
          ].map((item, index) => (
            <GlassCard key={index} className="p-5 text-center">
              <item.icon className={cn('w-8 h-8 mx-auto mb-3', item.color)} />
              <p className="text-white/70 text-sm">{item.label}</p>
            </GlassCard>
          ))}
        </div>

        {/* CTA Section */}
        <GlassCard
          variant="elevated"
          className={cn(
            'p-8 md:p-12 text-center',
            'opacity-0 transition-all duration-700 delay-400',
            sectionInView && 'opacity-100 animate-slide-up'
          )}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Stop the Operational Bleed
          </h2>
          <p className="text-white/60 mb-8 max-w-xl mx-auto">
            In 15 minutes, we&apos;ll show you exactly where your operations are breaking
            and how to fix them systematically.
          </p>
          <Button
            size="lg"
            onClick={() => window.open(bookingUrl, '_blank')}
            className="group text-lg px-10"
          >
            <span className="flex items-center gap-3">
              <Calendar className="w-5 h-5" />
              Book a 15-minute Private Operations Review
            </span>
          </Button>
          <p className="text-white/40 text-sm mt-4">
            No sales pitch. Just clarity.
          </p>
        </GlassCard>

        {/* Footer */}
        <p className="text-center text-white/30 text-sm mt-12">
          Your responses are confidential and used only to personalize your diagnostic.
        </p>
      </div>
    </section>
  );
}

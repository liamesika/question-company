'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button, GlassCard } from '@/components/ui';
import { ChaosScoreResult } from '@/types/diagnostic';
import { getRiskColor, getRiskGradient } from '@/lib/chaos-calculator';
import { useInView } from '@/hooks/useInView';
import { TrendingDown, Clock, AlertTriangle, CheckCircle, XCircle, AlertCircle, Flame, MessageCircle } from 'lucide-react';

interface ResultScreenProps {
  result: ChaosScoreResult;
}

export function ResultScreen({ result }: ResultScreenProps) {
  const [sectionRef, sectionInView] = useInView<HTMLDivElement>({ threshold: 0.1 });
  const [animatedScore, setAnimatedScore] = useState(0);

  // WhatsApp CTA with pre-filled message
  const whatsappNumber = '972558835990';
  const whatsappMessage = encodeURIComponent(
    `Hi, I just completed the Effinity Business Diagnostic. My risk level is ${result.riskLevel} and my chaos score is ${result.score}. I'd like to book a 15-minute review.`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

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

        {/* WhatsApp CTA Section */}
        <GlassCard
          variant="elevated"
          className={cn(
            'p-8 md:p-12 text-center relative overflow-hidden',
            'opacity-0 transition-all duration-700 delay-400',
            sectionInView && 'opacity-100 animate-slide-up'
          )}
        >
          {/* Subtle WhatsApp green glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#25D366]/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Book a 15-minute Private Operations Review
            </h2>
            <p className="text-lg text-white/60 mb-8 max-w-xl mx-auto">
              No sales pitch. Just clarity.
            </p>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 md:px-10 md:py-5
                         bg-[#25D366] hover:bg-[#20BD5A] active:bg-[#1DA851]
                         text-white font-semibold text-lg md:text-xl
                         rounded-xl shadow-lg shadow-[#25D366]/25
                         transform transition-all duration-200
                         hover:scale-[1.02] hover:shadow-xl hover:shadow-[#25D366]/30
                         focus:outline-none focus:ring-4 focus:ring-[#25D366]/40
                         active:scale-[0.98]"
            >
              <MessageCircle className="w-6 h-6 md:w-7 md:h-7" />
              <span>Book on WhatsApp</span>
            </a>

            <p className="text-white/40 text-sm mt-6">
              Opens WhatsApp with your diagnostic results
            </p>
          </div>
        </GlassCard>

        {/* Footer */}
        <p className="text-center text-white/30 text-sm mt-12">
          Your responses are confidential and used only to personalize your diagnostic.
        </p>
      </div>
    </section>
  );
}

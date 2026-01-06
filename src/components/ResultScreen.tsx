'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { GlassCard, LanguageToggle } from '@/components/ui';
import { ChaosScoreResult } from '@/types/diagnostic';
import { getRiskColor, getRiskGradient } from '@/lib/chaos-calculator';
import { useInView } from '@/hooks/useInView';
import { useLocale } from '@/contexts/LocaleContext';
import { TrendingDown, Clock, AlertTriangle, CheckCircle, XCircle, AlertCircle, Flame, MessageCircle } from 'lucide-react';

interface ResultScreenProps {
  result: ChaosScoreResult;
}

export function ResultScreen({ result }: ResultScreenProps) {
  const { locale, t, dict, isRTL, direction } = useLocale();
  const [sectionRef, sectionInView] = useInView<HTMLDivElement>({ threshold: 0.1 });
  const [animatedScore, setAnimatedScore] = useState(0);

  // WhatsApp CTA with pre-filled message
  const whatsappNumber = '972558835990';
  const whatsappMessage = encodeURIComponent(
    locale === 'he'
      ? `היי, סיימתי עכשיו את האבחון העסקי של Effinity. רמת הסיכון שלי היא ${dict.result.riskLevels[result.riskLevel]} וציון הכאוס שלי הוא ${result.score}. אשמח לקבוע פגישת סקירה של 15 דקות.`
      : `Hi, I just completed the Effinity Business Diagnostic. My risk level is ${result.riskLevel} and my chaos score is ${result.score}. I'd like to book a 15-minute review.`
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

  // Get localized result text
  const getLocalizedHeadline = () => dict.result.headlines[result.riskLevel] || result.headline;
  const getLocalizedDescription = () => dict.result.descriptions[result.riskLevel] || result.description;
  const getLocalizedRiskLevel = () => dict.result.riskLevels[result.riskLevel] || result.riskLevel;

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20"
      dir={direction}
      lang={locale}
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px] opacity-30"
          style={{ backgroundColor: riskColor }}
        />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto">
        {/* Language Toggle */}
        <div className={cn(
          "flex justify-end mb-6",
          isRTL && "justify-start"
        )}>
          <LanguageToggle />
        </div>

        {/* Header */}
        <div
          className={cn(
            'text-center mb-12',
            'opacity-0 transition-all duration-700',
            sectionInView && 'opacity-100 animate-slide-up'
          )}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
            <span className="text-sm text-white/70">{dict.result.title}</span>
          </div>
          <h1 className={cn(
            "text-3xl sm:text-4xl md:text-5xl font-bold text-gradient leading-tight mb-4",
            isRTL && "font-hebrew"
          )}>
            {getLocalizedHeadline()}
          </h1>
          <p className={cn(
            "text-lg text-white/60 max-w-2xl mx-auto",
            isRTL && "font-hebrew"
          )}>
            {getLocalizedDescription()}
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
          <div className={cn(
            "grid md:grid-cols-2 gap-8 md:gap-12 items-center",
            isRTL && "md:grid-flow-col-dense"
          )}>
            {/* Score Visualization */}
            <div className={cn(
              "flex flex-col items-center",
              isRTL && "md:order-2"
            )}>
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
                  <span className={cn(
                    "text-white/50 text-sm uppercase tracking-wider",
                    isRTL && "font-hebrew"
                  )}>
                    {dict.result.chaosScore}
                  </span>
                </div>
              </div>

              {/* Risk Level Badge */}
              <div
                className={cn(
                  'mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full',
                  `bg-gradient-to-r ${riskGradient}`,
                  isRTL && "flex-row-reverse"
                )}
              >
                <RiskIcon className="w-5 h-5" style={{ color: riskColor }} />
                <span className={cn(
                  "font-semibold",
                  isRTL && "font-hebrew"
                )} style={{ color: riskColor }}>
                  {getLocalizedRiskLevel()}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className={cn(
              "space-y-6",
              isRTL && "md:order-1"
            )}>
              <div className={cn(
                "flex items-start gap-4 p-4 rounded-xl glass",
                isRTL && "flex-row-reverse text-right"
              )}>
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <Clock className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <p className={cn(
                    "text-white/50 text-sm",
                    isRTL && "font-hebrew"
                  )}>
                    {dict.result.hoursLost} {dict.result.perMonth}
                  </p>
                  <p className="text-2xl font-bold text-white" dir="ltr">
                    {result.hoursLostPerMonth} {locale === 'he' ? 'שעות' : 'hours'}
                  </p>
                </div>
              </div>

              <div className={cn(
                "flex items-start gap-4 p-4 rounded-xl glass",
                isRTL && "flex-row-reverse text-right"
              )}>
                <div className="p-3 rounded-lg bg-red-500/10">
                  <TrendingDown className={cn(
                    "w-6 h-6 text-red-400",
                    isRTL && "scale-x-[-1]"
                  )} />
                </div>
                <div>
                  <p className={cn(
                    "text-white/50 text-sm",
                    isRTL && "font-hebrew"
                  )}>
                    {dict.result.moneyLeakage} {dict.result.perMonth}
                  </p>
                  <p className="text-2xl font-bold text-white" dir="ltr">
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
            { icon: XCircle, label: locale === 'he' ? 'צמיחה חסומה' : 'Growth Blocked', color: 'text-red-400' },
            { icon: AlertTriangle, label: locale === 'he' ? 'משאבים מבוזבזים' : 'Resources Wasted', color: 'text-orange-400' },
            { icon: Clock, label: locale === 'he' ? 'זמן דולף' : 'Time Leaking', color: 'text-yellow-400' },
          ].map((item, index) => (
            <GlassCard key={index} className="p-5 text-center">
              <item.icon className={cn('w-8 h-8 mx-auto mb-3', item.color)} />
              <p className={cn(
                "text-white/70 text-sm",
                isRTL && "font-hebrew"
              )}>{item.label}</p>
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
            <h2 className={cn(
              "text-2xl md:text-3xl font-bold text-white mb-3",
              isRTL && "font-hebrew"
            )}>
              {locale === 'he'
                ? 'קבע פגישת סקירה תפעולית פרטית של 15 דקות'
                : 'Book a 15-minute Private Operations Review'}
            </h2>
            <p className={cn(
              "text-lg text-white/60 mb-8 max-w-xl mx-auto",
              isRTL && "font-hebrew"
            )}>
              {locale === 'he' ? 'ללא מכירות. רק בהירות.' : 'No sales pitch. Just clarity.'}
            </p>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center justify-center gap-3 px-8 py-4 md:px-10 md:py-5",
                "bg-[#25D366] hover:bg-[#20BD5A] active:bg-[#1DA851]",
                "text-white font-semibold text-lg md:text-xl",
                "rounded-xl shadow-lg shadow-[#25D366]/25",
                "transform transition-all duration-200",
                "hover:scale-[1.02] hover:shadow-xl hover:shadow-[#25D366]/30",
                "focus:outline-none focus:ring-4 focus:ring-[#25D366]/40",
                "active:scale-[0.98]",
                isRTL && "flex-row-reverse font-hebrew"
              )}
            >
              <MessageCircle className="w-6 h-6 md:w-7 md:h-7" />
              <span>{locale === 'he' ? 'קבע בוואטסאפ' : 'Book on WhatsApp'}</span>
            </a>

            <p className={cn(
              "text-white/40 text-sm mt-6",
              isRTL && "font-hebrew"
            )}>
              {locale === 'he'
                ? 'פותח וואטסאפ עם תוצאות האבחון שלך'
                : 'Opens WhatsApp with your diagnostic results'}
            </p>
          </div>
        </GlassCard>

        {/* Footer */}
        <p className={cn(
          "text-center text-white/30 text-sm mt-12",
          isRTL && "font-hebrew"
        )}>
          {locale === 'he'
            ? 'התשובות שלך חסויות ומשמשות רק להתאמה אישית של האבחון שלך.'
            : 'Your responses are confidential and used only to personalize your diagnostic.'}
        </p>
      </div>

      <style jsx>{`
        .font-hebrew {
          font-family: 'Heebo', 'Arial', sans-serif;
        }
      `}</style>
    </section>
  );
}

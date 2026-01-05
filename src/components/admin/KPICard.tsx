'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
  isLoading?: boolean;
}

const colorClasses = {
  default: {
    bg: 'bg-accent-primary/10',
    icon: 'text-accent-primary',
    trend: 'text-accent-primary',
  },
  success: {
    bg: 'bg-green-500/10',
    icon: 'text-green-400',
    trend: 'text-green-400',
  },
  warning: {
    bg: 'bg-yellow-500/10',
    icon: 'text-yellow-400',
    trend: 'text-yellow-400',
  },
  danger: {
    bg: 'bg-red-500/10',
    icon: 'text-red-400',
    trend: 'text-red-400',
  },
  info: {
    bg: 'bg-blue-500/10',
    icon: 'text-blue-400',
    trend: 'text-blue-400',
  },
};

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'default',
  onClick,
  isLoading,
}: KPICardProps) {
  const colors = colorClasses[color];

  return (
    <div
      onClick={onClick}
      className={cn(
        'glass-card rounded-2xl p-6 transition-all duration-300',
        onClick && 'cursor-pointer hover:bg-glass-hover hover:border-white/20'
      )}
    >
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-white/10 rounded w-24" />
            <div className="w-10 h-10 bg-white/10 rounded-xl" />
          </div>
          <div className="h-8 bg-white/10 rounded w-20" />
          <div className="h-3 bg-white/10 rounded w-32" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-white/50">{title}</span>
            <div className={cn('p-2.5 rounded-xl', colors.bg)}>
              <Icon className={cn('w-5 h-5', colors.icon)} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{value}</span>
              {trend && (
                <span
                  className={cn(
                    'text-sm font-medium',
                    trend.isPositive ? 'text-green-400' : 'text-red-400'
                  )}
                >
                  {trend.isPositive ? '+' : ''}
                  {trend.value}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-white/40">{subtitle}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

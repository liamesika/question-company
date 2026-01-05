'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Calendar, ChevronDown } from 'lucide-react';

export type DateRange = 'today' | '7d' | '30d' | '90d' | 'all' | 'custom';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange, dates?: { start: Date; end: Date }) => void;
  className?: string;
}

const options: { value: DateRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(opt => opt.value === value) || options[2];

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-xl',
          'glass-card text-white text-sm',
          'hover:bg-glass-hover transition-all duration-200'
        )}
      >
        <Calendar className="w-4 h-4 text-white/50" />
        <span>{selectedOption.label}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-white/50 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 py-2 rounded-xl glass-card shadow-glass z-50">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full px-4 py-2.5 text-left text-sm transition-colors duration-200',
                  option.value === value
                    ? 'bg-accent-primary/10 text-accent-primary'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function getDateRangeFilter(range: DateRange): { start: Date; end: Date } | null {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  switch (range) {
    case 'today':
      const startToday = new Date(now);
      startToday.setHours(0, 0, 0, 0);
      return { start: startToday, end };
    case '7d':
      const start7d = new Date(now);
      start7d.setDate(start7d.getDate() - 7);
      start7d.setHours(0, 0, 0, 0);
      return { start: start7d, end };
    case '30d':
      const start30d = new Date(now);
      start30d.setDate(start30d.getDate() - 30);
      start30d.setHours(0, 0, 0, 0);
      return { start: start30d, end };
    case '90d':
      const start90d = new Date(now);
      start90d.setDate(start90d.getDate() - 90);
      start90d.setHours(0, 0, 0, 0);
      return { start: start90d, end };
    case 'all':
    default:
      return null;
  }
}

'use client';

import { cn } from '@/lib/utils';

interface RadioOptionProps {
  value: string;
  label: string;
  isSelected: boolean;
  onSelect: (value: string) => void;
}

export function RadioOption({ value, label, isSelected, onSelect }: RadioOptionProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        'w-full p-4 md:p-5 rounded-xl text-left transition-all duration-300',
        'border focus:outline-none focus-glow',
        isSelected
          ? 'bg-gradient-to-r from-accent-primary/20 to-accent-secondary/10 border-accent-primary/50 text-white'
          : 'glass-card text-white/80 hover:bg-glass-hover hover:border-white/20 hover:text-white'
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300',
            isSelected
              ? 'border-accent-primary bg-accent-primary/20'
              : 'border-white/30'
          )}
        >
          {isSelected && (
            <div className="w-2.5 h-2.5 rounded-full bg-accent-primary animate-scale-in" />
          )}
        </div>
        <span className="text-base md:text-lg">{label}</span>
      </div>
    </button>
  );
}

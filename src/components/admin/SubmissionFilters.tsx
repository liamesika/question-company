'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { Search, Filter, X, ChevronDown } from 'lucide-react';

export interface FilterState {
  search: string;
  riskLevel: string[];
  status: string[];
  deviceType: string[];
  chaosScoreMin: string;
  chaosScoreMax: string;
  q8: string[];
  country: string;
  startDate: string;
  endDate: string;
}

interface SubmissionFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

const riskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const statuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'DISQUALIFIED', 'CLOSED'];
const deviceTypes = ['mobile', 'desktop', 'tablet'];
const q8Options = [
  { value: 'operational-disorder', label: 'Operational Disorder' },
  { value: 'people-dependence', label: 'People Dependence' },
  { value: 'management-overload', label: 'Management Overload' },
  { value: 'time-waste', label: 'Time Waste' },
  { value: 'no-control', label: 'No Control' },
  { value: 'combination', label: 'Combination' },
];

export function SubmissionFilters({ filters, onChange, onReset }: SubmissionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters =
    filters.riskLevel.length > 0 ||
    filters.status.length > 0 ||
    filters.deviceType.length > 0 ||
    filters.q8.length > 0 ||
    filters.chaosScoreMin ||
    filters.chaosScoreMax ||
    filters.country ||
    filters.startDate ||
    filters.endDate;

  const toggleArrayFilter = (key: keyof FilterState, value: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: updated });
  };

  return (
    <div className="space-y-4">
      {/* Search and toggle row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search notes, email, systems..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className={cn(
              'w-full pl-12 pr-4 py-3 rounded-xl',
              'glass-card text-white placeholder:text-white/40',
              'focus:outline-none focus-glow'
            )}
          />
        </div>
        <Button
          variant="secondary"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-accent-primary" />
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={onReset} className="flex items-center gap-2">
            <X className="w-4 h-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="p-6 rounded-xl glass-card space-y-6">
          {/* Date range */}
          <div>
            <label className="text-sm text-white/50 mb-2 block">Date Range</label>
            <div className="flex gap-4">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
                className="flex-1 px-4 py-2 rounded-lg glass-card text-white text-sm focus:outline-none focus-glow"
              />
              <span className="text-white/50 self-center">to</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
                className="flex-1 px-4 py-2 rounded-lg glass-card text-white text-sm focus:outline-none focus-glow"
              />
            </div>
          </div>

          {/* Risk Level */}
          <div>
            <label className="text-sm text-white/50 mb-2 block">Risk Level</label>
            <div className="flex flex-wrap gap-2">
              {riskLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => toggleArrayFilter('riskLevel', level)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm transition-colors',
                    filters.riskLevel.includes(level)
                      ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30'
                      : 'glass text-white/70 hover:text-white'
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm text-white/50 mb-2 block">Status</label>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => toggleArrayFilter('status', status)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm transition-colors',
                    filters.status.includes(status)
                      ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30'
                      : 'glass text-white/70 hover:text-white'
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Chaos Score Range */}
          <div>
            <label className="text-sm text-white/50 mb-2 block">Chaos Score Range</label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Min"
                value={filters.chaosScoreMin}
                onChange={(e) => onChange({ ...filters, chaosScoreMin: e.target.value })}
                className="w-24 px-4 py-2 rounded-lg glass-card text-white text-sm focus:outline-none focus-glow"
              />
              <span className="text-white/50">to</span>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Max"
                value={filters.chaosScoreMax}
                onChange={(e) => onChange({ ...filters, chaosScoreMax: e.target.value })}
                className="w-24 px-4 py-2 rounded-lg glass-card text-white text-sm focus:outline-none focus-glow"
              />
            </div>
          </div>

          {/* Q8 Categories */}
          <div>
            <label className="text-sm text-white/50 mb-2 block">Growth Blocker (Q8)</label>
            <div className="flex flex-wrap gap-2">
              {q8Options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleArrayFilter('q8', opt.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm transition-colors',
                    filters.q8.includes(opt.value)
                      ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30'
                      : 'glass text-white/70 hover:text-white'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Device Type */}
          <div>
            <label className="text-sm text-white/50 mb-2 block">Device Type</label>
            <div className="flex flex-wrap gap-2">
              {deviceTypes.map((device) => (
                <button
                  key={device}
                  onClick={() => toggleArrayFilter('deviceType', device)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm capitalize transition-colors',
                    filters.deviceType.includes(device)
                      ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30'
                      : 'glass text-white/70 hover:text-white'
                  )}
                >
                  {device}
                </button>
              ))}
            </div>
          </div>

          {/* Country */}
          <div>
            <label className="text-sm text-white/50 mb-2 block">Country</label>
            <input
              type="text"
              placeholder="Filter by country..."
              value={filters.country}
              onChange={(e) => onChange({ ...filters, country: e.target.value })}
              className="w-full max-w-xs px-4 py-2 rounded-lg glass-card text-white text-sm focus:outline-none focus-glow"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export const defaultFilters: FilterState = {
  search: '',
  riskLevel: [],
  status: [],
  deviceType: [],
  chaosScoreMin: '',
  chaosScoreMax: '',
  q8: [],
  country: '',
  startDate: '',
  endDate: '',
};

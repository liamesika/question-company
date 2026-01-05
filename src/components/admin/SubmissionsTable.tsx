'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button, GlassCard } from '@/components/ui';
import {
  ChevronUp,
  ChevronDown,
  Eye,
  Trash2,
  CheckSquare,
  Square,
  MoreHorizontal,
} from 'lucide-react';
import { format } from 'date-fns';

interface Submission {
  id: string;
  createdAt: string;
  chaosScore: number;
  riskLevel: string;
  q2: string;
  q8: string;
  deviceType: string | null;
  country: string | null;
  status: string;
}

interface SubmissionsTableProps {
  submissions: Submission[];
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
  sortBy: string;
  sortOrder: string;
  onSort: (field: string) => void;
  onStatusChange: (ids: string[], status: string) => void;
  onDelete: (ids: string[]) => void;
}

const q2Labels: Record<string, string> = {
  'less-than-5': '<5 min',
  'up-to-30': '<30 min',
  'more-than-30': '>30 min',
  'no-trust': 'No trust',
};

const q8Labels: Record<string, string> = {
  'operational-disorder': 'Op. Disorder',
  'people-dependence': 'People Dep.',
  'management-overload': 'Mgmt Overload',
  'time-waste': 'Time Waste',
  'no-control': 'No Control',
  'combination': 'Combination',
};

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-500/20 text-blue-400',
  CONTACTED: 'bg-yellow-500/20 text-yellow-400',
  QUALIFIED: 'bg-green-500/20 text-green-400',
  DISQUALIFIED: 'bg-red-500/20 text-red-400',
  CLOSED: 'bg-purple-500/20 text-purple-400',
};

const riskColors: Record<string, string> = {
  LOW: 'bg-green-500/20 text-green-400',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400',
  HIGH: 'bg-orange-500/20 text-orange-400',
  CRITICAL: 'bg-red-500/20 text-red-400',
};

export function SubmissionsTable({
  submissions,
  selectedIds,
  onSelectChange,
  sortBy,
  sortOrder,
  onSort,
  onStatusChange,
  onDelete,
}: SubmissionsTableProps) {
  const router = useRouter();
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const toggleSelectAll = () => {
    if (selectedIds.length === submissions.length) {
      onSelectChange([]);
    } else {
      onSelectChange(submissions.map((s) => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectChange([...selectedIds, id]);
    }
  };

  const SortHeader = ({ field, label }: { field: string; label: string }) => (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-white transition-colors"
    >
      {label}
      {sortBy === field && (
        sortOrder === 'asc' ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )
      )}
    </button>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="px-4 py-3 text-left">
              <button onClick={toggleSelectAll} className="text-white/50 hover:text-white">
                {selectedIds.length === submissions.length && submissions.length > 0 ? (
                  <CheckSquare className="w-5 h-5" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
              </button>
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-white/50">
              <SortHeader field="createdAt" label="Date" />
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-white/50">
              <SortHeader field="chaosScore" label="Score" />
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-white/50">
              <SortHeader field="riskLevel" label="Risk" />
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-white/50">Q2</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-white/50">Q8</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-white/50">Device</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-white/50">Country</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-white/50">
              <SortHeader field="status" label="Status" />
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-white/50">Actions</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => (
            <tr
              key={submission.id}
              className="border-b border-white/5 hover:bg-white/5 transition-colors"
            >
              <td className="px-4 py-3">
                <button
                  onClick={() => toggleSelect(submission.id)}
                  className="text-white/50 hover:text-white"
                >
                  {selectedIds.includes(submission.id) ? (
                    <CheckSquare className="w-5 h-5 text-accent-primary" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
              </td>
              <td className="px-4 py-3 text-sm text-white/70">
                {format(new Date(submission.createdAt), 'MMM d, yyyy HH:mm')}
              </td>
              <td className="px-4 py-3">
                <span className="text-white font-medium">{submission.chaosScore}</span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'px-2 py-1 rounded-md text-xs font-medium',
                    riskColors[submission.riskLevel]
                  )}
                >
                  {submission.riskLevel}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-white/70">
                {q2Labels[submission.q2] || submission.q2}
              </td>
              <td className="px-4 py-3 text-sm text-white/70">
                {q8Labels[submission.q8] || submission.q8}
              </td>
              <td className="px-4 py-3 text-sm text-white/50 capitalize">
                {submission.deviceType || '-'}
              </td>
              <td className="px-4 py-3 text-sm text-white/50">
                {submission.country || '-'}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'px-2 py-1 rounded-md text-xs font-medium',
                    statusColors[submission.status]
                  )}
                >
                  {submission.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => router.push(`/admin/submissions/${submission.id}`)}
                    className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setActionMenuOpen(actionMenuOpen === submission.id ? null : submission.id)}
                      className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {actionMenuOpen === submission.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setActionMenuOpen(null)}
                        />
                        <div className="absolute right-0 mt-1 w-40 py-1 rounded-xl glass-card shadow-glass z-50">
                          {['NEW', 'CONTACTED', 'QUALIFIED', 'DISQUALIFIED', 'CLOSED'].map((status) => (
                            <button
                              key={status}
                              onClick={() => {
                                onStatusChange([submission.id], status);
                                setActionMenuOpen(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/5 hover:text-white"
                            >
                              Set {status}
                            </button>
                          ))}
                          <div className="border-t border-white/10 my-1" />
                          <button
                            onClick={() => {
                              onDelete([submission.id]);
                              setActionMenuOpen(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {submissions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/50">No submissions found</p>
        </div>
      )}
    </div>
  );
}

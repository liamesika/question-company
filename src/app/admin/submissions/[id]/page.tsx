'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Copy,
  Download,
  ExternalLink,
  Save,
  Trash2,
  Phone,
  Mail,
  Clock,
  Globe,
  Smartphone,
  TrendingDown,
  Zap,
  CheckCircle,
} from 'lucide-react';
import { format } from 'date-fns';

interface Submission {
  id: string;
  createdAt: string;
  updatedAt: string;
  source: string;
  ip: string | null;
  country: string | null;
  deviceType: string | null;
  userAgent: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
  q6: string;
  q7: string;
  q8: string;
  q9: string | null;
  chaosScore: number;
  riskLevel: string;
  estimatedHoursLostMonthly: number;
  estimatedLeakageMin: number;
  estimatedLeakageMax: number;
  leadEmail: string | null;
  leadPhone: string | null;
  notes: string | null;
  status: string;
  sheetRowId: string | null;
}

const questionLabels: Record<string, string> = {
  q1: 'How many places do you check to understand your business?',
  q2: 'Time to reach a reliable financial number?',
  q3: 'Hours spent "collecting a picture" instead of managing?',
  q4: 'Time to understand where an operational issue originated?',
  q5: 'People involved in non-revenue producing operations?',
  q6: 'Impact when an employee leaves or is absent?',
  q7: 'Times forced to handle small operational issues?',
  q8: 'What slows down your growth the most?',
  q9: 'Systems currently used to manage information?',
};

const answerLabels: Record<string, Record<string, string>> = {
  q1: { '1-2': '1–2', '3-5': '3–5', '6-9': '6–9', '10+': '10+' },
  q2: { 'less-than-5': 'Less than 5 min', 'up-to-30': 'Up to 30 min', 'more-than-30': 'More than 30 min', 'no-trust': 'No trusted number' },
  q3: { 'less-than-2': 'Less than 2', '2-5': '2–5', '5-10': '5–10', '10+': '10+' },
  q4: { 'immediately': 'Immediately', 'few-hours': 'Within hours', '1-2-days': '1–2 days', 'after-damage': 'After damage' },
  q5: { '0': '0', '1-2': '1–2', '3-5': '3–5', '6+': '6+' },
  q6: { 'almost-not': 'Almost not at all', 'a-little': 'A little', 'very-much': 'Very much', 'paralyzes': 'Paralyzes activity' },
  q7: { 'almost-never': 'Almost never', '1-3': '1–3 times', '4-10': '4–10 times', 'every-day': 'Almost every day' },
  q8: {
    'operational-disorder': 'Operational disorder',
    'people-dependence': 'Over-dependence on people',
    'management-overload': 'Daily management overload',
    'time-waste': 'Time wasted on non-profitable tasks',
    'no-control': 'No real-time control',
    'combination': 'Combination of several',
  },
};

const statusOptions = ['NEW', 'CONTACTED', 'QUALIFIED', 'DISQUALIFIED', 'CLOSED'];

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  CONTACTED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  QUALIFIED: 'bg-green-500/20 text-green-400 border-green-500/30',
  DISQUALIFIED: 'bg-red-500/20 text-red-400 border-red-500/30',
  CLOSED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const riskColors: Record<string, string> = {
  LOW: 'text-green-400',
  MEDIUM: 'text-yellow-400',
  HIGH: 'text-orange-400',
  CRITICAL: 'text-red-400',
};

export default function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchSubmission = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/submissions/${id}`);
      const data = await response.json();
      if (data.submission) {
        setSubmission(data.submission);
        setNotes(data.submission.notes || '');
        setStatus(data.submission.status);
        setLeadEmail(data.submission.leadEmail || '');
        setLeadPhone(data.submission.leadPhone || '');
      }
    } catch (error) {
      console.error('Error fetching submission:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/admin/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, status, leadEmail, leadPhone }),
      });
      fetchSubmission();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this submission?')) return;
    try {
      await fetch(`/api/admin/submissions/${id}`, { method: 'DELETE' });
      router.push('/admin/submissions');
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const copySummary = () => {
    if (!submission) return;
    const summary = `
Diagnostic Summary
==================
Date: ${format(new Date(submission.createdAt), 'PPpp')}
Chaos Score: ${submission.chaosScore}/100
Risk Level: ${submission.riskLevel}
Hours Lost Monthly: ${submission.estimatedHoursLostMonthly}
Estimated Leakage: $${submission.estimatedLeakageMin.toLocaleString()} - $${submission.estimatedLeakageMax.toLocaleString()}

Answers:
${Object.entries(questionLabels).map(([key, label]) => {
  const answer = submission[key as keyof Submission];
  const displayAnswer = key === 'q9' ? answer : (answerLabels[key]?.[answer as string] || answer);
  return `${label}\n→ ${displayAnswer || 'N/A'}`;
}).join('\n\n')}

Device: ${submission.deviceType || 'N/A'}
Country: ${submission.country || 'N/A'}
    `.trim();

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (!submission) return;
    let content: string;
    let mimeType: string;

    if (format === 'json') {
      content = JSON.stringify(submission, null, 2);
      mimeType = 'application/json';
    } else {
      const headers = Object.keys(submission).join(',');
      const values = Object.values(submission).map(v =>
        typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v
      ).join(',');
      content = `${headers}\n${values}`;
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submission-${id}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-12">
        <p className="text-white/50">Submission not found</p>
        <Button variant="ghost" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Submission Detail</h1>
            <p className="text-white/50 text-sm mt-1">
              {format(new Date(submission.createdAt), 'PPpp')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={copySummary}>
            {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy Summary'}
          </Button>
          <Button variant="secondary" onClick={() => handleExport('csv')}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button variant="secondary" onClick={() => handleExport('json')}>
            <Download className="w-4 h-4 mr-2" />
            JSON
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Score card */}
          <GlassCard className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className={cn('w-5 h-5', riskColors[submission.riskLevel])} />
                  <span className="text-sm text-white/50">Chaos Score</span>
                </div>
                <p className={cn('text-3xl font-bold', riskColors[submission.riskLevel])}>
                  {submission.chaosScore}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-white/50 mb-2">Risk Level</p>
                <p className={cn('text-xl font-bold', riskColors[submission.riskLevel])}>
                  {submission.riskLevel}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-orange-400" />
                  <span className="text-sm text-white/50">Hours Lost/Month</span>
                </div>
                <p className="text-xl font-bold text-white">
                  {submission.estimatedHoursLostMonthly}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-red-400" />
                  <span className="text-sm text-white/50">Monthly Leakage</span>
                </div>
                <p className="text-lg font-bold text-white">
                  ${submission.estimatedLeakageMin.toLocaleString()} - ${submission.estimatedLeakageMax.toLocaleString()}
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Answers */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Questionnaire Answers</h3>
            <div className="space-y-4">
              {Object.entries(questionLabels).map(([key, label]) => {
                const answer = submission[key as keyof Submission] as string;
                const displayAnswer = key === 'q9' ? answer : (answerLabels[key]?.[answer] || answer);
                return (
                  <div key={key} className="p-4 rounded-xl bg-dark-700/50">
                    <p className="text-sm text-white/50 mb-1">{label}</p>
                    <p className="text-white">{displayAnswer || 'N/A'}</p>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Metadata */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Technical Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-dark-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-4 h-4 text-white/40" />
                  <span className="text-xs text-white/50">Country</span>
                </div>
                <p className="text-white">{submission.country || 'N/A'}</p>
              </div>
              <div className="p-3 rounded-lg bg-dark-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <Smartphone className="w-4 h-4 text-white/40" />
                  <span className="text-xs text-white/50">Device</span>
                </div>
                <p className="text-white capitalize">{submission.deviceType || 'N/A'}</p>
              </div>
              <div className="p-3 rounded-lg bg-dark-700/50">
                <span className="text-xs text-white/50">IP Address</span>
                <p className="text-white font-mono text-sm">{submission.ip || 'N/A'}</p>
              </div>
              {submission.utmSource && (
                <div className="p-3 rounded-lg bg-dark-700/50">
                  <span className="text-xs text-white/50">UTM Source</span>
                  <p className="text-white">{submission.utmSource}</p>
                </div>
              )}
              {submission.utmMedium && (
                <div className="p-3 rounded-lg bg-dark-700/50">
                  <span className="text-xs text-white/50">UTM Medium</span>
                  <p className="text-white">{submission.utmMedium}</p>
                </div>
              )}
              {submission.utmCampaign && (
                <div className="p-3 rounded-lg bg-dark-700/50">
                  <span className="text-xs text-white/50">UTM Campaign</span>
                  <p className="text-white">{submission.utmCampaign}</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Lead Info */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Lead Management</h3>

            {/* Status */}
            <div className="mb-4">
              <label className="text-sm text-white/50 mb-2 block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-card text-white focus:outline-none focus-glow"
              >
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="text-sm text-white/50 mb-2 block">
                <Mail className="w-4 h-4 inline mr-1" />
                Lead Email
              </label>
              <input
                type="email"
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-4 py-3 rounded-xl glass-card text-white placeholder:text-white/40 focus:outline-none focus-glow"
              />
            </div>

            {/* Phone */}
            <div className="mb-4">
              <label className="text-sm text-white/50 mb-2 block">
                <Phone className="w-4 h-4 inline mr-1" />
                Lead Phone
              </label>
              <input
                type="tel"
                value={leadPhone}
                onChange={(e) => setLeadPhone(e.target.value)}
                placeholder="+1 234 567 8900"
                className="w-full px-4 py-3 rounded-xl glass-card text-white placeholder:text-white/40 focus:outline-none focus-glow"
              />
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="text-sm text-white/50 mb-2 block">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this lead..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl glass-card text-white placeholder:text-white/40 focus:outline-none focus-glow resize-none"
              />
            </div>

            <Button
              onClick={handleSave}
              isLoading={isSaving}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </GlassCard>

          {/* Actions */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
            <div className="space-y-3">
              <Button
                variant="secondary"
                onClick={() => setStatus('CONTACTED')}
                className="w-full justify-start"
                disabled={status === 'CONTACTED'}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Contacted
              </Button>
              {submission.sheetRowId && (
                <Button
                  variant="secondary"
                  onClick={() => {/* Open Google Sheet */}}
                  className="w-full justify-start"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in Google Sheets
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={handleDelete}
                className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Soft Delete
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

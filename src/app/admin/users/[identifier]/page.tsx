'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Zap,
  AlertTriangle,
  Clock,
  DollarSign,
  Globe,
  Smartphone,
  Wifi,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';

interface UserData {
  identifier: string;
  displayName: string | null;
  totalSubmissions: number;
  firstSubmission: string;
  lastSubmission: string;
  avgChaosScore: number;
  latestRiskLevel: string;
  latestChaosScore: number;
  riskDistribution: Record<string, number>;
}

interface Submission {
  id: string;
  createdAt: string;
  chaosScore: number;
  riskLevel: string;
  estimatedHoursLostMonthly: number;
  estimatedLeakageMin: number;
  estimatedLeakageMax: number;
  status: string;
  deviceType: string | null;
  country: string | null;
  ip: string | null;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
  q6: string;
  q7: string;
  q8: string;
  q9: string | null;
}

// Question labels for display
const questionLabels: Record<string, string> = {
  q1: 'How many places do you check to understand your business?',
  q2: 'Time to reach a reliable financial number?',
  q3: 'Hours spent "collecting a picture" instead of managing?',
  q4: 'Time to understand where an operational issue originated?',
  q5: 'People involved in non-revenue producing operations?',
  q6: 'Impact when an employee leaves or is absent?',
  q7: 'Times per month handling small operational issues?',
  q8: 'What slows down your business growth the most?',
  q9: 'Which systems do you currently use?',
};

// Answer labels for q1-q8
const answerLabels: Record<string, Record<string, string>> = {
  q1: {
    '1-2': '1–2 places',
    '3-5': '3–5 places',
    '6-9': '6–9 places',
    '10+': '10+ places',
  },
  q2: {
    'less-than-5': 'Less than 5 minutes',
    'up-to-30': 'Up to 30 minutes',
    'more-than-30': 'More than 30 minutes',
    'no-trust': "I don't have a number I trust",
  },
  q3: {
    'less-than-2': 'Less than 2 hours',
    '2-5': '2–5 hours',
    '5-10': '5–10 hours',
    '10+': '10+ hours',
  },
  q4: {
    immediately: 'Immediately',
    'few-hours': 'Within a few hours',
    '1-2-days': '1–2 days',
    'after-damage': 'Only after damage occurred',
  },
  q5: {
    '0': '0 people',
    '1-2': '1–2 people',
    '3-5': '3–5 people',
    '6+': '6+ people',
  },
  q6: {
    'almost-not': 'Almost not at all',
    'a-little': 'A little',
    'very-much': 'Very much',
    paralyzes: 'Paralyzes activity',
  },
  q7: {
    'almost-never': 'Almost never',
    '1-3': '1–3 times',
    '4-10': '4–10 times',
    'every-day': 'Almost every day',
  },
  q8: {
    'operational-disorder': 'Operational disorder',
    'people-dependence': 'Over-dependence on people',
    'management-overload': 'Daily management overload',
    'time-waste': 'Time wasted on non-profitable tasks',
    'no-control': 'No real-time control',
    combination: 'Combination of several',
  },
};

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'LOW':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'MEDIUM':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'HIGH':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'CRITICAL':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const getRiskBgColor = (risk: string) => {
  switch (risk) {
    case 'LOW':
      return 'bg-green-500';
    case 'MEDIUM':
      return 'bg-yellow-500';
    case 'HIGH':
      return 'bg-orange-500';
    case 'CRITICAL':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const isEmail = (identifier: string) => identifier.includes('@');

interface PageParams {
  identifier: string;
}

export default function UserProfilePage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { identifier } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/users/${encodeURIComponent(identifier)}`);
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setSubmissions(data.submissions || []);
        } else if (response.status === 404) {
          router.push('/admin/users');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [identifier, router]);

  const getAnswerLabel = (questionId: string, value: string | null) => {
    if (!value) return '—';
    if (questionId === 'q9') return value; // Open-ended question
    return answerLabels[questionId]?.[value] || value;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-white/50">User not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/admin/users')}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Users
      </Button>

      {/* User Header */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-accent-primary/20 flex items-center justify-center">
            {isEmail(user.identifier) ? (
              <Mail className="w-8 h-8 text-accent-primary" />
            ) : (
              <Phone className="w-8 h-8 text-accent-primary" />
            )}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">
              {user.displayName || user.identifier}
            </h1>
            {user.displayName && (
              <p className="text-white/50 mt-1">{user.identifier}</p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{user.totalSubmissions}</p>
              <p className="text-white/50 text-sm">Submissions</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{user.avgChaosScore}</p>
              <p className="text-white/50 text-sm">Avg Score</p>
            </div>
            <div className="text-center">
              <span
                className={cn(
                  'inline-block px-4 py-2 rounded-lg text-lg font-semibold border',
                  getRiskColor(user.latestRiskLevel)
                )}
              >
                {user.latestRiskLevel}
              </span>
              <p className="text-white/50 text-sm mt-1">Latest Risk</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2 text-white/70">
            <Calendar className="w-4 h-4" />
            <span>First: {new Date(user.firstSubmission).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-white/70">
            <Calendar className="w-4 h-4" />
            <span>Last: {new Date(user.lastSubmission).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Risk Distribution */}
        {Object.keys(user.riskDistribution).length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-white/70 text-sm mb-3">Risk Distribution</p>
            <div className="flex gap-2 flex-wrap">
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((risk) => {
                const count = user.riskDistribution[risk] || 0;
                if (count === 0) return null;
                return (
                  <div
                    key={risk}
                    className={cn(
                      'px-3 py-1 rounded-lg text-sm font-medium border flex items-center gap-2',
                      getRiskColor(risk)
                    )}
                  >
                    <span>{risk}</span>
                    <span className="opacity-70">×{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </GlassCard>

      {/* Submissions Table */}
      <GlassCard className="overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">All Submissions</h2>
        </div>

        <div className="divide-y divide-white/5">
          {submissions.map((submission) => (
            <div key={submission.id}>
              {/* Submission Row */}
              <div
                onClick={() =>
                  setExpandedSubmission(
                    expandedSubmission === submission.id ? null : submission.id
                  )
                }
                className="p-4 hover:bg-white/5 cursor-pointer transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Date & Time */}
                  <div className="flex items-center gap-3 min-w-[180px]">
                    <Calendar className="w-4 h-4 text-white/50" />
                    <div>
                      <p className="text-white">
                        {new Date(submission.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-white/50 text-sm">
                        {new Date(submission.createdAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Chaos Score */}
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-white font-semibold">{submission.chaosScore}</span>
                  </div>

                  {/* Risk Level */}
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium border w-fit',
                      getRiskColor(submission.riskLevel)
                    )}
                  >
                    {submission.riskLevel}
                  </span>

                  {/* Device & Country */}
                  <div className="hidden md:flex items-center gap-4 text-white/50 text-sm">
                    {submission.deviceType && (
                      <div className="flex items-center gap-1">
                        <Smartphone className="w-4 h-4" />
                        <span className="capitalize">{submission.deviceType}</span>
                      </div>
                    )}
                    {submission.country && (
                      <div className="flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        <span>{submission.country}</span>
                      </div>
                    )}
                  </div>

                  {/* Expand Icon */}
                  <div className="ml-auto">
                    {expandedSubmission === submission.id ? (
                      <ChevronUp className="w-5 h-5 text-white/50" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/50" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedSubmission === submission.id && (
                <div className="px-4 pb-4 bg-dark-700/30">
                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pt-4">
                    <div className="p-3 rounded-lg bg-dark-700/50">
                      <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                        <Clock className="w-4 h-4" />
                        Hours Lost/Month
                      </div>
                      <p className="text-white font-semibold">
                        {submission.estimatedHoursLostMonthly}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-dark-700/50">
                      <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                        <DollarSign className="w-4 h-4" />
                        Money Leakage
                      </div>
                      <p className="text-white font-semibold">
                        ${submission.estimatedLeakageMin.toLocaleString()} - $
                        {submission.estimatedLeakageMax.toLocaleString()}
                      </p>
                    </div>
                    {submission.ip && (
                      <div className="p-3 rounded-lg bg-dark-700/50">
                        <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                          <Wifi className="w-4 h-4" />
                          IP Address
                        </div>
                        <p className="text-white font-semibold font-mono text-sm">
                          {submission.ip}
                        </p>
                      </div>
                    )}
                    <div className="p-3 rounded-lg bg-dark-700/50">
                      <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                        <AlertTriangle className="w-4 h-4" />
                        Status
                      </div>
                      <p className="text-white font-semibold">{submission.status}</p>
                    </div>
                  </div>

                  {/* Q&A Section */}
                  <div className="space-y-3">
                    <h4 className="text-white font-semibold mb-4">Questionnaire Answers</h4>
                    {(['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9'] as const).map(
                      (qId) => {
                        const value = submission[qId];
                        return (
                          <div
                            key={qId}
                            className="p-4 rounded-lg bg-dark-700/50 border border-white/5"
                          >
                            <p className="text-white/60 text-sm mb-2">
                              {questionLabels[qId]}
                            </p>
                            <p className="text-white font-medium">
                              {getAnswerLabel(qId, value)}
                            </p>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

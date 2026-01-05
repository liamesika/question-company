'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KPICard } from '@/components/admin/KPICard';
import { DateRangePicker, DateRange, getDateRangeFilter } from '@/components/admin/DateRangePicker';
import { GlassCard } from '@/components/ui';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
  Target,
  Zap,
  Calendar,
  Bell,
} from 'lucide-react';

interface OverviewData {
  kpis: {
    totalSubmissions: number;
    submissions7d: number;
    submissions30d: number;
    avgChaosScore: number;
    highCriticalPercentage: number;
    mostCommonBlocker: string;
    attentionNeeded: number;
  };
  distributions: {
    riskLevel: { name: string; value: number }[];
    q8: { name: string; value: number }[];
    status: { name: string; value: number }[];
  };
}

const blockerLabels: Record<string, string> = {
  'operational-disorder': 'Operational Disorder',
  'people-dependence': 'People Dependence',
  'management-overload': 'Management Overload',
  'time-waste': 'Time Waste',
  'no-control': 'No Real-time Control',
  'combination': 'Combination',
};

export default function AdminOverviewPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const range = getDateRangeFilter(dateRange);
      const params = new URLSearchParams();
      if (range) {
        params.set('startDate', range.start.toISOString());
        params.set('endDate', range.end.toISOString());
      }

      const response = await fetch(`/api/admin/analytics/overview?${params}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching overview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'bg-green-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'HIGH': return 'bg-orange-500';
      case 'CRITICAL': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-white/50 mt-1">Monitor your diagnostic funnel performance</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Submissions"
          value={data?.kpis.totalSubmissions || 0}
          subtitle="All time"
          icon={Users}
          color="default"
          isLoading={isLoading}
          onClick={() => router.push('/admin/submissions')}
        />
        <KPICard
          title="Last 7 Days"
          value={data?.kpis.submissions7d || 0}
          subtitle="New submissions"
          icon={Calendar}
          color="info"
          isLoading={isLoading}
          onClick={() => router.push('/admin/submissions?dateRange=7d')}
        />
        <KPICard
          title="Avg Chaos Score"
          value={data?.kpis.avgChaosScore || 0}
          subtitle="Out of 100"
          icon={Zap}
          color={
            (data?.kpis.avgChaosScore || 0) > 60
              ? 'danger'
              : (data?.kpis.avgChaosScore || 0) > 40
                ? 'warning'
                : 'success'
          }
          isLoading={isLoading}
        />
        <KPICard
          title="High/Critical Risk"
          value={`${data?.kpis.highCriticalPercentage || 0}%`}
          subtitle="Of all submissions"
          icon={AlertTriangle}
          color="danger"
          isLoading={isLoading}
          onClick={() => router.push('/admin/submissions?riskLevel=HIGH,CRITICAL')}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          title="Last 30 Days"
          value={data?.kpis.submissions30d || 0}
          subtitle="Submissions"
          icon={TrendingUp}
          color="info"
          isLoading={isLoading}
        />
        <KPICard
          title="Most Common Blocker"
          value={blockerLabels[data?.kpis.mostCommonBlocker || ''] || data?.kpis.mostCommonBlocker || 'N/A'}
          subtitle="Growth blocker (Q8)"
          icon={Target}
          color="warning"
          isLoading={isLoading}
        />
        <KPICard
          title="Needs Attention"
          value={data?.kpis.attentionNeeded || 0}
          subtitle="NEW + HIGH/CRITICAL"
          icon={Bell}
          color="danger"
          isLoading={isLoading}
          onClick={() => router.push('/admin/submissions?status=NEW&riskLevel=HIGH,CRITICAL')}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Risk Level Distribution</h3>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="space-y-3">
              {data?.distributions.riskLevel.map((item) => {
                const total = data.distributions.riskLevel.reduce((sum, i) => sum + i.value, 0);
                const percentage = total > 0 ? (item.value / total) * 100 : 0;
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">{item.name}</span>
                      <span className="text-white">{item.value} ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getRiskColor(item.name)} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        {/* Lead Status Funnel */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Lead Status Funnel</h3>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="space-y-3">
              {data?.distributions.status.map((item) => {
                const total = data.distributions.status.reduce((sum, i) => sum + i.value, 0);
                const percentage = total > 0 ? (item.value / total) * 100 : 0;
                const statusColors: Record<string, string> = {
                  NEW: 'bg-blue-500',
                  CONTACTED: 'bg-yellow-500',
                  QUALIFIED: 'bg-green-500',
                  DISQUALIFIED: 'bg-red-500',
                  CLOSED: 'bg-purple-500',
                };
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">{item.name}</span>
                      <span className="text-white">{item.value} ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${statusColors[item.name] || 'bg-gray-500'} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Growth Blockers */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Top Growth Blockers (Q8)</h3>
        {isLoading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {data?.distributions.q8.map((item) => (
              <div
                key={item.name}
                className="p-4 rounded-xl bg-dark-700/50 text-center"
              >
                <p className="text-2xl font-bold text-white mb-1">{item.value}</p>
                <p className="text-xs text-white/50 line-clamp-2">
                  {blockerLabels[item.name] || item.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

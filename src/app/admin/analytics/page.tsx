'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui';
import { DateRangePicker, DateRange, getDateRangeFilter } from '@/components/admin/DateRangePicker';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';

interface ChartData {
  submissionsOverTime: { date: string; submissions: number; avgScore: number }[];
  scoreHistogram: { range: string; count: number }[];
  funnel: { stage: string; count: number }[];
  insights: { pattern: string; percentage: number; description: string }[];
}

interface OverviewData {
  distributions: {
    riskLevel: { name: string; value: number }[];
    q8: { name: string; value: number }[];
    device: { name: string; value: number }[];
  };
}

const COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  success: '#22c55e',
  warning: '#eab308',
  danger: '#ef4444',
  orange: '#f97316',
};

const RISK_COLORS: Record<string, string> = {
  LOW: COLORS.success,
  MEDIUM: COLORS.warning,
  HIGH: COLORS.orange,
  CRITICAL: COLORS.danger,
};

const DEVICE_COLORS = [COLORS.primary, COLORS.secondary, COLORS.success];

const q8Labels: Record<string, string> = {
  'operational-disorder': 'Op. Disorder',
  'people-dependence': 'People Dep.',
  'management-overload': 'Mgmt Overload',
  'time-waste': 'Time Waste',
  'no-control': 'No Control',
  'combination': 'Combination',
};

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  // Safe defaults for when API fails
  const defaultChartData: ChartData = {
    submissionsOverTime: [],
    scoreHistogram: [],
    funnel: [],
    insights: [],
  };

  const defaultOverviewData: OverviewData = {
    distributions: {
      riskLevel: [],
      q8: [],
      device: [],
    },
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const range = getDateRangeFilter(dateRange);
      const params = new URLSearchParams();
      if (range) {
        params.set('startDate', range.start.toISOString());
        params.set('endDate', range.end.toISOString());
      }

      const [chartsRes, overviewRes] = await Promise.all([
        fetch(`/api/admin/analytics/charts?${params}`),
        fetch(`/api/admin/analytics/overview?${params}`),
      ]);

      // Handle non-200 responses gracefully
      const charts = chartsRes.ok ? await chartsRes.json() : defaultChartData;
      const overview = overviewRes.ok ? await overviewRes.json() : defaultOverviewData;

      setChartData(charts);
      setOverviewData(overview);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set safe defaults on error
      setChartData(defaultChartData);
      setOverviewData(defaultOverviewData);
    } finally {
      setIsLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 rounded-lg border border-white/10">
          <p className="text-white text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <GlassCard key={i} className="p-6 h-80">
              <div className="animate-pulse h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-white/50 mt-1">Visualize your diagnostic funnel performance</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Submissions Over Time */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Submissions Over Time</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData?.submissionsOverTime || []}>
              <defs>
                <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.5)"
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="submissions"
                stroke={COLORS.primary}
                fill="url(#colorSubmissions)"
                strokeWidth={2}
                name="Submissions"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Level Distribution */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Risk Level Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={overviewData?.distributions?.riskLevel ?? []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {(overviewData?.distributions?.riskLevel ?? []).map((entry) => (
                    <Cell key={entry.name} fill={RISK_COLORS[entry.name] || COLORS.primary} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => <span className="text-white/70 text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Chaos Score Histogram */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Chaos Score Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData?.scoreHistogram || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="range" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Growth Blocker Breakdown */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Growth Blockers (Q8)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(overviewData?.distributions?.q8 ?? []).map(d => ({
                  ...d,
                  name: q8Labels[d.name] || d.name,
                }))}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="rgba(255,255,255,0.5)"
                  fontSize={11}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill={COLORS.secondary} radius={[0, 4, 4, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Device Breakdown */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Device Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={(overviewData?.distributions?.device ?? []).map(d => ({
                    ...d,
                    name: d.name ? d.name.charAt(0).toUpperCase() + d.name.slice(1) : 'Unknown',
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {(overviewData?.distributions?.device ?? []).map((_, index) => (
                    <Cell key={index} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => <span className="text-white/70 text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Average Score Over Time */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Average Chaos Score Over Time</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData?.submissionsOverTime || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.5)"
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="avgScore"
                stroke={COLORS.warning}
                strokeWidth={2}
                dot={{ fill: COLORS.warning, strokeWidth: 0, r: 4 }}
                name="Avg Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Funnel View */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Lead Status Funnel</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData?.funnel || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="stage" stroke="rgba(255,255,255,0.5)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="Leads">
                {(chartData?.funnel || []).map((_, index) => (
                  <Cell
                    key={index}
                    fill={[COLORS.primary, COLORS.warning, COLORS.success, COLORS.secondary][index]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Correlation Insights */}
      {chartData?.insights && chartData.insights.length > 0 && (
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Correlation Insights</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {chartData.insights.map((insight, index) => (
              <div key={index} className="p-4 rounded-xl bg-dark-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span className="text-2xl font-bold text-white">{insight.percentage}%</span>
                </div>
                <p className="text-sm text-white/70 mb-1">{insight.pattern}</p>
                <p className="text-xs text-white/50">{insight.description}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

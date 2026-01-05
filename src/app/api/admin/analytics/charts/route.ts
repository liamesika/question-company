import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month

    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    } : {};

    const baseWhere = { deletedAt: null, ...dateFilter };

    // Get submissions for time series
    const submissions = await prisma.diagnosticSubmission.findMany({
      where: baseWhere,
      select: {
        createdAt: true,
        chaosScore: true,
        riskLevel: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group submissions by time period
    const timeSeriesMap = new Map<string, { count: number; totalScore: number }>();

    submissions.forEach((s) => {
      const date = new Date(s.createdAt);
      let key: string;

      if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = date.toISOString().split('T')[0];
      }

      const existing = timeSeriesMap.get(key) || { count: 0, totalScore: 0 };
      timeSeriesMap.set(key, {
        count: existing.count + 1,
        totalScore: existing.totalScore + s.chaosScore,
      });
    });

    const submissionsOverTime = Array.from(timeSeriesMap.entries())
      .map(([date, data]) => ({
        date,
        submissions: data.count,
        avgScore: Math.round(data.totalScore / data.count),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Chaos score histogram
    const scoreBins = [
      { range: '0-20', min: 0, max: 20, count: 0 },
      { range: '21-40', min: 21, max: 40, count: 0 },
      { range: '41-60', min: 41, max: 60, count: 0 },
      { range: '61-80', min: 61, max: 80, count: 0 },
      { range: '81-100', min: 81, max: 100, count: 0 },
    ];

    submissions.forEach((s) => {
      const bin = scoreBins.find((b) => s.chaosScore >= b.min && s.chaosScore <= b.max);
      if (bin) bin.count++;
    });

    const scoreHistogram = scoreBins.map((b) => ({
      range: b.range,
      count: b.count,
    }));

    // Funnel data
    const funnelData = await Promise.all([
      prisma.diagnosticSubmission.count({ where: { ...baseWhere, status: 'NEW' } }),
      prisma.diagnosticSubmission.count({ where: { ...baseWhere, status: 'CONTACTED' } }),
      prisma.diagnosticSubmission.count({ where: { ...baseWhere, status: 'QUALIFIED' } }),
      prisma.diagnosticSubmission.count({ where: { ...baseWhere, status: 'CLOSED' } }),
    ]);

    const funnel = [
      { stage: 'New', count: funnelData[0] },
      { stage: 'Contacted', count: funnelData[1] },
      { stage: 'Qualified', count: funnelData[2] },
      { stage: 'Closed', count: funnelData[3] },
    ];

    // Correlation insights (computed patterns)
    const insights = await computeInsights(baseWhere);

    return NextResponse.json({
      submissionsOverTime,
      scoreHistogram,
      funnel,
      insights,
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}

async function computeInsights(baseWhere: object) {
  const insights: { pattern: string; percentage: number; description: string }[] = [];

  // Pattern 1: 10+ systems + no trusted number → tends to CRITICAL
  const pattern1Total = await prisma.diagnosticSubmission.count({
    where: { ...baseWhere, q1: '10+', q2: 'no-trust' },
  });
  const pattern1Critical = await prisma.diagnosticSubmission.count({
    where: { ...baseWhere, q1: '10+', q2: 'no-trust', riskLevel: 'CRITICAL' },
  });
  if (pattern1Total > 0) {
    insights.push({
      pattern: '10+ data sources + no trusted financial number',
      percentage: Math.round((pattern1Critical / pattern1Total) * 100),
      description: 'correlates with CRITICAL risk level',
    });
  }

  // Pattern 2: Employee absence paralyzes activity
  const pattern2Total = await prisma.diagnosticSubmission.count({
    where: { ...baseWhere, q6: 'paralyzes' },
  });
  const pattern2High = await prisma.diagnosticSubmission.count({
    where: { ...baseWhere, q6: 'paralyzes', riskLevel: { in: ['HIGH', 'CRITICAL'] } },
  });
  if (pattern2Total > 0) {
    insights.push({
      pattern: 'Employee absence paralyzes activity',
      percentage: Math.round((pattern2High / pattern2Total) * 100),
      description: 'correlates with HIGH/CRITICAL risk',
    });
  }

  // Pattern 3: Daily operational issues
  const pattern3Total = await prisma.diagnosticSubmission.count({
    where: { ...baseWhere, q7: 'every-day' },
  });
  const pattern3High = await prisma.diagnosticSubmission.count({
    where: { ...baseWhere, q7: 'every-day', chaosScore: { gte: 60 } },
  });
  if (pattern3Total > 0) {
    insights.push({
      pattern: 'Daily operational issues for founder',
      percentage: Math.round((pattern3High / pattern3Total) * 100),
      description: 'correlates with chaos score 60+',
    });
  }

  return insights.slice(0, 3);
}

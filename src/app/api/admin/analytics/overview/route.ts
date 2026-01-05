import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    } : {};

    const baseWhere = { deletedAt: null, ...dateFilter };

    // Get all KPIs in parallel
    const [
      totalSubmissions,
      submissions7d,
      submissions30d,
      avgChaosScore,
      riskDistribution,
      q8Distribution,
      q2Distribution,
      attentionNeeded,
      deviceDistribution,
      statusDistribution,
    ] = await Promise.all([
      // Total submissions
      prisma.diagnosticSubmission.count({ where: baseWhere }),

      // Last 7 days
      prisma.diagnosticSubmission.count({
        where: {
          ...baseWhere,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Last 30 days
      prisma.diagnosticSubmission.count({
        where: {
          ...baseWhere,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Average chaos score
      prisma.diagnosticSubmission.aggregate({
        where: baseWhere,
        _avg: { chaosScore: true },
      }),

      // Risk level distribution
      prisma.diagnosticSubmission.groupBy({
        by: ['riskLevel'],
        where: baseWhere,
        _count: { riskLevel: true },
      }),

      // Q8 distribution (most common growth blocker)
      prisma.diagnosticSubmission.groupBy({
        by: ['q8'],
        where: baseWhere,
        _count: { q8: true },
        orderBy: { _count: { q8: 'desc' } },
        take: 6,
      }),

      // Q2 distribution (time to reliable number)
      prisma.diagnosticSubmission.groupBy({
        by: ['q2'],
        where: baseWhere,
        _count: { q2: true },
      }),

      // Leads needing attention (NEW status with HIGH/CRITICAL)
      prisma.diagnosticSubmission.count({
        where: {
          ...baseWhere,
          status: 'NEW',
          riskLevel: { in: ['HIGH', 'CRITICAL'] },
        },
      }),

      // Device distribution
      prisma.diagnosticSubmission.groupBy({
        by: ['deviceType'],
        where: baseWhere,
        _count: { deviceType: true },
      }),

      // Status distribution
      prisma.diagnosticSubmission.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { status: true },
      }),
    ]);

    // Calculate HIGH + CRITICAL percentage
    const highCriticalCount = riskDistribution
      .filter(r => r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL')
      .reduce((sum, r) => sum + r._count.riskLevel, 0);
    const highCriticalPercentage = totalSubmissions > 0
      ? Math.round((highCriticalCount / totalSubmissions) * 100)
      : 0;

    // Most common growth blocker
    const mostCommonBlocker = q8Distribution[0]?.q8 || 'N/A';

    return NextResponse.json({
      kpis: {
        totalSubmissions,
        submissions7d,
        submissions30d,
        avgChaosScore: Math.round(avgChaosScore._avg.chaosScore || 0),
        highCriticalPercentage,
        mostCommonBlocker,
        attentionNeeded,
      },
      distributions: {
        riskLevel: riskDistribution.map(r => ({
          name: r.riskLevel,
          value: r._count.riskLevel,
        })),
        q8: q8Distribution.map(q => ({
          name: q.q8,
          value: q._count.q8,
        })),
        q2: q2Distribution.map(q => ({
          name: q.q2,
          value: q._count.q2,
        })),
        device: deviceDistribution.map(d => ({
          name: d.deviceType || 'unknown',
          value: d._count.deviceType,
        })),
        status: statusDistribution.map(s => ({
          name: s.status,
          value: s._count.status,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

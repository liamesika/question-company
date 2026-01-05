import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';
    const ids = searchParams.get('ids')?.split(',').filter(Boolean);
    const riskLevel = searchParams.get('riskLevel');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: Prisma.DiagnosticSubmissionWhereInput = {
      deletedAt: null,
    };

    if (ids && ids.length > 0) {
      where.id = { in: ids };
    }

    if (riskLevel) {
      where.riskLevel = { in: riskLevel.split(',') as any };
    }

    if (status) {
      where.status = { in: status.split(',') as any };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const submissions = await prisma.diagnosticSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'json') {
      return new NextResponse(JSON.stringify(submissions, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="submissions-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }

    // CSV format
    const headers = [
      'ID',
      'Created At',
      'Source',
      'IP',
      'Country',
      'Device Type',
      'UTM Source',
      'UTM Medium',
      'UTM Campaign',
      'Q1',
      'Q2',
      'Q3',
      'Q4',
      'Q5',
      'Q6',
      'Q7',
      'Q8',
      'Q9',
      'Chaos Score',
      'Risk Level',
      'Hours Lost Monthly',
      'Leakage Min',
      'Leakage Max',
      'Lead Email',
      'Lead Phone',
      'Notes',
      'Status',
    ];

    const escapeCSV = (value: unknown): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = submissions.map((s) => [
      s.id,
      s.createdAt.toISOString(),
      s.source,
      s.ip,
      s.country,
      s.deviceType,
      s.utmSource,
      s.utmMedium,
      s.utmCampaign,
      s.q1,
      s.q2,
      s.q3,
      s.q4,
      s.q5,
      s.q6,
      s.q7,
      s.q8,
      s.q9,
      s.chaosScore,
      s.riskLevel,
      s.estimatedHoursLostMonthly,
      s.estimatedLeakageMin,
      s.estimatedLeakageMax,
      s.leadEmail,
      s.leadPhone,
      s.notes,
      s.status,
    ].map(escapeCSV).join(','));

    // UTF-8 BOM for Hebrew support
    const BOM = '\uFEFF';
    const csv = BOM + [headers.join(','), ...rows].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="submissions-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

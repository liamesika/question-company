import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const search = searchParams.get('search') || '';
    const riskLevel = searchParams.get('riskLevel');
    const status = searchParams.get('status');
    const deviceType = searchParams.get('deviceType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const chaosScoreMin = searchParams.get('chaosScoreMin');
    const chaosScoreMax = searchParams.get('chaosScoreMax');
    const q8Filter = searchParams.get('q8');
    const country = searchParams.get('country');

    // Build where clause
    const where: Prisma.DiagnosticSubmissionWhereInput = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { q9: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { leadEmail: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (riskLevel) {
      where.riskLevel = riskLevel as any;
    }

    if (status) {
      where.status = status as any;
    }

    if (deviceType) {
      where.deviceType = deviceType as any;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (chaosScoreMin || chaosScoreMax) {
      where.chaosScore = {};
      if (chaosScoreMin) {
        where.chaosScore.gte = parseInt(chaosScoreMin);
      }
      if (chaosScoreMax) {
        where.chaosScore.lte = parseInt(chaosScoreMax);
      }
    }

    if (q8Filter) {
      where.q8 = q8Filter;
    }

    if (country) {
      where.country = country;
    }

    // Execute query
    const [submissions, total] = await Promise.all([
      prisma.diagnosticSubmission.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.diagnosticSubmission.count({ where }),
    ]);

    return NextResponse.json({
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    // Return safe defaults instead of 500 error to prevent UI crashes
    return NextResponse.json({
      submissions: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { ids, action, value } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
    }

    if (action === 'status' && value) {
      await prisma.diagnosticSubmission.updateMany({
        where: { id: { in: ids } },
        data: { status: value },
      });
    } else if (action === 'delete') {
      await prisma.diagnosticSubmission.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating submissions:', error);
    return NextResponse.json(
      { error: 'Failed to update submissions' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Safe defaults for when DB queries fail
const EMPTY_RESPONSE = {
  users: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'lastSubmission';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build search filter
    const searchFilter = search
      ? {
          OR: [
            { userIdentifier: { contains: search, mode: 'insensitive' as const } },
            { userDisplayName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // Get unique users with their stats using aggregation
    const usersWithStats = await prisma.diagnosticSubmission.groupBy({
      by: ['userIdentifier'],
      where: {
        deletedAt: null,
        userIdentifier: { not: '' },
        ...searchFilter,
      },
      _count: {
        id: true,
      },
      _max: {
        createdAt: true,
        chaosScore: true,
      },
    });

    // Get total count for pagination
    const totalUsers = usersWithStats.length;

    // Sort results
    const sortedUsers = [...usersWithStats].sort((a, b) => {
      if (sortBy === 'lastSubmission') {
        const dateA = a._max.createdAt?.getTime() || 0;
        const dateB = b._max.createdAt?.getTime() || 0;
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      }
      if (sortBy === 'totalSubmissions') {
        return sortOrder === 'desc' ? b._count.id - a._count.id : a._count.id - b._count.id;
      }
      if (sortBy === 'chaosScore') {
        const scoreA = a._max.chaosScore || 0;
        const scoreB = b._max.chaosScore || 0;
        return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      }
      if (sortBy === 'identifier') {
        return sortOrder === 'desc'
          ? b.userIdentifier.localeCompare(a.userIdentifier)
          : a.userIdentifier.localeCompare(b.userIdentifier);
      }
      return 0;
    });

    // Paginate
    const paginatedUsers = sortedUsers.slice((page - 1) * limit, page * limit);

    // Get latest submission details for each user (for risk level)
    const userIdentifiers = paginatedUsers.map(u => u.userIdentifier);

    const latestSubmissions = await prisma.diagnosticSubmission.findMany({
      where: {
        userIdentifier: { in: userIdentifiers },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['userIdentifier'],
      select: {
        userIdentifier: true,
        userDisplayName: true,
        riskLevel: true,
        chaosScore: true,
        createdAt: true,
      },
    });

    // Create a map for quick lookup
    const latestSubmissionMap = new Map(
      latestSubmissions.map(s => [s.userIdentifier, s])
    );

    // Build final user list with all stats
    const users = paginatedUsers.map(user => {
      const latest = latestSubmissionMap.get(user.userIdentifier);
      return {
        userIdentifier: user.userIdentifier,
        userDisplayName: latest?.userDisplayName || null,
        totalSubmissions: user._count.id,
        lastSubmissionDate: user._max.createdAt?.toISOString() || null,
        latestRiskLevel: latest?.riskLevel || null,
        latestChaosScore: latest?.chaosScore || null,
      };
    });

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(EMPTY_RESPONSE);
  }
}

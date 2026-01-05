import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ identifier: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { identifier } = await params;
    const decodedIdentifier = decodeURIComponent(identifier);

    // Get all submissions for this user
    const submissions = await prisma.diagnosticSubmission.findMany({
      where: {
        userIdentifier: decodedIdentifier,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (submissions.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user summary stats
    const latestSubmission = submissions[0];
    const totalSubmissions = submissions.length;

    // Calculate average chaos score
    const avgChaosScore = Math.round(
      submissions.reduce((sum, s) => sum + s.chaosScore, 0) / totalSubmissions
    );

    // Get risk level distribution
    const riskDistribution = submissions.reduce((acc, s) => {
      acc[s.riskLevel] = (acc[s.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      user: {
        identifier: decodedIdentifier,
        displayName: latestSubmission.userDisplayName,
        totalSubmissions,
        firstSubmission: submissions[submissions.length - 1].createdAt.toISOString(),
        lastSubmission: latestSubmission.createdAt.toISOString(),
        avgChaosScore,
        latestRiskLevel: latestSubmission.riskLevel,
        latestChaosScore: latestSubmission.chaosScore,
        riskDistribution,
      },
      submissions: submissions.map(s => ({
        id: s.id,
        createdAt: s.createdAt.toISOString(),
        chaosScore: s.chaosScore,
        riskLevel: s.riskLevel,
        estimatedHoursLostMonthly: s.estimatedHoursLostMonthly,
        estimatedLeakageMin: s.estimatedLeakageMin,
        estimatedLeakageMax: s.estimatedLeakageMax,
        status: s.status,
        deviceType: s.deviceType,
        country: s.country,
        ip: s.ip,
        q1: s.q1,
        q2: s.q2,
        q3: s.q3,
        q4: s.q4,
        q5: s.q5,
        q6: s.q6,
        q7: s.q7,
        q8: s.q8,
        q9: s.q9,
      })),
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}

// Update user display name
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { identifier } = await params;
    const decodedIdentifier = decodeURIComponent(identifier);
    const body = await request.json();
    const { displayName } = body;

    // Update all submissions for this user with the display name
    await prisma.diagnosticSubmission.updateMany({
      where: {
        userIdentifier: decodedIdentifier,
      },
      data: {
        userDisplayName: displayName,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

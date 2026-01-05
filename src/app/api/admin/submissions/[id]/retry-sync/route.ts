import { NextRequest, NextResponse } from 'next/server';
import { appendRowToSheet, SheetRowData } from '@/lib/google-sheets';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';

const MAX_RETRY_ATTEMPTS = 5;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const submission = await prisma.diagnosticSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (submission.sheetSyncStatus === 'SUCCESS') {
      return NextResponse.json({ error: 'Submission already synced' }, { status: 400 });
    }

    if (submission.sheetSyncAttempts >= MAX_RETRY_ATTEMPTS) {
      return NextResponse.json({
        error: `Maximum retry attempts (${MAX_RETRY_ATTEMPTS}) exceeded`,
      }, { status: 400 });
    }

    // Prepare data for sheet
    const sheetData: SheetRowData = {
      timestamp: format(submission.createdAt, 'yyyy-MM-dd HH:mm:ss'),
      q1: submission.q1,
      q2: submission.q2,
      q3: submission.q3,
      q4: submission.q4,
      q5: submission.q5,
      q6: submission.q6,
      q7: submission.q7,
      q8: submission.q8,
      q9: submission.q9,
      chaosScore: submission.chaosScore,
      riskLevel: submission.riskLevel,
      ip: submission.ip,
      deviceType: submission.deviceType,
      country: submission.country,
      userAgent: submission.userAgent,
    };

    // Update attempt count before trying
    await prisma.diagnosticSubmission.update({
      where: { id },
      data: {
        sheetSyncAttempts: { increment: 1 },
        lastSheetSyncAt: new Date(),
      },
    });

    // Try to sync
    const success = await appendRowToSheet(sheetData);

    // Update status based on result
    await prisma.diagnosticSubmission.update({
      where: { id },
      data: {
        sheetSyncStatus: success ? 'SUCCESS' : 'FAILED',
        sheetSyncError: success ? null : 'Retry failed',
      },
    });

    if (success) {
      logger.sheetSync('success', id, { action: 'manual_retry' });
    } else {
      logger.sheetSync('retry', id, { status: 'failed' });
    }

    return NextResponse.json({
      success,
      message: success ? 'Sheet sync successful' : 'Sheet sync failed',
      attempts: submission.sheetSyncAttempts + 1,
    });
  } catch (error) {
    logger.error('Sheet sync retry error', { error: String(error) });
    return NextResponse.json(
      { error: 'Failed to retry sheet sync' },
      { status: 500 }
    );
  }
}

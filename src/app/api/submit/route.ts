import { NextRequest, NextResponse } from 'next/server';
import { DiagnosticAnswers } from '@/types/diagnostic';
import { calculateChaosScore, ChaosScoreResult } from '@/lib/chaos-calculator';
import { appendToSheet } from '@/lib/google-sheets';
import { sendCRMWebhook, sendWhatsAppNotification, sendEmailConfirmation } from '@/lib/webhooks';
import { formatTimestamp } from '@/lib/utils';
import prisma from '@/lib/prisma';

function parseHoursLost(range: string): number {
  // Parse ranges like "8-15", "20-40", "50-80", "100+"
  const match = range.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

function parseLeakage(range: string): { min: number; max: number } {
  // Parse ranges like "$2,000 - $5,000", "$75,000+"
  const numbers = range.match(/[\d,]+/g);
  if (!numbers) return { min: 0, max: 0 };

  const min = parseInt(numbers[0].replace(/,/g, ''));
  const max = numbers[1] ? parseInt(numbers[1].replace(/,/g, '')) : min * 2;

  return { min, max };
}

function mapDeviceType(deviceType: string): 'mobile' | 'desktop' | 'tablet' | null {
  const lower = deviceType.toLowerCase();
  if (lower === 'mobile') return 'mobile';
  if (lower === 'desktop') return 'desktop';
  if (lower === 'tablet') return 'tablet';
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { answers, clientInfo, utm } = body as {
      answers: DiagnosticAnswers;
      clientInfo: {
        ip: string;
        country: string;
        deviceType: string;
        userAgent: string;
      };
      utm?: {
        source?: string;
        medium?: string;
        campaign?: string;
        content?: string;
        term?: string;
      };
    };

    // Validate answers
    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Invalid answers provided' },
        { status: 400 }
      );
    }

    // Calculate chaos score
    const result = calculateChaosScore(answers);

    // Parse numeric values from result
    const hoursLost = parseHoursLost(result.hoursLostPerMonth);
    const leakage = parseLeakage(result.moneyLeakageRange);

    // Prepare submission data for Google Sheets
    const submissionData = {
      timestamp: formatTimestamp(),
      answers,
      chaosScore: result.score,
      riskLevel: result.riskLevel,
      ip: clientInfo?.ip || 'unknown',
      deviceType: clientInfo?.deviceType || 'unknown',
      country: clientInfo?.country || 'unknown',
      userAgent: clientInfo?.userAgent || 'unknown',
    };

    // Save to database first
    let dbSubmission;
    try {
      dbSubmission = await prisma.diagnosticSubmission.create({
        data: {
          source: 'effinity-diagnostic',
          ip: clientInfo?.ip || null,
          country: clientInfo?.country || null,
          deviceType: mapDeviceType(clientInfo?.deviceType || ''),
          userAgent: clientInfo?.userAgent || null,
          utmSource: utm?.source || null,
          utmMedium: utm?.medium || null,
          utmCampaign: utm?.campaign || null,
          utmContent: utm?.content || null,
          utmTerm: utm?.term || null,
          q1: answers.q1,
          q2: answers.q2,
          q3: answers.q3,
          q4: answers.q4,
          q5: answers.q5,
          q6: answers.q6,
          q7: answers.q7,
          q8: answers.q8,
          q9: answers.q9 || null,
          chaosScore: result.score,
          riskLevel: result.riskLevel as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
          estimatedHoursLostMonthly: hoursLost,
          estimatedLeakageMin: leakage.min,
          estimatedLeakageMax: leakage.max,
          status: 'NEW',
        },
      });
      console.log('Submission saved to database:', dbSubmission.id);
    } catch (dbError) {
      console.error('Database save error:', dbError);
      // Continue even if DB fails - we'll still save to sheets
    }

    // Run all async operations in parallel
    const [sheetResult, webhookResult, whatsappResult, emailResult] = await Promise.allSettled([
      appendToSheet(submissionData),
      sendCRMWebhook(submissionData),
      sendWhatsAppNotification(submissionData),
      sendEmailConfirmation(submissionData),
    ]);

    // Update DB with sheet row ID if available
    if (dbSubmission && sheetResult.status === 'fulfilled' && sheetResult.value) {
      try {
        await prisma.diagnosticSubmission.update({
          where: { id: dbSubmission.id },
          data: { sheetRowId: 'synced' },
        });
      } catch (updateError) {
        console.error('Failed to update sheet sync status:', updateError);
      }
    }

    // Log results for monitoring
    console.log('Submission processed:', {
      id: dbSubmission?.id,
      chaosScore: result.score,
      riskLevel: result.riskLevel,
      dbSaved: !!dbSubmission,
      sheetSaved: sheetResult.status === 'fulfilled' && sheetResult.value,
      webhookSent: webhookResult.status === 'fulfilled' && webhookResult.value,
      whatsappSent: whatsappResult.status === 'fulfilled' && whatsappResult.value,
      emailSent: emailResult.status === 'fulfilled' && emailResult.value,
    });

    return NextResponse.json({
      success: true,
      result,
      submissionId: dbSubmission?.id,
    });
  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process submission' },
      { status: 500 }
    );
  }
}

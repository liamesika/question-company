import { NextRequest, NextResponse } from 'next/server';
import { DiagnosticAnswers } from '@/types/diagnostic';
import { calculateChaosScore } from '@/lib/chaos-calculator';
import { sendCRMWebhook, sendWhatsAppNotification, sendEmailConfirmation } from '@/lib/webhooks';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

// PostgreSQL is the single source of truth - no Google Sheets sync

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

// Helper functions to reconstruct result data for duplicate submissions
function getHeadlineForRiskLevel(riskLevel: string): string {
  const headlines: Record<string, string> = {
    LOW: 'Your operations show early signs of friction.',
    MEDIUM: 'Your business is losing growth capacity silently.',
    HIGH: 'Your business is running on hidden manual chaos.',
    CRITICAL: 'Your operations are blocking your next scale stage.',
  };
  return headlines[riskLevel] || headlines.MEDIUM;
}

function getDescriptionForRiskLevel(riskLevel: string): string {
  const descriptions: Record<string, string> = {
    LOW: 'While your business runs reasonably well, small inefficiencies are compounding. Left unchecked, these micro-issues will become growth blockers within 6-12 months.',
    MEDIUM: 'Significant operational overhead is eating into your margins and time. Your team is spending more energy maintaining the status quo than driving growth.',
    HIGH: 'Critical operational gaps are forcing reactive management. Every day without systematic intervention increases the risk of costly errors and missed opportunities.',
    CRITICAL: 'Your business has outgrown its operational foundation. Scaling further without restructuring will multiply current problems exponentially.',
  };
  return descriptions[riskLevel] || descriptions.MEDIUM;
}

function getHoursLostForRiskLevel(riskLevel: string): string {
  const hours: Record<string, string> = {
    LOW: '8-15',
    MEDIUM: '20-40',
    HIGH: '50-80',
    CRITICAL: '100+',
  };
  return hours[riskLevel] || hours.MEDIUM;
}

function getLeakageForRiskLevel(riskLevel: string): string {
  const leakage: Record<string, string> = {
    LOW: '$2,000 - $5,000',
    MEDIUM: '$8,000 - $20,000',
    HIGH: '$25,000 - $60,000',
    CRITICAL: '$75,000+',
  };
  return leakage[riskLevel] || leakage.MEDIUM;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { answers, clientInfo, utm, clientSubmissionId } = body as {
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
      clientSubmissionId?: string;
    };

    // Validate answers
    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Invalid answers provided' },
        { status: 400 }
      );
    }

    // Validate contact field (required for user identification)
    if (!answers.contact || typeof answers.contact !== 'string' || answers.contact.trim() === '') {
      return NextResponse.json(
        { error: 'Contact (email or phone) is required' },
        { status: 400 }
      );
    }

    // Normalize the contact identifier (lowercase, trim)
    const userIdentifier = answers.contact.trim().toLowerCase();

    // Check for duplicate submission (idempotency)
    if (clientSubmissionId) {
      const existingSubmission = await prisma.diagnosticSubmission.findUnique({
        where: { clientSubmissionId },
      });

      if (existingSubmission) {
        logger.info('Duplicate submission detected, returning existing result', {
          clientSubmissionId,
          submissionId: existingSubmission.id,
        });

        // Return the existing submission result
        const existingResult = {
          score: existingSubmission.chaosScore,
          riskLevel: existingSubmission.riskLevel,
          headline: getHeadlineForRiskLevel(existingSubmission.riskLevel),
          description: getDescriptionForRiskLevel(existingSubmission.riskLevel),
          hoursLostPerMonth: getHoursLostForRiskLevel(existingSubmission.riskLevel),
          moneyLeakageRange: getLeakageForRiskLevel(existingSubmission.riskLevel),
        };

        return NextResponse.json({
          success: true,
          result: existingResult,
          submissionId: existingSubmission.id,
          duplicate: true,
        });
      }
    }

    // Calculate chaos score
    const result = calculateChaosScore(answers);

    // Parse numeric values from result
    const hoursLost = parseHoursLost(result.hoursLostPerMonth);
    const leakage = parseLeakage(result.moneyLeakageRange);

    // Save to PostgreSQL (single source of truth)
    let dbSubmission;
    try {
      dbSubmission = await prisma.diagnosticSubmission.create({
        data: {
          source: 'effinity-diagnostic',
          clientSubmissionId: clientSubmissionId || null,
          // User identity
          userIdentifier: userIdentifier,
          userDisplayName: null,
          // Client info
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
          sheetSyncStatus: 'DISABLED',
        },
      });
      logger.submission('created', dbSubmission.id, { chaosScore: result.score, riskLevel: result.riskLevel });
    } catch (dbError) {
      logger.error('Database save error', { error: String(dbError) });
      return NextResponse.json(
        { error: 'Failed to save submission' },
        { status: 500 }
      );
    }

    // Run optional webhook integrations (non-blocking)
    const submissionData = {
      timestamp: new Date().toISOString(),
      answers,
      chaosScore: result.score,
      riskLevel: result.riskLevel,
      ip: clientInfo?.ip || 'unknown',
      deviceType: clientInfo?.deviceType || 'unknown',
      country: clientInfo?.country || 'unknown',
      userAgent: clientInfo?.userAgent || 'unknown',
    };

    Promise.allSettled([
      sendCRMWebhook(submissionData),
      sendWhatsAppNotification(submissionData),
      sendEmailConfirmation(submissionData),
    ]).then(([webhookResult, whatsappResult, emailResult]) => {
      logger.info('Webhook integrations processed', {
        submissionId: dbSubmission.id,
        webhookSent: webhookResult.status === 'fulfilled' && webhookResult.value,
        whatsappSent: whatsappResult.status === 'fulfilled' && whatsappResult.value,
        emailSent: emailResult.status === 'fulfilled' && emailResult.value,
      });
    });

    // Log submission success
    logger.info('Submission saved to database', {
      submissionId: dbSubmission.id,
      chaosScore: result.score,
      riskLevel: result.riskLevel,
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

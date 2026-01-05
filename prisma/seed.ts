import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

function generateSecurePassword(length: number = 24): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const randomBytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  return password;
}

async function main() {
  // Create default admin user
  const adminEmail = process.env.ADMIN_EMAILS?.split(',')[0]?.trim() || 'admin@example.com';

  // Generate secure random password instead of using a hardcoded one
  const generatedPassword = generateSecurePassword(24);

  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email: adminEmail.toLowerCase() },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(generatedPassword, 12);

    await prisma.adminUser.create({
      data: {
        email: adminEmail.toLowerCase(),
        passwordHash,
        name: 'Admin',
        isActive: true,
        mustResetPassword: true, // Force password reset on first login
      },
    });

    console.log('');
    console.log('='.repeat(60));
    console.log('ADMIN USER CREATED');
    console.log('='.repeat(60));
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${generatedPassword}`);
    console.log('');
    console.log('IMPORTANT: Save this password now! It will not be shown again.');
    console.log('You will be required to change it on first login.');
    console.log('='.repeat(60));
    console.log('');
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  // Create sample submissions for testing (optional)
  const submissionCount = await prisma.diagnosticSubmission.count();

  if (submissionCount === 0) {
    console.log('Creating sample submissions...');

    const sampleSubmissions = [
      {
        source: 'effinity-diagnostic',
        ip: '192.168.1.1',
        country: 'United States',
        deviceType: 'desktop' as const,
        q1: '10+',
        q2: 'no-trust',
        q3: '10+',
        q4: 'after-damage',
        q5: '6+',
        q6: 'paralyzes',
        q7: 'every-day',
        q8: 'combination',
        q9: 'Excel, WhatsApp, Email, Paper notes',
        chaosScore: 85,
        riskLevel: 'CRITICAL' as const,
        estimatedHoursLostMonthly: 100,
        estimatedLeakageMin: 75000,
        estimatedLeakageMax: 150000,
        status: 'NEW' as const,
      },
      {
        source: 'effinity-diagnostic',
        ip: '192.168.1.2',
        country: 'Israel',
        deviceType: 'mobile' as const,
        q1: '6-9',
        q2: 'more-than-30',
        q3: '5-10',
        q4: '1-2-days',
        q5: '3-5',
        q6: 'very-much',
        q7: '4-10',
        q8: 'operational-disorder',
        q9: 'Monday.com, Slack, Google Sheets',
        chaosScore: 62,
        riskLevel: 'HIGH' as const,
        estimatedHoursLostMonthly: 50,
        estimatedLeakageMin: 25000,
        estimatedLeakageMax: 60000,
        status: 'CONTACTED' as const,
      },
      {
        source: 'effinity-diagnostic',
        ip: '192.168.1.3',
        country: 'United Kingdom',
        deviceType: 'desktop' as const,
        q1: '3-5',
        q2: 'up-to-30',
        q3: '2-5',
        q4: 'few-hours',
        q5: '1-2',
        q6: 'a-little',
        q7: '1-3',
        q8: 'people-dependence',
        q9: 'HubSpot, Notion, Slack',
        chaosScore: 38,
        riskLevel: 'MEDIUM' as const,
        estimatedHoursLostMonthly: 20,
        estimatedLeakageMin: 8000,
        estimatedLeakageMax: 20000,
        status: 'QUALIFIED' as const,
      },
      {
        source: 'effinity-diagnostic',
        ip: '192.168.1.4',
        country: 'Germany',
        deviceType: 'tablet' as const,
        q1: '1-2',
        q2: 'less-than-5',
        q3: 'less-than-2',
        q4: 'immediately',
        q5: '0',
        q6: 'almost-not',
        q7: 'almost-never',
        q8: 'time-waste',
        q9: 'SAP, Microsoft Teams',
        chaosScore: 15,
        riskLevel: 'LOW' as const,
        estimatedHoursLostMonthly: 8,
        estimatedLeakageMin: 2000,
        estimatedLeakageMax: 5000,
        status: 'CLOSED' as const,
      },
    ];

    for (const submission of sampleSubmissions) {
      await prisma.diagnosticSubmission.create({ data: submission });
    }

    console.log(`Created ${sampleSubmissions.length} sample submissions`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

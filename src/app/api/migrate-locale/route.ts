import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// One-time migration endpoint - DELETE AFTER USE
// Adds locale and localizedPayload columns to DiagnosticSubmission

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('x-migration-key');
  if (authHeader !== 'run-locale-migration-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Add locale column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "DiagnosticSubmission"
      ADD COLUMN IF NOT EXISTS "locale" TEXT NOT NULL DEFAULT 'en';
    `);

    // Add localizedPayload column (JSONB)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "DiagnosticSubmission"
      ADD COLUMN IF NOT EXISTS "localizedPayload" JSONB;
    `);

    // Add index on locale
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "DiagnosticSubmission_locale_idx"
      ON "DiagnosticSubmission" ("locale");
    `);

    // Verify columns exist
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'DiagnosticSubmission'
      AND column_name IN ('locale', 'localizedPayload')
      ORDER BY column_name;
    `;

    return NextResponse.json({
      success: true,
      message: 'Locale migration completed successfully',
      columns,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint with x-migration-key header to run locale migration'
  });
}

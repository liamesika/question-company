import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// One-time migration endpoint - DELETE AFTER USE
// This applies the missing columns to production DB

export async function POST(request: NextRequest) {
  // Simple auth - check for migration key
  const authHeader = request.headers.get('x-migration-key');
  if (authHeader !== 'run-migration-now-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Run raw SQL to add missing columns
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "DiagnosticSubmission"
      ADD COLUMN IF NOT EXISTS "userIdentifier" TEXT NOT NULL DEFAULT '';
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "DiagnosticSubmission"
      ADD COLUMN IF NOT EXISTS "userDisplayName" TEXT;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "DiagnosticSubmission_userIdentifier_idx"
      ON "DiagnosticSubmission" ("userIdentifier");
    `);

    // Verify columns exist
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'DiagnosticSubmission'
      AND column_name IN ('userIdentifier', 'userDisplayName')
      ORDER BY column_name;
    `;

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
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
    message: 'POST to this endpoint with x-migration-key header to run migration'
  });
}

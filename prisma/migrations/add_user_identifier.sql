-- Migration: Add userIdentifier and userDisplayName columns
-- Run this SQL in Supabase SQL Editor to fix production

-- Add userIdentifier column with default empty string (for existing rows)
ALTER TABLE "DiagnosticSubmission"
ADD COLUMN IF NOT EXISTS "userIdentifier" TEXT NOT NULL DEFAULT '';

-- Add userDisplayName column (nullable)
ALTER TABLE "DiagnosticSubmission"
ADD COLUMN IF NOT EXISTS "userDisplayName" TEXT;

-- Create index on userIdentifier for efficient lookups
CREATE INDEX IF NOT EXISTS "DiagnosticSubmission_userIdentifier_idx"
ON "DiagnosticSubmission"("userIdentifier");

-- Verify the columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'DiagnosticSubmission'
AND column_name IN ('userIdentifier', 'userDisplayName');

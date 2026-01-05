type EnvVar = {
  name: string;
  required: boolean;
  description: string;
  validate?: (value: string) => boolean;
};

const envSchema: EnvVar[] = [
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL connection string',
    validate: (v) => v.startsWith('postgres'),
  },
  {
    name: 'JWT_SECRET',
    required: true,
    description: 'Secret for JWT signing (min 32 chars)',
    validate: (v) => v.length >= 32,
  },
  {
    name: 'ADMIN_EMAILS',
    required: true,
    description: 'Comma-separated list of admin emails',
    validate: (v) => v.includes('@'),
  },
  // Google Sheets sync is disabled - PostgreSQL is the single source of truth
  // To re-enable, set SHEETS_SYNC_ENABLED=true and add:
  // GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY
  {
    name: 'REFRESH_SECRET',
    required: false,
    description: 'Secret for refresh token signing (defaults to JWT_SECRET)',
  },
  {
    name: 'NEXT_PUBLIC_APP_URL',
    required: false,
    description: 'Public URL of the application',
  },
];

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnv(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const envVar of envSchema) {
    const value = process.env[envVar.name];

    if (envVar.required && !value) {
      errors.push(`Missing required env var: ${envVar.name} - ${envVar.description}`);
      continue;
    }

    if (!envVar.required && !value) {
      warnings.push(`Optional env var not set: ${envVar.name} - ${envVar.description}`);
      continue;
    }

    if (value && envVar.validate && !envVar.validate(value)) {
      errors.push(`Invalid value for ${envVar.name}: ${envVar.description}`);
    }
  }

  // Check for development mode warnings
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      warnings.push('NEXT_PUBLIC_APP_URL not set in production');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function assertEnv(): void {
  const result = validateEnv();

  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Environment warnings:');
    result.warnings.forEach((w) => console.warn(`   - ${w}`));
  }

  if (!result.valid) {
    console.error('\n❌ Environment validation failed:');
    result.errors.forEach((e) => console.error(`   - ${e}`));
    throw new Error('Environment validation failed. Please check your .env file.');
  }
}

export function getEnvSummary(): Record<string, { set: boolean; valid: boolean }> {
  const summary: Record<string, { set: boolean; valid: boolean }> = {};

  for (const envVar of envSchema) {
    const value = process.env[envVar.name];
    const isSet = !!value;
    const isValid = !isSet || !envVar.validate || envVar.validate(value!);
    summary[envVar.name] = { set: isSet, valid: isValid };
  }

  return summary;
}

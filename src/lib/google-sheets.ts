import { google } from 'googleapis';
import { SubmissionData } from '@/types/diagnostic';
import { logger } from './logger';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function getGoogleAuth() {
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;

  if (!privateKey || !clientEmail) {
    throw new Error('Google Sheets credentials not configured');
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: SCOPES,
  });
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if it's a retryable error (rate limit, server error)
      const isRetryable = isRetryableError(error);

      if (!isRetryable || attempt === maxRetries) {
        logger.error(`${operationName} failed after ${attempt} attempt(s)`, {
          error: lastError.message,
          attempt,
          maxRetries,
        });
        throw lastError;
      }

      // Exponential backoff with jitter
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 1000;
      logger.warn(`${operationName} attempt ${attempt} failed, retrying in ${Math.round(delay)}ms`, {
        error: lastError.message,
      });
      await sleep(delay);
    }
  }

  throw lastError;
}

function isRetryableError(error: unknown): boolean {
  if (!error) return false;

  const message = error instanceof Error ? error.message : String(error);

  // Rate limit errors
  if (message.includes('429') || message.includes('RATE_LIMIT')) return true;

  // Server errors
  if (message.includes('500') || message.includes('502') || message.includes('503')) return true;

  // Network errors
  if (message.includes('ECONNRESET') || message.includes('ETIMEDOUT')) return true;

  return false;
}

export async function appendToSheet(data: SubmissionData): Promise<boolean> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!spreadsheetId) {
    logger.error('Spreadsheet ID not configured');
    return false;
  }

  try {
    await withRetry(async () => {
      const auth = getGoogleAuth();
      const sheets = google.sheets({ version: 'v4', auth });

      const row = [
        data.timestamp,
        data.answers.q1,
        data.answers.q2,
        data.answers.q3,
        data.answers.q4,
        data.answers.q5,
        data.answers.q6,
        data.answers.q7,
        data.answers.q8,
        data.answers.q9,
        data.chaosScore,
        data.riskLevel,
        data.ip,
        data.deviceType,
        data.country,
        data.userAgent,
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Sheet1!A:P',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [row],
        },
      });
    }, 'appendToSheet');

    return true;
  } catch (error) {
    logger.error('Error appending to sheet', { error: String(error) });
    return false;
  }
}

export interface SheetRowData {
  timestamp: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
  q6: string;
  q7: string;
  q8: string;
  q9: string | null;
  chaosScore: number;
  riskLevel: string;
  ip: string | null;
  deviceType: string | null;
  country: string | null;
  userAgent: string | null;
}

export async function appendRowToSheet(data: SheetRowData): Promise<boolean> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!spreadsheetId) {
    logger.error('Spreadsheet ID not configured');
    return false;
  }

  try {
    await withRetry(async () => {
      const auth = getGoogleAuth();
      const sheets = google.sheets({ version: 'v4', auth });

      const row = [
        data.timestamp,
        data.q1,
        data.q2,
        data.q3,
        data.q4,
        data.q5,
        data.q6,
        data.q7,
        data.q8,
        data.q9 || '',
        data.chaosScore,
        data.riskLevel,
        data.ip || '',
        data.deviceType || '',
        data.country || '',
        data.userAgent || '',
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Sheet1!A:P',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [row],
        },
      });
    }, 'appendRowToSheet');

    return true;
  } catch (error) {
    logger.error('Error appending row to sheet', { error: String(error) });
    return false;
  }
}

export async function initializeSheetHeaders(): Promise<boolean> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!spreadsheetId) {
    return false;
  }

  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const headers = [
      'Timestamp',
      'Q1 - Data Sources',
      'Q2 - Financial Visibility',
      'Q3 - Hours Collecting Picture',
      'Q4 - Issue Detection Time',
      'Q5 - Non-Revenue Operations',
      'Q6 - Employee Dependency',
      'Q7 - Founder Operational Load',
      'Q8 - Growth Blocker',
      'Q9 - Systems Used',
      'Chaos Score',
      'Risk Level',
      'IP Address',
      'Device Type',
      'Country',
      'User Agent',
    ];

    // Check if headers exist
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A1:P1',
    });

    if (!response.data.values || response.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Sheet1!A1:P1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [headers],
        },
      });
    }

    return true;
  } catch (error) {
    console.error('Error initializing headers:', error);
    return false;
  }
}

import { google } from 'googleapis';
import { SubmissionData } from '@/types/diagnostic';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

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

export async function appendToSheet(data: SubmissionData): Promise<boolean> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!spreadsheetId) {
    console.error('Spreadsheet ID not configured');
    return false;
  }

  try {
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

    return true;
  } catch (error) {
    console.error('Error appending to sheet:', error);
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

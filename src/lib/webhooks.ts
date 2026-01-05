import { SubmissionData } from '@/types/diagnostic';

export async function sendCRMWebhook(data: SubmissionData): Promise<boolean> {
  const webhookUrl = process.env.CRM_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log('CRM webhook URL not configured - skipping');
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'business-diagnostic-funnel',
        timestamp: data.timestamp,
        lead: {
          chaosScore: data.chaosScore,
          riskLevel: data.riskLevel,
          answers: data.answers,
          metadata: {
            ip: data.ip,
            country: data.country,
            deviceType: data.deviceType,
          },
        },
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('CRM webhook error:', error);
    return false;
  }
}

export async function sendWhatsAppNotification(data: SubmissionData): Promise<boolean> {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const phoneNumber = process.env.WHATSAPP_PHONE_NUMBER;

  if (!apiUrl || !phoneNumber) {
    console.log('WhatsApp API not configured - skipping');
    return false;
  }

  try {
    const message = `🔔 New Lead Alert!\n\nChaos Score: ${data.chaosScore}/100\nRisk Level: ${data.riskLevel}\nCountry: ${data.country}\nDevice: ${data.deviceType}\n\nGrowth Blocker: ${data.answers.q8}\nSystems: ${data.answers.q9 || 'Not specified'}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: phoneNumber,
        message,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('WhatsApp notification error:', error);
    return false;
  }
}

export async function sendEmailConfirmation(
  _data: SubmissionData,
  _email?: string
): Promise<boolean> {
  const apiKey = process.env.EMAIL_SERVICE_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS;

  if (!apiKey || !fromAddress) {
    console.log('Email service not configured - skipping');
    return false;
  }

  // Placeholder for email service integration
  // Implement with your preferred email service (SendGrid, Resend, etc.)
  console.log('Email confirmation ready to send');
  return true;
}

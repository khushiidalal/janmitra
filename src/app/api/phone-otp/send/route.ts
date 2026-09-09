import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return null;
  return twilio(accountSid, authToken);
}

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    const cleanPhone = String(phone || '').trim();

    if (!cleanPhone) {
      return NextResponse.json(
        { success: false, message: 'Phone number is required' },
        { status: 400 }
      );
    }

    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone.replace(/\D/g, '').slice(-10)}`;
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID || process.env.TWILIO_SERVICE_SID;
    const client = getTwilioClient();

    if (!client || !serviceSid) {
      return NextResponse.json({
        success: true,
        message: 'OTP simulated for development (Twilio not configured)',
        simulated: true,
      });
    }

    const verification = await client.verify.v2.services(serviceSid).verifications.create({
      to: formattedPhone,
      channel: 'sms',
    });

    return NextResponse.json({
      success: true,
      message: 'OTP sent to mobile successfully',
      status: verification.status,
    });
  } catch (error: any) {
    console.error('TWILIO SEND OTP ERROR:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to send Phone OTP' },
      { status: 400 }
    );
  }
}

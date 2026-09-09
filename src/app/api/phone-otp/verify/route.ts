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
    const { phone, otp } = await req.json();
    const cleanPhone = String(phone || '').trim();
    const cleanOtp = String(otp || '').trim();

    if (!cleanPhone || !cleanOtp) {
      return NextResponse.json(
        { success: false, message: 'Phone number and OTP code are required' },
        { status: 400 }
      );
    }

    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone.replace(/\D/g, '').slice(-10)}`;
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID || process.env.TWILIO_SERVICE_SID;
    const client = getTwilioClient();

    if (!client || !serviceSid) {
      return NextResponse.json({
        success: true,
        message: 'OTP verified (simulated for development)',
        status: 'approved',
      });
    }

    const verificationCheck = await client.verify.v2.services(serviceSid).verificationChecks.create({
      to: formattedPhone,
      code: cleanOtp,
    });

    if (verificationCheck.status !== 'approved') {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Phone verified successfully',
      status: verificationCheck.status,
    });
  } catch (error: any) {
    console.error('TWILIO VERIFY OTP ERROR:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'OTP verification failed' },
      { status: 400 }
    );
  }
}

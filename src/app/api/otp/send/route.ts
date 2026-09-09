import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';
import { connectDB } from '@/lib/db';
import EmailOTP from '@/models/EmailOTP';

function hashOTP(otp: string) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'Resend API key is not configured (RESEND_API_KEY)' },
        { status: 500 }
      );
    }

    await connectDB();

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = hashOTP(otp);

    await EmailOTP.findOneAndUpdate(
      { email: normalizedEmail },
      {
        email: normalizedEmail,
        otpHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        verified: false,
      },
      { upsert: true, new: true }
    );

    const resend = new Resend(apiKey);
    const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || 'onboarding@resend.dev';

    const { data: resendData, error } = await resend.emails.send({
      from: fromEmail,
      to: normalizedEmail,
      subject: 'Janmitra Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #123f70;">JANMITRA - Legal Investigation System</h2>
          <p>Your one-time email verification code is:</p>
          <div style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            padding: 16px;
            background: #f1f5f9;
            color: #0f172a;
            text-align: center;
            border-radius: 8px;
            margin: 16px 0;
          ">
            ${otp}
          </div>
          <p style="color: #64748b; font-size: 13px;">This OTP is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this message.</p>
        </div>
      `,
    });

    if (error) {
      console.error('RESEND ERROR:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Unable to send OTP email via Resend' },
        { status: 400 }
      );
    }

    console.log(`✅ Resend OTP sent successfully to ${normalizedEmail} (ID: ${resendData?.id})`);

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email successfully',
      id: resendData?.id,
    });
  } catch (error: any) {
    console.error('SEND OTP ERROR:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to send OTP' },
      { status: 500 }
    );
  }
}

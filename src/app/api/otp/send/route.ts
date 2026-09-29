import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import EmailOTP from '@/models/EmailOTP';
import { getMailer } from '@/lib/server/mailer';

function hashOTP(otp: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters');
  }
  return crypto.createHmac('sha256', secret).update(otp).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, message: 'A valid email is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const now = new Date();
    const existing = await EmailOTP.findOne({ email: normalizedEmail });
    if (existing?.lastSentAt && now.getTime() - existing.lastSentAt.getTime() < 60_000) {
      return NextResponse.json(
        { success: false, message: 'Please wait before requesting another code' },
        { status: 429 }
      );
    }
    const windowStartedAt = existing?.sendWindowStartedAt;
    const sendCount = windowStartedAt && now.getTime() - windowStartedAt.getTime() < 60 * 60_000
      ? existing.sendCount
      : 0;
    if (sendCount >= 5) {
      return NextResponse.json(
        { success: false, message: 'Too many verification codes requested. Try again later.' },
        { status: 429 }
      );
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = hashOTP(otp);

    await EmailOTP.findOneAndUpdate(
      { email: normalizedEmail },
      {
        email: normalizedEmail,
        otpHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        verified: false,
        verifiedAt: null,
        attempts: 0,
        sendCount: sendCount + 1,
        sendWindowStartedAt: sendCount === 0 ? now : windowStartedAt,
        lastSentAt: now,
      },
      { upsert: true, new: true }
    );

    const transporter = getMailer();
    await transporter.sendMail({
      from: `"JANMITRA Security" <${process.env.SMTP_USER}>`,
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

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email successfully',
    });
  } catch (error: any) {
    console.error('Email OTP request failed');
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to send OTP' },
      { status: 500 }
    );
  }
}

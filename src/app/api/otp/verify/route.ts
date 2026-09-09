import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import EmailOTP from '@/models/EmailOTP';

function hashOTP(otp: string) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const cleanOtp = String(otp || '').trim();

    if (!normalizedEmail || !cleanOtp) {
      return NextResponse.json(
        { success: false, message: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const record = await EmailOTP.findOne({ email: normalizedEmail });
    if (!record) {
      return NextResponse.json(
        { success: false, message: 'OTP not found. Please request a new OTP.' },
        { status: 400 }
      );
    }

    if (!record.verified && record.expiresAt < new Date()) {
      await EmailOTP.deleteOne({ _id: record._id });
      return NextResponse.json(
        { success: false, message: 'OTP has expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    if (!record.verified && record.otpHash !== hashOTP(cleanOtp)) {
      return NextResponse.json(
        { success: false, message: 'Invalid OTP' },
        { status: 400 }
      );
    }

    record.verified = true;
    record.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await record.save();

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error: any) {
    console.error('VERIFY OTP ERROR:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'OTP verification failed' },
      { status: 500 }
    );
  }
}

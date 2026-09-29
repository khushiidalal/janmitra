import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import EmailOTP from '@/models/EmailOTP';
import User from '@/models/User';

function hashOTP(otp: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters');
  }
  return crypto.createHmac('sha256', secret).update(otp).digest('hex');
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

    if (record.expiresAt <= new Date()) {
      await EmailOTP.deleteOne({ _id: record._id });
      return NextResponse.json(
        { success: false, message: 'OTP has expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    if (record.verified) {
      return NextResponse.json(
        { success: false, message: 'This verification code has already been used' },
        { status: 400 }
      );
    }

    if (record.attempts >= 5) {
      await EmailOTP.deleteOne({ _id: record._id });
      return NextResponse.json(
        { success: false, message: 'Too many invalid attempts. Request a new code.' },
        { status: 429 }
      );
    }

    const submittedHash = hashOTP(cleanOtp);
    const matches = crypto.timingSafeEqual(
      Buffer.from(record.otpHash, 'hex'),
      Buffer.from(submittedHash, 'hex')
    );
    if (!matches) {
      const failedAttempt = await EmailOTP.findOneAndUpdate(
        { _id: record._id, verified: false, expiresAt: { $gt: new Date() }, attempts: { $lt: 5 } },
        { $inc: { attempts: 1 } },
        { new: true }
      );
      if (!failedAttempt || failedAttempt.attempts >= 5) {
        await EmailOTP.deleteOne({ _id: record._id, verified: false });
        return NextResponse.json(
          { success: false, message: 'Too many invalid attempts. Request a new code.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { success: false, message: 'Invalid OTP' },
        { status: 400 }
      );
    }

    const verified = await EmailOTP.findOneAndUpdate(
      {
        _id: record._id,
        verified: false,
        otpHash: submittedHash,
        expiresAt: { $gt: new Date() },
        attempts: { $lt: 5 },
      },
      { $set: { verified: true, verifiedAt: new Date() } },
      { new: true }
    );
    if (!verified) {
      return NextResponse.json(
        { success: false, message: 'This verification code is invalid or already used' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      existingUser.emailVerified = true;
      await existingUser.save();
      await EmailOTP.deleteOne({ _id: verified._id, verified: true });
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error: any) {
    console.error('Email OTP verification failed');
    return NextResponse.json(
      { success: false, message: error.message || 'OTP verification failed' },
      { status: 500 }
    );
  }
}

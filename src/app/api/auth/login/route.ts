import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/server/auth';
import { recordLoginSecurityEvent } from '@/lib/server/security';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      // Record failed authentication security event
      await recordLoginSecurityEvent({
        req,
        user: user || null,
        attemptedEmail: normalizedEmail,
        status: 'failed',
      });

      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = signToken(user);

    // Record successful login security event
    await recordLoginSecurityEvent({
      req,
      user,
      attemptedEmail: normalizedEmail,
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      token,
      user: user.toJSON(),
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}

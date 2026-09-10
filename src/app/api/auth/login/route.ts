import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

import { connectDB } from '@/lib/db';
import User from '@/models/User';
import TwoFactorToken from '@/models/TwoFactorToken';

import { signToken } from '@/lib/server/auth';
import {
  recordLoginSecurityEvent,
  extractClientIp,
  parseUserAgent,
} from '@/lib/server/security';

import { getMailer } from '@/lib/server/mailer';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email, password, username } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email and password are required',
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select('+password');

    
    
    

    if (!user || !(await user.comparePassword(password))) {
      await recordLoginSecurityEvent({
        req,
        user: user || null,
        attemptedEmail: normalizedEmail,
        status: 'failed',
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    
    
    
    

    if (user.twoFactorEnabled) {
      const verificationEmail =
        user.officialEmail?.trim() || user.email;

      if (!verificationEmail) {
        return NextResponse.json(
          {
            success: false,
            error: 'No verification email is registered.',
          },
          { status: 400 }
        );
      }

      
      const verificationToken =
        crypto.randomBytes(32).toString('hex');

      
      const tokenHash = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

      
      await TwoFactorToken.deleteMany({
        userId: user._id,
        purpose: 'login-2fa',
      });

      
      await TwoFactorToken.create({
        userId: user._id,
        tokenHash,
        purpose: 'login-2fa',
        expiresAt: new Date(
          Date.now() + 10 * 60 * 1000
        ),
      });

      const appUrl =
        process.env.APP_URL ||
        'http://localhost:5000';

      
      const verificationLink =
        `${appUrl}/2fa-login?token=${encodeURIComponent(
          verificationToken
        )}`;

      const transporter = getMailer();

      await transporter.sendMail({
        from: `"JANMITRA Security" <${process.env.SMTP_USER}>`,
        to: verificationEmail,
        subject: 'Verify your JANMITRA login',
        html: `
          <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
            color: #1e293b;
          ">
            <h2>JANMITRA Login Verification</h2>

            <p>Hello ${user.fullName},</p>

            <p>
              Your password was successfully verified.
            </p>

            <p>
              Two-Factor Authentication is enabled on your
              JANMITRA account.
            </p>

            <p>
              Click the button below to complete your login.
            </p>

            <a
              href="${verificationLink}"
              style="
                display: inline-block;
                background: #2563eb;
                color: white;
                padding: 12px 20px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                margin: 12px 0;
              "
            >
              Verify Login
            </a>

            <p>
              This verification link expires in
              <strong>10 minutes</strong>.
            </p>

            <p>
              If you did not attempt to sign in,
              do not click this link.
            </p>

            <hr
              style="
                border: 0;
                border-top: 1px solid #e2e8f0;
                margin: 24px 0;
              "
            />

            <p
              style="
                font-size: 12px;
                color: #64748b;
              "
            >
              JANMITRA Security
            </p>
          </div>
        `,
      });

      
      
      return NextResponse.json({
        success: true,
        requiresTwoFactor: true,
        message:
          'Password verified. A login verification link has been sent to your registered email.',
      });
    }

    
    
    
    

    const sessionId = crypto.randomUUID();

    const ipAddress = extractClientIp(req);

    const userAgent =
      req.headers.get('user-agent') || '';

    const {
      browser,
      operatingSystem,
      deviceType,
    } = parseUserAgent(userAgent);

    const device =
      `${operatingSystem} ${deviceType} · ${browser}`;

    const newSession = {
      sessionId,
      device,
      browser,
      operatingSystem,
      deviceType,
      ipAddress,
      location:
        ipAddress === '127.0.0.1'
          ? 'Local / Secure Intranet'
          : 'Verified Location',
      isTrusted: true,
      createdAt: new Date(),
      lastActive: new Date(),
    };

    if (!Array.isArray(user.sessions)) {
      user.sessions = [];
    }

    user.sessions.unshift(newSession as any);

    if (user.sessions.length > 15) {
      user.sessions =
        user.sessions.slice(0, 15);
    }

    await user.save();

    const token =
      signToken(user, sessionId);

    await recordLoginSecurityEvent({
      req,
      user,
      attemptedEmail: normalizedEmail,
      status: 'success',
    });

    const userJson: any =
      user.toJSON();

    userJson.currentSessionId =
      sessionId;

    userJson.username =
      userJson.username ||
      (user as any).username ||
      (typeof username === 'string' && username.trim() ? username.trim() : '') ||
      (user.email ? user.email.split('@')[0] : '');

    return NextResponse.json({
      success: true,
      token,
      user: userJson,
      requiresTwoFactor: false,
    });
  } catch (error: any) {
    console.error(
      'Login error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          'Login failed',
      },
      { status: 500 }
    );
  }
}
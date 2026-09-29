import jwt from 'jsonwebtoken';
import { NextResponse, type NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import User, { type IUser } from '@/models/User';
import AuthorizedAdmin from '@/models/AuthorizedAdmin';

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as any;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters');
  }
  return secret;
}

export interface TokenPayload {
  id: string;
  sessionId?: string;
}

export function signToken(user: { _id?: any; id?: any }, sessionId?: string): string {
  const id = user.id || user._id;
  const payload: TokenPayload = {
    id: id.toString(),
    ...(sessionId ? { sessionId } : {}),
  };
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, getJwtSecret()) as TokenPayload;
}

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function isAuthorizedAdmin(user: Pick<IUser, 'email' | 'emailVerified'>): Promise<boolean> {
  if (!user.emailVerified) return false;
  const email = user.email?.trim();
  if (!email) return false;

  // Email casing can differ in legacy allowlist records, so compare it
  // case-insensitively while retaining every existing authorization check.
  const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Boolean(await AuthorizedAdmin.exists({
    email: { $regex: `^${escapedEmail}$`, $options: 'i' },
    active: true,
    verifiedAt: { $type: 'date' },
    verifiedBy: { $type: 'string', $ne: '' },
  }));
}

export async function applyAdminAccess(user: IUser): Promise<void> {
  const hasAdminDesignation = user.designation?.trim().toLowerCase() === 'admin';
  if (hasAdminDesignation || await isAuthorizedAdmin(user)) {
    user.role = 'Admin';
  }
}

export async function getAuthenticatedUserFromToken(token: string): Promise<IUser | null> {
  try {
    const decoded = verifyToken(token);
    if (!decoded?.id) return null;

    await connectDB();
    const user = await User.findById(decoded.id);
    if (!user) return null;

    if (decoded.sessionId) {
      const activeSession = user.sessions?.find((session) => session.sessionId === decoded.sessionId);
      if (!activeSession) return null;
      User.updateOne(
        { _id: user._id, 'sessions.sessionId': decoded.sessionId },
        { $set: { 'sessions.$.lastActive': new Date() } }
      ).catch(() => {});
    }

    await applyAdminAccess(user);
    (user as any).currentSessionId = decoded.sessionId;
    return user;
  } catch {
    return null;
  }
}

export async function getAuthenticatedUser(req: NextRequest): Promise<IUser | null> {
  let token: string | undefined;

  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    token = req.cookies.get('token')?.value ||
            req.cookies.get('kora_token')?.value ||
            req.cookies.get('auth_token')?.value;
  }

  if (!token) return null;

  return getAuthenticatedUserFromToken(token);
}

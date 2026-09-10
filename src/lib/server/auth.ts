import jwt from 'jsonwebtoken';
import type { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import User, { type IUser } from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'janmitra_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as any;

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
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export async function getAuthenticatedUser(req: NextRequest): Promise<IUser | null> {
  let token: string | undefined;

  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // Fallback to cookies if Bearer header is not present
  if (!token) {
    token = req.cookies.get('token')?.value ||
            req.cookies.get('kora_token')?.value ||
            req.cookies.get('auth_token')?.value;
  }

  if (!token) return null;

  try {
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) return null;

    await connectDB();
    const user = await User.findById(decoded.id);
    if (!user) return null;

    // If token has a sessionId and user has tracked sessions, verify it has not been revoked
    if (decoded.sessionId && Array.isArray(user.sessions) && user.sessions.length > 0) {
      const activeSession = user.sessions.find((s) => s.sessionId === decoded.sessionId);
      if (!activeSession) {
        return null;
      }
      User.updateOne(
        { _id: user._id, 'sessions.sessionId': decoded.sessionId },
        { $set: { 'sessions.$.lastActive': new Date() } }
      ).catch(() => {});
    }

    (user as any).currentSessionId = decoded.sessionId;
    return user;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

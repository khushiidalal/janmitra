import jwt from 'jsonwebtoken';
import type { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import User, { type IUser } from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'janmitra_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as any;

export function signToken(user: { _id?: any; id?: any }): string {
  const id = user.id || user._id;
  return jwt.sign({ id: id.toString() }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): { id: string } {
  return jwt.verify(token, JWT_SECRET) as { id: string };
}

export async function getAuthenticatedUser(req: NextRequest): Promise<IUser | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  if (!token) return null;

  try {
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) return null;

    await connectDB();
    const user = await User.findById(decoded.id);
    return user;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

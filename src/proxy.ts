import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server/auth';

export async function proxy(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user || user.role !== 'Admin') {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Administrator access required' },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/audit-trail/:path*'],
};
